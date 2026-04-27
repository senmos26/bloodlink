CREATE OR REPLACE FUNCTION public.get_my_profile_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_recent_donations jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT COALESCE(
    jsonb_agg(donation_item ORDER BY donation_date DESC),
    '[]'::jsonb
  )
  INTO v_recent_donations
  FROM (
    SELECT
      d.donation_date,
      jsonb_build_object(
        'id', d.id,
        'center_name', COALESCE(c.name, 'Centre inconnu'),
        'donation_date', d.donation_date,
        'status', d.status,
        'volume_ml', d.volume_ml
      ) AS donation_item
    FROM public.donations d
    LEFT JOIN public.centers c ON c.id = d.center_id
    WHERE d.donor_id = auth.uid()
    ORDER BY d.donation_date DESC
    LIMIT 5
  ) recent_donations;

  RETURN jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'recent_donations', v_recent_donations
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_profile(
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_blood_type public.blood_type DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_weight_kg numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_full_name text;
  v_phone text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  v_full_name := NULLIF(BTRIM(COALESCE(p_full_name, '')), '');
  v_phone := NULLIF(BTRIM(COALESCE(p_phone, '')), '');

  IF p_weight_kg IS NOT NULL AND p_weight_kg < 50 THEN
    RAISE EXCEPTION 'Weight must be greater than or equal to 50';
  END IF;

  UPDATE public.profiles
  SET
    full_name = COALESCE(v_full_name, public.profiles.full_name),
    phone = CASE WHEN p_phone IS NULL THEN public.profiles.phone ELSE v_phone END,
    blood_type = COALESCE(p_blood_type, public.profiles.blood_type),
    date_of_birth = CASE WHEN p_date_of_birth IS NULL THEN public.profiles.date_of_birth ELSE p_date_of_birth END,
    weight_kg = CASE WHEN p_weight_kg IS NULL THEN public.profiles.weight_kg ELSE p_weight_kg END,
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  RETURN to_jsonb(v_profile);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile_dashboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile_dashboard() TO authenticated;

REVOKE ALL ON FUNCTION public.update_my_profile(text, text, public.blood_type, date, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(text, text, public.blood_type, date, numeric) TO authenticated;
