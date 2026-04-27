ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_path text;

CREATE OR REPLACE FUNCTION public.get_my_profile_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
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

DROP FUNCTION IF EXISTS public.update_my_profile_avatar(text);

CREATE OR REPLACE FUNCTION public.update_my_profile_avatar(
  p_avatar_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_avatar_path text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_avatar_path := NULLIF(BTRIM(COALESCE(p_avatar_path, '')), '');

  UPDATE public.profiles
  SET
    avatar_path = v_avatar_path,
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO v_profile;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN to_jsonb(v_profile);
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile_avatar(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile_avatar(text) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can view own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile avatars" ON storage.objects;

CREATE POLICY "Users can view own profile avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can upload own profile avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can update own profile avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can delete own profile avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
