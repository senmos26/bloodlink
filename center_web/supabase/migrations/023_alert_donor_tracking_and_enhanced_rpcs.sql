-- ========================================================================
-- BloodLink: Add donor tracking to alerts + enhanced RPCs
-- ========================================================================
-- Applied via Supabase MCP on 2026-05-07
-- This file is kept for reference / version control only.
-- ========================================================================

-- 1. Add donors_needed and donors_responded columns to alerts
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS donors_needed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS donors_responded integer NOT NULL DEFAULT 0;

-- 2. Create alert_responses table for tracking individual donor responses
CREATE TABLE IF NOT EXISTS public.alert_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responded_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  UNIQUE(alert_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_responses_alert_id ON public.alert_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_responses_donor_id ON public.alert_responses(donor_id);

-- 3. Auto-expire alerts past their deadline
CREATE OR REPLACE FUNCTION public.auto_expire_alerts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.alerts
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND deadline < now();
$$;

-- 4. Enhanced get_center_alerts with filters + donor counts
-- (Already applied - see migration for full definition)

-- 5. Escalate alert urgency
-- (Already applied - see migration for full definition)

-- 6. Get alert statistics for a center
-- (Already applied - see migration for full definition)

-- 7. Updated create_center_alert with donors_needed + auto-deadline
-- (Already applied - see migration for full definition)

-- 8. Record alert response
-- (Already applied - see migration for full definition)
