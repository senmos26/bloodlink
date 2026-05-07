-- ============================================================================
-- PROSAFETY ENGINEERING - SCHÉMA POSTGRESQL COMPLET
-- ============================================================================
-- Ce fichier contient le schéma complet pour Prosafety Engineering
-- Compatible avec le back-office (pam-grp-Maroc) et le front-office (prosafety-next)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- FONCTION UTILITAIRE: updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: contacts (Messages de contact)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    service VARCHAR(100), -- risques-industriels, securite-incendie, etc.
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: blog_posts (Articles de blog)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(500) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL, -- RÉGLEMENTATION, ENVIRONNEMENT, GUIDE TECHNIQUE, etc.
    date VARCHAR(20) NOT NULL, -- Format: DD.MM.YYYY
    excerpt TEXT NOT NULL,
    read_time VARCHAR(20), -- Ex: "5 MIN"
    image_url TEXT,
    
    -- Auteur
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    
    -- Contenu structuré (stocké en JSON)
    introduction TEXT NOT NULL,
    sections JSONB DEFAULT '[]', -- Array de {id, title, content}
    expert_note JSONB, -- {title, content} ou null
    conclusion TEXT NOT NULL,
    
    -- Tags
    tags TEXT[] DEFAULT '{}',
    
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: blog_comments (Commentaires d'articles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);

CREATE TRIGGER update_blog_comments_updated_at
    BEFORE UPDATE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: service_poles (Pôles de services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_poles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_poles_status ON service_poles(status);
CREATE INDEX IF NOT EXISTS idx_service_poles_sort_order ON service_poles(sort_order);

CREATE TRIGGER update_service_poles_updated_at
    BEFORE UPDATE ON service_poles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: services (Services/Fiches techniques)
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pole_id UUID REFERENCES service_poles(id) ON DELETE SET NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    ref VARCHAR(50) NOT NULL, -- Ex: REF.ING.01
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT NOT NULL,
    icon VARCHAR(100),
    brochure_url TEXT,
    standards TEXT[] DEFAULT '{}', -- Ex: ["ISO", "ATEX", "NFPA"]
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_pole_id ON services(pole_id);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services(sort_order);

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: service_sections (Sections d'un service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT[] DEFAULT '{}', -- Liste des points/détails
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_sections_service_id ON service_sections(service_id);
CREATE INDEX IF NOT EXISTS idx_service_sections_sort_order ON service_sections(sort_order);

-- ============================================================================
-- TABLE: team_members (Membres de l'équipe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(255) NOT NULL, -- Ex: "Directeur Général"
    spec VARCHAR(255) NOT NULL, -- Ex: "Ingénieur Sécurité Procédés"
    description TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_sort_order ON team_members(sort_order);

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: references (Références/Projets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "references" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref VARCHAR(50) NOT NULL, -- Ex: PROJET 2024
    slug VARCHAR(500) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('etude_de_cas', 'projet', 'audit', 'formation')),
    title VARCHAR(500) NOT NULL,
    sector VARCHAR(100) NOT NULL, -- Ex: INDUSTRIE, PÉTROCHIMIE
    location VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL, -- Ex: 2024
    image_url TEXT,
    
    -- Contenu des sections
    context TEXT NOT NULL, -- Section 01 - Contexte & Enjeux
    methodology TEXT[] DEFAULT '{}', -- Section 02 - Méthodologie (liste de points)
    results_description TEXT NOT NULL, -- Section 03 - Résultats visés
    result_tags TEXT[] DEFAULT '{}', -- Ex: ["CONFORMITÉ CIBLE", "SÉCURITÉ OPTIMALE"]
    
    -- Critères clés (sidebar) - stocké en JSON
    stats JSONB DEFAULT '[]', -- Array de {value, label}
    technologies TEXT[] DEFAULT '{}', -- Ex: ["ATEX", "CAD", "Sim", "Audit"]
    
    -- Tags pour filtrage
    tags TEXT[] DEFAULT '{}',
    
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_references_status ON "references"(status);
CREATE INDEX IF NOT EXISTS idx_references_type ON "references"(type);
CREATE INDEX IF NOT EXISTS idx_references_sector ON "references"(sector);
CREATE INDEX IF NOT EXISTS idx_references_slug ON "references"(slug);
CREATE INDEX IF NOT EXISTS idx_references_tags ON "references" USING GIN(tags);

CREATE TRIGGER update_references_updated_at
    BEFORE UPDATE ON "references"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: certifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL, -- Ex: ISO 9001
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'target' CHECK (status IN ('acquired', 'in_progress', 'target')),
    icon VARCHAR(100),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications(status);
CREATE INDEX IF NOT EXISTS idx_certifications_sort_order ON certifications(sort_order);

CREATE TRIGGER update_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: admin_profiles (Profils administrateurs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
    avatar_url TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role ON admin_profiles(role);

CREATE TRIGGER update_admin_profiles_updated_at
    BEFORE UPDATE ON admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
