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

  -- CRITICAL FIX: Use ON CONFLICT DO NOTHING.
  -- Previously the trigger was ON INSERT/UPDATE on auth.users. When a user logs in,
  -- Supabase updates auth.users (last_sign_in_at, etc.), firing this trigger.
  -- The old ON CONFLICT DO UPDATE was overwriting role, full_name, and blood_type
  -- on every login, silently reverting any manual changes (e.g. super_admin -> donor).
  -- Now we only create the profile on first auth user creation, and never touch it again.
  INSERT INTO public.profiles (id, full_name, blood_type, role)
  VALUES (NEW.id, v_full_name, v_blood_type, v_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'BloodLink: Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
