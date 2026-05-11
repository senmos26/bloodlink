-- Fix: handle_new_user trigger should read blood_type from user metadata
-- Previously, blood_type was never inserted into profiles on signup,
-- causing all new donors to have NULL blood_type.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone,
        blood_type,
        role, 
        is_active
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'blood_type', NULL),
        'donor',
        TRUE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
