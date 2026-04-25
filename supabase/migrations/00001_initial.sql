-- Migration 00001_initial.sql
-- BloodLink MVP — Tables, Enums, RLS Policies, Triggers
-- Créée le: 2026-04-24

-- ============================================
-- 1. EXTENSIONS
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour géolocalisation (PostGIS)
-- NOTE: À activer manuellement dans le dashboard Supabase si non disponible
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 2. ENUMÉRATIONS
-- ============================================

-- Rôles utilisateurs
CREATE TYPE user_role AS ENUM ('donor', 'center_admin', 'super_admin');

-- Groupes sanguins
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Niveaux d'urgence
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Statuts d'alerte
CREATE TYPE alert_status AS ENUM ('active', 'expired', 'closed');

-- Statuts de rendez-vous
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Statuts de don
CREATE TYPE donation_status AS ENUM ('pending', 'validated', 'rejected');

-- Types de notification
CREATE TYPE notification_type AS ENUM ('alert', 'appointment', 'donation', 'system');

-- ============================================
-- 3. TABLES
-- ============================================

-- Table des profils utilisateurs (extension de auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    blood_type blood_type,
    date_of_birth DATE,
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 50 OR weight_kg IS NULL),
    role user_role NOT NULL DEFAULT 'donor',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    next_donation_date DATE,
    fcm_token VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Extension métier des utilisateurs Supabase Auth';

-- Table des centres de transfusion
CREATE TABLE public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    admin_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.centers IS 'Centres de transfusion sanguine';

-- Table des alertes de pénurie
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    blood_type_required blood_type NOT NULL,
    urgency_level urgency_level NOT NULL,
    radius_km INTEGER NOT NULL CHECK (radius_km > 0),
    message TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    status alert_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.alerts IS 'Alertes de pénurie de sang créées par les centres';

-- Table des rendez-vous
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMPTZ NOT NULL CHECK (scheduled_date > NOW()),
    status appointment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.appointments IS 'Rendez-vous entre donneurs et centres';

-- Table des dons validés
CREATE TABLE public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    donation_date TIMESTAMPTZ NOT NULL,
    volume_ml INTEGER NOT NULL DEFAULT 450,
    status donation_status NOT NULL DEFAULT 'pending',
    validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.donations IS 'Dons de sang validés par les centres';

-- Table des notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

COMMENT ON TABLE public.notifications IS 'Notifications in-app pour les utilisateurs';

-- ============================================
-- 4. INDEXES
-- ============================================

-- Index sur les colonnes fréquemment filtrées
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_blood_type ON public.profiles(blood_type);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_next_donation ON public.profiles(next_donation_date);

CREATE INDEX idx_centers_is_active ON public.centers(is_active);
CREATE INDEX idx_centers_admin_id ON public.centers(admin_id);

CREATE INDEX idx_alerts_center_id ON public.alerts(center_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_blood_type ON public.alerts(blood_type_required);
CREATE INDEX idx_alerts_deadline ON public.alerts(deadline);

CREATE INDEX idx_appointments_donor_id ON public.appointments(donor_id);
CREATE INDEX idx_appointments_center_id ON public.appointments(center_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);

CREATE INDEX idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX idx_donations_center_id ON public.donations(center_id);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_donation_date ON public.donations(donation_date);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Index géospatial (si PostGIS disponible)
-- CREATE INDEX idx_centers_location ON public.centers USING GIST (ST_Point(longitude, latitude));
-- CREATE INDEX idx_profiles_location ON public.profiles USING GIST (ST_Point(longitude, latitude));

-- ============================================
-- 5. RLS POLICIES (Row Level Security)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5.1. PROFILES
-- ============================================

-- Policy: Les utilisateurs peuvent voir les profils publics (id, full_name, blood_type, role)
-- Les données sensibles (phone, fcm_token) sont masquées par des vues ou gérées dans l'app
CREATE POLICY "profiles_select_public"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Policy: Un utilisateur peut modifier son propre profil
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND is_active = TRUE);

-- Policy: Super admin peut tout voir
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Super admin peut tout modifier
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 5.2. CENTERS
-- ============================================

-- Policy: Tout le monde peut voir les centres actifs
CREATE POLICY "centers_select_public"
ON public.centers
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Policy: Super admin peut tout faire
CREATE POLICY "centers_all_admin"
ON public.centers
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- Policy: Center admin peut modifier son propre centre
CREATE POLICY "centers_update_own"
ON public.centers
FOR UPDATE
TO authenticated
USING (
    admin_id = auth.uid() AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'center_admin'
    )
);

-- ============================================
-- 5.3. ALERTS
-- ============================================

-- Policy: Tout le monde peut voir les alertes actives
CREATE POLICY "alerts_select_public"
ON public.alerts
FOR SELECT
TO authenticated
USING (status = 'active');

-- Policy: Center admin peut créer des alertes pour son centre
CREATE POLICY "alerts_insert_center"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Center admin peut modifier ses propres alertes
CREATE POLICY "alerts_update_center"
ON public.alerts
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Super admin peut tout faire
CREATE POLICY "alerts_all_admin"
ON public.alerts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 5.4. APPOINTMENTS
-- ============================================

-- Policy: Donneurs voient leurs propres rendez-vous
CREATE POLICY "appointments_select_donor"
ON public.appointments
FOR SELECT
TO authenticated
USING (donor_id = auth.uid());

-- Policy: Centers voient les rendez-vous de leur centre
CREATE POLICY "appointments_select_center"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Donneurs créent leurs propres rendez-vous
CREATE POLICY "appointments_insert_donor"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (donor_id = auth.uid());

