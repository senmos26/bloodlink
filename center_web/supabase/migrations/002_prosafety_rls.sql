-- ============================================================================
-- PROSAFETY ENGINEERING - ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Politiques de sécurité pour le front-office (anon) et back-office (authenticated)
-- ============================================================================

-- ============================================================================
-- ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_poles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE "references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONTACTS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent soumettre un formulaire de contact
CREATE POLICY "contacts_anon_insert" ON contacts
    FOR INSERT TO anon
    WITH CHECK (true);

-- Back-office: Admins peuvent lire tous les contacts
CREATE POLICY "contacts_auth_select" ON contacts
    FOR SELECT TO authenticated
    USING (true);

-- Back-office: Admins peuvent modifier les contacts (statut, etc.)
CREATE POLICY "contacts_auth_update" ON contacts
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Back-office: Admins peuvent supprimer les contacts
CREATE POLICY "contacts_auth_delete" ON contacts
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- BLOG_POSTS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les articles publiés
CREATE POLICY "blog_posts_anon_select" ON blog_posts
    FOR SELECT TO anon
    USING (status = 'published');

-- Back-office: Admins peuvent lire tous les articles
CREATE POLICY "blog_posts_auth_select" ON blog_posts
    FOR SELECT TO authenticated
    USING (true);

-- Back-office: Admins peuvent créer des articles
CREATE POLICY "blog_posts_auth_insert" ON blog_posts
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Back-office: Admins peuvent modifier les articles
CREATE POLICY "blog_posts_auth_update" ON blog_posts
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Back-office: Admins peuvent supprimer les articles
CREATE POLICY "blog_posts_auth_delete" ON blog_posts
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- BLOG_COMMENTS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les commentaires approuvés
CREATE POLICY "blog_comments_anon_select" ON blog_comments
    FOR SELECT TO anon
    USING (status = 'approved');

-- Front-office: Visiteurs peuvent soumettre des commentaires
CREATE POLICY "blog_comments_anon_insert" ON blog_comments
    FOR INSERT TO anon
    WITH CHECK (true);

-- Back-office: Admins peuvent lire tous les commentaires
CREATE POLICY "blog_comments_auth_select" ON blog_comments
    FOR SELECT TO authenticated
    USING (true);

-- Back-office: Admins peuvent modifier les commentaires (approuver/rejeter)
CREATE POLICY "blog_comments_auth_update" ON blog_comments
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Back-office: Admins peuvent supprimer les commentaires
CREATE POLICY "blog_comments_auth_delete" ON blog_comments
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- SERVICE_POLES - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les pôles actifs
CREATE POLICY "service_poles_anon_select" ON service_poles
    FOR SELECT TO anon
    USING (status = 'active');

-- Back-office: Admins ont accès complet
CREATE POLICY "service_poles_auth_select" ON service_poles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "service_poles_auth_insert" ON service_poles
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "service_poles_auth_update" ON service_poles
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_poles_auth_delete" ON service_poles
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- SERVICES - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les services actifs
CREATE POLICY "services_anon_select" ON services
    FOR SELECT TO anon
    USING (status = 'active');

-- Back-office: Admins ont accès complet
CREATE POLICY "services_auth_select" ON services
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "services_auth_insert" ON services
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "services_auth_update" ON services
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "services_auth_delete" ON services
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- SERVICE_SECTIONS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les sections (via service actif)
CREATE POLICY "service_sections_anon_select" ON service_sections
    FOR SELECT TO anon
    USING (
        EXISTS (
            SELECT 1 FROM services s 
            WHERE s.id = service_sections.service_id 
            AND s.status = 'active'
        )
    );

-- Back-office: Admins ont accès complet
CREATE POLICY "service_sections_auth_select" ON service_sections
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "service_sections_auth_insert" ON service_sections
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "service_sections_auth_update" ON service_sections
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_sections_auth_delete" ON service_sections
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- TEAM_MEMBERS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les membres actifs
CREATE POLICY "team_members_anon_select" ON team_members
    FOR SELECT TO anon
    USING (status = 'active');

-- Back-office: Admins ont accès complet
CREATE POLICY "team_members_auth_select" ON team_members
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "team_members_auth_insert" ON team_members
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "team_members_auth_update" ON team_members
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "team_members_auth_delete" ON team_members
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- REFERENCES - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire les références publiées
CREATE POLICY "references_anon_select" ON "references"
    FOR SELECT TO anon
    USING (status = 'published');

-- Back-office: Admins ont accès complet
CREATE POLICY "references_auth_select" ON "references"
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "references_auth_insert" ON "references"
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "references_auth_update" ON "references"
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "references_auth_delete" ON "references"
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- CERTIFICATIONS - RLS
-- ============================================================================

-- Front-office: Visiteurs peuvent lire toutes les certifications
CREATE POLICY "certifications_anon_select" ON certifications
    FOR SELECT TO anon
    USING (true);

-- Back-office: Admins ont accès complet
CREATE POLICY "certifications_auth_select" ON certifications
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "certifications_auth_insert" ON certifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "certifications_auth_update" ON certifications
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "certifications_auth_delete" ON certifications
    FOR DELETE TO authenticated
    USING (true);

-- ============================================================================
-- ADMIN_PROFILES - RLS
-- ============================================================================

-- Back-office: Admins peuvent voir leur propre profil
CREATE POLICY "admin_profiles_auth_select" ON admin_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Back-office: Admins peuvent modifier leur propre profil
CREATE POLICY "admin_profiles_auth_update" ON admin_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Back-office: Insertion automatique lors de la création d'un utilisateur
CREATE POLICY "admin_profiles_auth_insert" ON admin_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
