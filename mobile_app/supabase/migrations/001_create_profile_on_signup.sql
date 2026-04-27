-- Migration: Auto-create profile on signup + RLS policies
-- Date: 2025-04-27
-- Description: Trigger to sync auth.users -> public.profiles on registration

-- Function: create/update profile from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, blood_type)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'full_name',
      'Nouvel utilisateur'
    ),
    (NEW.raw_user_meta_data->>'blood_group')::public.blood_type
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(
      (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'full_name',
      public.profiles.full_name
    ),
    blood_type = COALESCE((NEW.raw_user_meta_data->>'blood_group')::public.blood_type, public.profiles.blood_type),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: run on every auth user insert/update
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policy: read own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
