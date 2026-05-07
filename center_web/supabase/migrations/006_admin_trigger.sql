-- ============================================================================
-- PROSAFETY ENGINEERING - AUTO-CREATE ADMIN PROFILE TRIGGER
-- ============================================================================
-- Crée automatiquement un profil admin pour chaque nouvel utilisateur
-- ============================================================================

-- Fonction trigger pour créer le profil admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mettre à jour les profils admin existants pour les utilisateurs sans profil
INSERT INTO public.admin_profiles (id, name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'admin'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_profiles ap WHERE ap.id = u.id
)
ON CONFLICT (id) DO NOTHING;
