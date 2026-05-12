-- CRITICAL FIX: handle_new_user trigger was overwriting role on every auth.users update
-- The trigger was configured ON INSERT/UPDATE on auth.users. When a user logs in,
-- Supabase updates auth.users (last_sign_in_at, etc.), firing the trigger which did:
--   ON CONFLICT (id) DO UPDATE SET role = COALESCE(EXCLUDED.role, profiles.role)
-- Since EXCLUDED.role defaults to 'donor' when app_metadata has no role, this would
-- silently revert any manually changed role (e.g. super_admin → donor) on every login.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_blood_group TEXT;
  v_blood_type public.blood_type;
  v_role public.user_role;
BEGIN
  v_full_name := COALESCE(
    NULLIF((NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'), ' '),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    'Nouvel utilisateur'
  );

  v_blood_group := NEW.raw_user_meta_data->>'blood_group';

  IF v_blood_group IS NOT NULL AND v_blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
    v_blood_type := v_blood_group::public.blood_type;
  ELSE
    v_blood_type := NULL;
  END IF;

  v_role := COALESCE(
    (NEW.raw_app_meta_data->>'role')::public.user_role,
    'donor'::public.user_role
  );

  INSERT INTO public.profiles (id, full_name, blood_type, role)
  VALUES (NEW.id, v_full_name, v_blood_type, v_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    blood_type = COALESCE(EXCLUDED.blood_type, public.profiles.blood_type),
    -- CRITICAL: Never overwrite role on existing profiles.
    -- The role is only set once on initial insert (by app_metadata for admin accounts,
    -- or default 'donor' for self-registered accounts). Manual role changes must persist.
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'BloodLink: Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
