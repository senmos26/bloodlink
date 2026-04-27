-- Migration: Make profiles.phone nullable and backfill missing profiles
-- Date: 2026-04-27

ALTER TABLE public.profiles
ALTER COLUMN phone DROP NOT NULL;

INSERT INTO public.profiles (id, full_name, blood_type)
SELECT
  u.id,
  COALESCE(
    NULLIF((u.raw_user_meta_data->>'first_name') || ' ' || (u.raw_user_meta_data->>'last_name'), ' '),
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    'Nouvel utilisateur'
  ),
  CASE
    WHEN u.raw_user_meta_data->>'blood_group' IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
      THEN (u.raw_user_meta_data->>'blood_group')::public.blood_type
    ELSE NULL
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
