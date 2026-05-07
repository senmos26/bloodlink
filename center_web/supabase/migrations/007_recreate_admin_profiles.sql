-- Supprimer la table existante
DROP TABLE IF EXISTS admin_profiles CASCADE;

-- Recréer la table avec la bonne structure
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url VARCHAR(500),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur le rôle
CREATE INDEX idx_admin_profiles_role ON admin_profiles(role);

-- Activer RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "admin_profiles_auth_select" ON admin_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "admin_profiles_auth_update" ON admin_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_profiles_auth_insert" ON admin_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Trigger pour updated_at
CREATE TRIGGER update_admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Créer le profil admin pour l'utilisateur existant
INSERT INTO admin_profiles (id, name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
