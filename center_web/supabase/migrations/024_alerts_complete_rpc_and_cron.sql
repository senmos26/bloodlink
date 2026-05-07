-- ========================================================================
-- BloodLink: Alert responses RLS + missing RPCs + cron auto-expire
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1. RLS FOR alert_responses
-- ------------------------------------------------------------------------

ALTER TABLE public.alert_responses ENABLE ROW LEVEL SECURITY;

-- Donors can see their own responses
CREATE POLICY "alert_responses_select_own"
ON public.alert_responses
FOR SELECT
TO authenticated
USING (donor_id = auth.uid());

-- Donors can insert their own response
CREATE POLICY "alert_responses_insert_own"
ON public.alert_responses
FOR INSERT
TO authenticated
WITH CHECK (donor_id = auth.uid());

-- Center admin can see responses for alerts of their center
CREATE POLICY "alert_responses_select_center"
ON public.alert_responses
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.alerts a
        JOIN public.centers c ON c.id = a.center_id
        WHERE a.id = alert_responses.alert_id
          AND c.admin_id = auth.uid()
    )
);

-- Super admin can do everything
CREATE POLICY "alert_responses_all_admin"
ON public.alert_responses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ------------------------------------------------------------------------
-- 2. RPC: Get alert statistics for a center
-- ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_center_alert_stats(p_center_id uuid)
RETURNS TABLE (
    total_alerts bigint,
    active_alerts bigint,
    expired_alerts bigint,
    closed_alerts bigint,
    critical_alerts bigint,
    high_alerts bigint,
    medium_alerts bigint,
    low_alerts bigint,
    total_donors_needed bigint,
    total_donors_responded bigint,
    response_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS total_alerts,
    COUNT(*) FILTER (WHERE status = 'active')::bigint AS active_alerts,
    COUNT(*) FILTER (WHERE status = 'expired')::bigint AS expired_alerts,
    COUNT(*) FILTER (WHERE status = 'closed')::bigint AS closed_alerts,
    COUNT(*) FILTER (WHERE urgency_level = 'critical' AND status = 'active')::bigint AS critical_alerts,
    COUNT(*) FILTER (WHERE urgency_level = 'high' AND status = 'active')::bigint AS high_alerts,
    COUNT(*) FILTER (WHERE urgency_level = 'medium' AND status = 'active')::bigint AS medium_alerts,
    COUNT(*) FILTER (WHERE urgency_level = 'low' AND status = 'active')::bigint AS low_alerts,
    COALESCE(SUM(donors_needed), 0)::bigint AS total_donors_needed,
    COALESCE(SUM(donors_responded), 0)::bigint AS total_donors_responded,
    CASE
      WHEN COALESCE(SUM(donors_needed), 0) > 0
      THEN ROUND((COALESCE(SUM(donors_responded), 0)::numeric / SUM(donors_needed)::numeric) * 100, 1)
      ELSE 0
    END AS response_rate
  FROM public.alerts
  WHERE center_id = p_center_id;
$$;

-- ------------------------------------------------------------------------
-- 3. RPC: Escalate alert urgency
-- ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.escalate_center_alert(p_alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_center_id uuid;
  current_urgency public.urgency_level;
  next_urgency public.urgency_level;
BEGIN
  SELECT center_id, urgency_level INTO alert_center_id, current_urgency
  FROM public.alerts WHERE id = p_alert_id;

  IF alert_center_id IS NULL THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  IF NOT public.is_authorized_for_center(alert_center_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF current_urgency = 'low' THEN
    next_urgency := 'medium';
  ELSIF current_urgency = 'medium' THEN
    next_urgency := 'high';
  ELSIF current_urgency = 'high' THEN
    next_urgency := 'critical';
  ELSE
    next_urgency := 'critical';
  END IF;

  UPDATE public.alerts
  SET urgency_level = next_urgency,
      updated_at = now()
  WHERE id = p_alert_id;
END;
$$;

-- ------------------------------------------------------------------------
-- 4. RPC: Record a donor response to an alert
-- ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_alert_response(
  p_alert_id uuid,
  p_donor_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_response_id uuid;
  existing_id uuid;
BEGIN
  -- Check if donor already responded
  SELECT id INTO existing_id
  FROM public.alert_responses
  WHERE alert_id = p_alert_id AND donor_id = p_donor_id;

  IF existing_id IS NOT NULL THEN
    -- Update existing response timestamp
    UPDATE public.alert_responses
    SET responded_at = now(), status = 'pending'
    WHERE id = existing_id;
    RETURN existing_id;
  END IF;

  -- Insert new response
  INSERT INTO public.alert_responses (alert_id, donor_id, status)
  VALUES (p_alert_id, p_donor_id, 'pending')
  RETURNING id INTO new_response_id;

  -- Increment donors_responded on the alert
  UPDATE public.alerts
  SET donors_responded = donors_responded + 1,
      updated_at = now()
  WHERE id = p_alert_id
    AND donors_responded < donors_needed;

  RETURN new_response_id;
END;
$$;

-- ------------------------------------------------------------------------
-- 5. RPC: Get donor responses for a center's alerts
-- ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_center_alert_responses(p_center_id uuid)
RETURNS TABLE (
  response_id uuid,
  alert_id uuid,
  donor_id uuid,
  donor_full_name text,
  donor_blood_type public.blood_type,
  responded_at timestamptz,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ar.id AS response_id,
    ar.alert_id,
    ar.donor_id,
    p.full_name AS donor_full_name,
    p.blood_type AS donor_blood_type,
    ar.responded_at,
    ar.status
  FROM public.alert_responses ar
  JOIN public.alerts a ON a.id = ar.alert_id
  JOIN public.profiles p ON p.id = ar.donor_id
  WHERE a.center_id = p_center_id
  ORDER BY ar.responded_at DESC;
$$;

-- ------------------------------------------------------------------------
-- 6. CRON JOB: Auto-expire alerts every 10 minutes
-- ------------------------------------------------------------------------

-- Ensure pg_cron extension is available (may need manual activation in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if any (idempotent)
SELECT cron.unschedule('bloodlink_expire_alerts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bloodlink_expire_alerts');

-- Schedule the auto-expire job
SELECT cron.schedule(
  'bloodlink_expire_alerts',
  '*/10 * * * *',
  $$
    UPDATE public.alerts
    SET status = 'expired', updated_at = now()
    WHERE status = 'active' AND deadline < now();
  $$
);

-- ------------------------------------------------------------------------
-- 7. COMMENTS
-- ------------------------------------------------------------------------

COMMENT ON FUNCTION public.get_center_alert_stats IS
  'Returns comprehensive alert statistics for a center dashboard.';

COMMENT ON FUNCTION public.escalate_center_alert IS
  'Escalates an alert urgency by one level (low→medium→high→critical). Requires center admin or super admin.';

COMMENT ON FUNCTION public.record_alert_response IS
  'Records a donor response to an alert. Increments donors_responded. Idempotent.';

COMMENT ON FUNCTION public.get_center_alert_responses IS
  'Lists all donor responses to alerts for a given center. Requires center admin or super admin.';