-- Policy: Donneurs peuvent annuler leurs rendez-vous
CREATE POLICY "appointments_update_donor"
ON public.appointments
FOR UPDATE
TO authenticated
USING (donor_id = auth.uid())
WITH CHECK (
    donor_id = auth.uid() AND 
    status IN ('pending', 'confirmed') -- Ne peut pas modifier si completed/cancelled
);

-- Policy: Centers confirment/annulent les rendez-vous de leur centre
CREATE POLICY "appointments_update_center"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Super admin peut tout voir
CREATE POLICY "appointments_select_admin"
ON public.appointments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 5.5. DONATIONS
-- ============================================

-- Policy: Donneurs voient leurs propres dons
CREATE POLICY "donations_select_donor"
ON public.donations
FOR SELECT
TO authenticated
USING (donor_id = auth.uid());

-- Policy: Centers voient les dons de leur centre
CREATE POLICY "donations_select_center"
ON public.donations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Centers créent des dons (validation)
CREATE POLICY "donations_insert_center"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Centers mettent à jour les dons de leur centre
CREATE POLICY "donations_update_center"
ON public.donations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.centers 
        WHERE id = center_id AND admin_id = auth.uid()
    )
);

-- Policy: Super admin peut tout voir
CREATE POLICY "donations_select_admin"
ON public.donations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 5.6. NOTIFICATIONS
-- ============================================

-- Policy: Utilisateurs voient leurs propres notifications
CREATE POLICY "notifications_select_own"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Utilisateurs marquent leurs notifications comme lues
CREATE POLICY "notifications_update_own"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Système (Edge Functions) peut créer des notifications
CREATE POLICY "notifications_insert_system"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (TRUE); -- Restreindre via service_role ou Edge Function

-- Policy: Super admin peut tout voir
CREATE POLICY "notifications_select_admin"
ON public.notifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

-- ============================================
-- 6. TRIGGERS ET FONCTIONS
-- ============================================

-- Fonction: Création automatique de profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone,
        role, 
        is_active
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'donor',
        TRUE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Appelé après création d'un auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at sur toutes les tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_centers_updated_at
    BEFORE UPDATE ON public.centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction: Expiration automatique des alertes
CREATE OR REPLACE FUNCTION public.expire_old_alerts()
RETURNS void AS $$
BEGIN
    UPDATE public.alerts
    SET status = 'expired',
        updated_at = NOW()
    WHERE deadline < NOW() 
      AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mettre à jour l'éligibilité du donneur après validation d'un don
CREATE OR REPLACE FUNCTION public.update_donor_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'validated' AND (OLD.status IS NULL OR OLD.status != 'validated') THEN
        UPDATE public.profiles
        SET next_donation_date = NEW.donation_date + INTERVAL '56 days',
            updated_at = NOW()
        WHERE id = NEW.donor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_donation_validated
    AFTER UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.update_donor_eligibility();

-- Fonction: Mettre à jour read_at quand une notification est marquée lue
CREATE OR REPLACE FUNCTION public.update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_notification_read
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_notification_read_at();

-- ============================================
-- 7. VUES (Optionnel)
-- ============================================

-- Vue: Alertes avec infos du centre (pour l'app mobile)
CREATE VIEW public.alerts_with_center AS
SELECT 
    a.*,
    c.name as center_name,
    c.city as center_city,
    c.latitude as center_latitude,
    c.longitude as center_longitude
FROM public.alerts a
JOIN public.centers c ON a.center_id = c.id
WHERE a.status = 'active' AND c.is_active = TRUE;

-- Vue: Rendez-vous avec infos complètes
CREATE VIEW public.appointments_full AS
SELECT 
    ap.*,
    p.full_name as donor_name,
    p.blood_type as donor_blood_type,
    p.phone as donor_phone,
    c.name as center_name,
    c.address as center_address,
    c.phone as center_phone
FROM public.appointments ap
JOIN public.profiles p ON ap.donor_id = p.id
JOIN public.centers c ON ap.center_id = c.id;

-- ============================================
-- 8. SEED DATA (Données de test)
-- ============================================

-- NOTE: Ces données sont pour le développement local uniquement
-- À commenter ou supprimer en production

-- Insertion d'un super admin (à faire manuellement avec un vrai auth.users)
-- INSERT INTO public.profiles (id, full_name, phone, role, is_active)
-- VALUES ('SUPER_ADMIN_UUID', 'Admin BloodLink', '+0000000000', 'super_admin', TRUE);

-- Insertion de centres de test (nécessite des profiles avec role='center_admin')
-- INSERT INTO public.centers (name, address, city, phone, email, latitude, longitude)
-- VALUES 
--     ('Centre de Lomé', '123 Rue Principale', 'Lomé', '+22890123456', 'lome@bloodlink.tg', 6.1370, 1.2123),
--     ('Centre de Kara', '456 Avenue Centrale', 'Kara', '+22890123457', 'kara@bloodlink.tg', 9.5511, 1.1861);

-- ============================================
-- 9. COMMENTAIRES DE FIN
-- ============================================

COMMENT ON DATABASE postgres IS 'BloodLink MVP Database - Supabase PostgreSQL';

-- Instructions post-migration:
-- 1. Activer Email Confirmation dans Supabase Auth si nécessaire
-- 2. Configurer les templates d'email (confirmation, reset password)
-- 3. Activer PostGIS extension depuis le dashboard si besoin de géolocalisation avancée
-- 4. Créer un utilisateur super_admin manuellement via Supabase Auth + SQL
-- 5. Configurer les Edge Functions (matching, notifications, etc.)
-- 6. Configurer les clés API dans le mobile et l'admin web
