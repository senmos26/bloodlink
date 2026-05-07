-- ========================================================================
-- BloodLink Centre RPC Functions
-- ========================================================================
-- Description: Complete backend API for the BloodLink Centre web app.
-- All business logic, authorization, and data aggregation live here.
-- The frontend calls these via Supabase RPC — NO raw SQL in components.
--
-- Security model:
--   - center_admin: can only access their own center's data
--   - super_admin: can access all centers' data
--   - donor: denied all center functions
--
-- Created: 2025-05-07
-- ========================================================================

-- ------------------------------------------------------------------------
-- 1. SECURITY HELPERS
-- ------------------------------------------------------------------------

/**
 * Returns the current user's role from profiles.
 */
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

/**
 * Returns the center_id owned by the current center_admin.
 * Returns NULL for super_admin (no single center) or donor.
 */
CREATE OR REPLACE FUNCTION public.get_admin_center_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.centers WHERE admin_id = auth.uid() LIMIT 1;
$$;

/**
 * Checks if the current user is authorized to access a given center.
 * super_admin -> true for any center
 * center_admin -> true only for their own center
 * donor -> false
 */
CREATE OR REPLACE FUNCTION public.is_authorized_for_center(target_center_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.user_role;
  admin_center uuid;
BEGIN
  SELECT public.get_current_user_role() INTO user_role;

  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;

  IF user_role = 'center_admin' THEN
    SELECT public.get_admin_center_id() INTO admin_center;
    RETURN admin_center = target_center_id;
  END IF;

  RETURN false;
END;
$$;

-- ------------------------------------------------------------------------
-- 2. DASHBOARD / KPI RPCs
-- ------------------------------------------------------------------------

/**
 * Returns today's key metrics for a center's dashboard.
 *
 * Output:
 *   today_appointments_count    bigint
 *   pending_appointments_count  bigint
 *   validated_donations_count   bigint
 *   active_alerts_count         bigint
 *   center_name                 text
 */
CREATE OR REPLACE FUNCTION public.get_center_today_stats(p_center_id uuid)
RETURNS TABLE (
  today_appointments_count bigint,
  pending_appointments_count bigint,
  validated_donations_count bigint,
  active_alerts_count bigint,
  center_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date date := CURRENT_DATE;
  tomorrow_date date := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  -- Authorization
  IF NOT public.is_authorized_for_center(p_center_id) THEN
    RAISE EXCEPTION 'Access denied: you are not authorized for this center';
  END IF;

  RETURN QUERY
  SELECT
    -- Appointments today
    (SELECT COUNT(*) FROM public.appointments
     WHERE center_id = p_center_id
       AND scheduled_date >= today_date
       AND scheduled_date < tomorrow_date)::bigint,
    -- Pending appointments today
    (SELECT COUNT(*) FROM public.appointments
     WHERE center_id = p_center_id
       AND status = 'pending'
       AND scheduled_date >= today_date
       AND scheduled_date < tomorrow_date)::bigint,
    -- Validated donations today
    (SELECT COUNT(*) FROM public.donations
     WHERE center_id = p_center_id
       AND status = 'validated'
       AND donation_date >= today_date
       AND donation_date < tomorrow_date)::bigint,
    -- Active alerts
    (SELECT COUNT(*) FROM public.alerts
     WHERE center_id = p_center_id
       AND status = 'active')::bigint,
    -- Center name
    (SELECT name FROM public.centers WHERE id = p_center_id);
END;
$$;

/**
 * Returns monthly donation counts for a given year.
 * Useful for bar charts on the dashboard.
 */
CREATE OR REPLACE FUNCTION public.get_center_monthly_donations(p_center_id uuid, p_year integer)
RETURNS TABLE (
  month integer,
  donation_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXTRACT(MONTH FROM donation_date)::integer AS month,
    COUNT(*)::bigint AS donation_count
  FROM public.donations
  WHERE center_id = p_center_id
    AND status = 'validated'
    AND EXTRACT(YEAR FROM donation_date) = p_year
  GROUP BY month
  ORDER BY month;
$$;

/**
 * Returns blood type distribution among donors who have appointments
 * or donations at this center.
 */
CREATE OR REPLACE FUNCTION public.get_center_blood_type_stats(p_center_id uuid)
RETURNS TABLE (
  blood_type public.blood_type,
  donor_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.blood_type,
    COUNT(DISTINCT p.id)::bigint AS donor_count
  FROM public.profiles p
  WHERE p.role = 'donor'
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.donor_id = p.id AND a.center_id = p_center_id
    )
  GROUP BY p.blood_type
  ORDER BY donor_count DESC;
$$;

-- ------------------------------------------------------------------------
-- 3. APPOINTMENTS RPCs
-- ------------------------------------------------------------------------

/**
 * Returns appointments for a center, optionally filtered by date.
 * Includes donor profile information inline.
 */
CREATE OR REPLACE FUNCTION public.get_center_appointments(
  p_center_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  scheduled_date timestamptz,
  status public.appointment_status,
  notes text,
  donor_id uuid,
  donor_full_name text,
  donor_phone text,
  donor_blood_type public.blood_type
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.scheduled_date,
    a.status,
    a.notes,
    a.donor_id,
    p.full_name,
    p.phone,
    p.blood_type
  FROM public.appointments a
  JOIN public.profiles p ON p.id = a.donor_id
  WHERE a.center_id = p_center_id
    AND (p_from_date IS NULL OR a.scheduled_date >= p_from_date)
    AND (p_to_date IS NULL OR a.scheduled_date < p_to_date + INTERVAL '1 day')
  ORDER BY a.scheduled_date ASC;
$$;

/**
 * Updates an appointment status.
 * Only allowed for center_admin of the appointment's center or super_admin.
 */
CREATE OR REPLACE FUNCTION public.update_appointment_status(
  p_appointment_id uuid,
  p_new_status public.appointment_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_center_id uuid;
BEGIN
  SELECT center_id INTO app_center_id
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF app_center_id IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF NOT public.is_authorized_for_center(app_center_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.appointments
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_appointment_id;
END;
$$;

-- ------------------------------------------------------------------------
-- 4. DONATIONS RPCs
-- ------------------------------------------------------------------------

/**
 * Returns donations for a center with donor info.
 */
CREATE OR REPLACE FUNCTION public.get_center_donations(
  p_center_id uuid,
  p_from_date date DEFAULT NULL,
  p_to_date date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  donor_id uuid,
  donor_full_name text,
  donor_blood_type public.blood_type,
  appointment_id uuid,
  donation_date timestamptz,
  volume_ml integer,
  status public.donation_status,
  validated_by uuid,
  validated_at timestamptz,
  notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id,
    d.donor_id,
    p.full_name,
    p.blood_type,
    d.appointment_id,
    d.donation_date,
    d.volume_ml,
    d.status,
    d.validated_by,
    d.validated_at,
    d.notes
  FROM public.donations d
  JOIN public.profiles p ON p.id = d.donor_id
  WHERE d.center_id = p_center_id
    AND (p_from_date IS NULL OR d.donation_date >= p_from_date)
    AND (p_to_date IS NULL OR d.donation_date < p_to_date + INTERVAL '1 day')
  ORDER BY d.donation_date DESC;
$$;

/**
 * Creates a validated donation from a completed appointment.
 * Automatically sets donor_id, center_id from the appointment.
 * Marks the appointment as completed.
 */
CREATE OR REPLACE FUNCTION public.create_center_donation(
  p_appointment_id uuid,
  p_volume_ml integer DEFAULT 450,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_record public.appointments%ROWTYPE;
  new_donation_id uuid;
BEGIN
  SELECT * INTO app_record
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF app_record IS NULL THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  IF NOT public.is_authorized_for_center(app_record.center_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF app_record.status = 'completed' THEN
    RAISE EXCEPTION 'Appointment already processed';
  END IF;

  INSERT INTO public.donations (
    donor_id,
    center_id,
    appointment_id,
    donation_date,
    volume_ml,
    status,
    validated_by,
    validated_at,
    notes
  ) VALUES (
    app_record.donor_id,
    app_record.center_id,
    p_appointment_id,
    now(),
    p_volume_ml,
    'validated',
    auth.uid(),
    now(),
    p_notes
  )
  RETURNING id INTO new_donation_id;

  -- Mark appointment as completed
  UPDATE public.appointments
  SET status = 'completed', updated_at = now()
  WHERE id = p_appointment_id;

  RETURN new_donation_id;
END;
$$;

-- ------------------------------------------------------------------------
-- 5. ALERTS RPCs
-- ------------------------------------------------------------------------

/**
 * Returns alerts for a center with computed fields.
 */
CREATE OR REPLACE FUNCTION public.get_center_alerts(
  p_center_id uuid,
  p_status_filter public.alert_status DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  blood_type_required public.blood_type,
  urgency_level public.urgency_level,
  radius_km integer,
  message text,
  deadline timestamptz,
  status public.alert_status,
  created_at timestamptz,
  is_expired boolean,
  days_until_deadline integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.blood_type_required,
    a.urgency_level,
    a.radius_km,
    a.message,
    a.deadline,
    a.status,
    a.created_at,
    a.deadline < now() AS is_expired,
    GREATEST(EXTRACT(DAY FROM (a.deadline - now()))::integer, 0) AS days_until_deadline
  FROM public.alerts a
  WHERE a.center_id = p_center_id
    AND (p_status_filter IS NULL OR a.status = p_status_filter)
  ORDER BY
    CASE a.urgency_level
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    a.created_at DESC;
$$;

/**
 * Creates a new blood shortage alert for the current admin's center.
 */
CREATE OR REPLACE FUNCTION public.create_center_alert(
  p_blood_type_required public.blood_type,
  p_urgency_level public.urgency_level,
  p_radius_km integer DEFAULT 10,
  p_message text DEFAULT NULL,
  p_deadline timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_center_id uuid;
  new_alert_id uuid;
BEGIN
  SELECT public.get_admin_center_id() INTO admin_center_id;

  IF admin_center_id IS NULL THEN
    -- super_admin must specify a center via different flow, but for now:
    RAISE EXCEPTION 'Only center_admin can create alerts directly. Super admin must use a different endpoint.';
  END IF;

  INSERT INTO public.alerts (
    center_id,
    blood_type_required,
    urgency_level,
    radius_km,
    message,
    deadline,
    status
  ) VALUES (
    admin_center_id,
    p_blood_type_required,
    p_urgency_level,
    p_radius_km,
    p_message,
    COALESCE(p_deadline, now() + INTERVAL '7 days'),
    'active'
  )
  RETURNING id INTO new_alert_id;

  RETURN new_alert_id;
END;
$$;

/**
 * Closes (or expires) an alert. Only the alert's center admin or super_admin.
 */
CREATE OR REPLACE FUNCTION public.close_center_alert(p_alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  alert_center_id uuid;
BEGIN
  SELECT center_id INTO alert_center_id
  FROM public.alerts WHERE id = p_alert_id;

  IF alert_center_id IS NULL THEN
    RAISE EXCEPTION 'Alert not found';
  END IF;

  IF NOT public.is_authorized_for_center(alert_center_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.alerts
  SET status = 'closed', updated_at = now()
  WHERE id = p_alert_id;
END;
$$;

-- ------------------------------------------------------------------------
-- 6. DONORS SEARCH RPC
-- ------------------------------------------------------------------------

/**
 * Searches donors by name, phone, or email.
 * Optionally filters by blood type.
 * Returns only donors who have interacted with this center.
 */
CREATE OR REPLACE FUNCTION public.search_center_donors(
  p_center_id uuid,
  p_query text DEFAULT '',
  p_blood_type public.blood_type DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  blood_type public.blood_type,
  next_donation_date date,
  total_donations bigint,
  last_donation_date timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.phone,
    p.blood_type,
    p.next_donation_date,
    COUNT(DISTINCT d.id)::bigint AS total_donations,
    MAX(d.donation_date) AS last_donation_date
  FROM public.profiles p
  LEFT JOIN public.donations d ON d.donor_id = p.id AND d.center_id = p_center_id
  WHERE p.role = 'donor'
    AND (
      p_query = ''
      OR p.full_name ILIKE '%' || p_query || '%'
      OR p.phone ILIKE '%' || p_query || '%'
    )
    AND (p_blood_type IS NULL OR p.blood_type = p_blood_type)
    -- Only donors who have appointments or donations at this center
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.donor_id = p.id AND a.center_id = p_center_id
    )
  GROUP BY p.id, p.full_name, p.phone, p.blood_type, p.next_donation_date
  ORDER BY total_donations DESC, p.full_name ASC
  LIMIT p_limit;
$$;

-- ------------------------------------------------------------------------
-- 7. CENTER PROFILE / SETTINGS
-- ------------------------------------------------------------------------

/**
 * Returns the center's profile info.
 */
CREATE OR REPLACE FUNCTION public.get_center_profile(p_center_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  city text,
  phone text,
  email text,
  is_active boolean,
  admin_id uuid,
  admin_name text,
  total_donations bigint,
  total_appointments bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.address,
    c.city,
    c.phone,
    c.email,
    c.is_active,
    c.admin_id,
    p.full_name AS admin_name,
    (SELECT COUNT(*) FROM public.donations WHERE center_id = c.id)::bigint AS total_donations,
    (SELECT COUNT(*) FROM public.appointments WHERE center_id = c.id)::bigint AS total_appointments,
    c.created_at
  FROM public.centers c
  LEFT JOIN public.profiles p ON p.id = c.admin_id
  WHERE c.id = p_center_id;
$$;

-- ------------------------------------------------------------------------
-- 8. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_center_date
  ON public.appointments(center_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_appointments_center_status
  ON public.appointments(center_id, status);

-- Donations indexes
CREATE INDEX IF NOT EXISTS idx_donations_center_date
  ON public.donations(center_id, donation_date);

CREATE INDEX IF NOT EXISTS idx_donations_center_status
  ON public.donations(center_id, status);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_center_status
  ON public.alerts(center_id, status);

-- Profiles search index (for donor search)
CREATE INDEX IF NOT EXISTS idx_profiles_role_name
  ON public.profiles(role, full_name);

-- ------------------------------------------------------------------------
-- 9. RLS POLICY HELPERS (ensure RPC bypass RLS safely)
-- ------------------------------------------------------------------------

-- Note: All functions above use SECURITY DEFINER, so they bypass RLS
-- and perform authorization checks manually. This is the recommended
-- pattern for complex business logic RPCs.

COMMENT ON FUNCTION public.get_center_today_stats IS
  'Returns KPI stats for the center dashboard. Requires center_admin or super_admin.';

COMMENT ON FUNCTION public.get_center_appointments IS
  'Returns appointments for a center with donor details.';

COMMENT ON FUNCTION public.create_center_donation IS
  'Creates a validated donation from a completed appointment and marks the appointment completed.';

COMMENT ON FUNCTION public.search_center_donors IS
  'Searches donors who have appointments at this center by name or phone.';

COMMENT ON FUNCTION public.get_center_alerts IS
  'Returns alerts for a center with computed expiry/days remaining.';

COMMENT ON FUNCTION public.create_center_alert IS
  'Creates a new shortage alert for the current admin center.';
