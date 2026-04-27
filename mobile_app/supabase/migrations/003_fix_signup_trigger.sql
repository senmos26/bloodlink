-- Migration: Fix signup trigger to handle errors gracefully
-- Date: 2025-04-27
-- Problem: Previous trigger failed on blood_type cast, blocking auth signup

-- Drop previous trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create safer function with exception handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_blood_group TEXT;
  v_blood_type public.blood_type;
BEGIN
  -- Extract metadata safely
  v_full_name := COALESCE(
    NULLIF((NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'), ' '),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    'Nouvel utilisateur'
  );

  v_blood_group := NEW.raw_user_meta_data->>'blood_group';

  -- Safe cast to blood_type enum
  IF v_blood_group IS NOT NULL AND v_blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') THEN
    v_blood_type := v_blood_group::public.blood_type;
  ELSE
    v_blood_type := NULL;
  END IF;

  -- Insert or update profile
  INSERT INTO public.profiles (id, full_name, blood_type)
  VALUES (NEW.id, v_full_name, v_blood_type)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    blood_type = COALESCE(EXCLUDED.blood_type, public.profiles.blood_type),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but do NOT block auth signup
  RAISE LOG 'BloodLink: Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
