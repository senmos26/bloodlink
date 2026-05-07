-- ============================================================================
-- SCHÉMA POSTGRESQL COMPLET POUR LA TROUVAILLE
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLES DE BASE
-- ============================================================================

-- Table des catégories d'événements
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#FFD700',
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des rubriques (pour webinaires)
CREATE TABLE event_rubriques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#FFD700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des catégories de blog
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#FFD700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#FFD700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES ÉVÉNEMENTS
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  rubrique_id UUID REFERENCES event_rubriques(id) ON DELETE SET NULL,
  themes TEXT,
  image VARCHAR(500),
  price VARCHAR(100) DEFAULT 'Gratuit',
  max_participants INTEGER,
  participants INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des intervenants d'événements
CREATE TABLE event_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  photo VARCHAR(500),
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des modérateurs d'événements
CREATE TABLE event_moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  photo VARCHAR(500),
  linkedin VARCHAR(255),
  twitter VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tags d'événements (relation many-to-many)
CREATE TABLE event_tags (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Table des images de galerie d'événements
CREATE TABLE event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des points forts d'événements
CREATE TABLE event_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  highlight TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du programme d'événements
CREATE TABLE event_program (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  time VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES ARTICLES DE BLOG
-- ============================================================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  author VARCHAR(255) NOT NULL,
  image VARCHAR(500),
  slug VARCHAR(255) UNIQUE NOT NULL,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tags d'articles (relation many-to-many)
CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Table des commentaires d'articles
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des likes d'articles
CREATE TABLE blog_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_ip)
);

-- ============================================================================
-- TABLE DE L'ÉQUIPE
-- ============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  bio TEXT NOT NULL,
  image VARCHAR(500),
  email VARCHAR(255) UNIQUE,
  skills TEXT[], -- Array of skills
  social_linkedin VARCHAR(255),
  social_twitter VARCHAR(255),
  social_facebook VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'éducation des membres d'équipe
CREATE TABLE team_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  degree VARCHAR(255) NOT NULL,
  school VARCHAR(255) NOT NULL,
  year VARCHAR(20) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de l'expérience des membres d'équipe
CREATE TABLE team_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  period VARCHAR(50) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réalisations des membres d'équipe
CREATE TABLE team_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  achievement TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES OBJECTIFS
-- ============================================================================

CREATE TABLE objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL, -- Nom de l'icône Lucide
  color VARCHAR(7) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES TÉMOIGNAGES
-- ============================================================================

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255) NOT NULL,
  author_company VARCHAR(255),
  author_photo VARCHAR(500),
  initials VARCHAR(10),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DE LA TIMELINE
-- ============================================================================

CREATE TABLE timeline_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  sort_order INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES INSCRIPTIONS AUX ÉVÉNEMENTS
-- ============================================================================

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  position VARCHAR(255),
  motivation TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- ============================================================================
-- TABLE DES CONTACTS
-- ============================================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE DES PROFILS ADMIN (reliée à auth.users de Supabase)
-- ============================================================================

CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url VARCHAR(500),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_profiles_role ON admin_profiles(role);

-- ============================================================================
-- INDEXES POUR LES PERFORMANCES
-- ============================================================================

-- Indexes pour les événements
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_published ON events(status, date) WHERE status = 'published';

-- Indexes pour les articles de blog
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(status, published_at) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);

-- Indexes pour la recherche textuelle
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('french', title || ' ' || description));
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('french', title || ' ' || excerpt || ' ' || content));

-- Indexes pour les relations
CREATE INDEX idx_event_speakers_event ON event_speakers(event_id);
CREATE INDEX idx_event_moderators_event ON event_moderators(event_id);
CREATE INDEX idx_event_gallery_event ON event_gallery(event_id);
CREATE INDEX idx_event_highlights_event ON event_highlights(event_id);
CREATE INDEX idx_event_program_event ON event_program(event_id);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_likes_post ON blog_likes(post_id);
CREATE INDEX idx_team_education_member ON team_education(member_id);
CREATE INDEX idx_team_experience_member ON team_experience(member_id);
CREATE INDEX idx_team_achievements_member ON team_achievements(member_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);

-- ============================================================================
-- TRIGGERS POUR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables avec updated_at
CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_rubriques_updated_at BEFORE UPDATE ON event_rubriques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timeline_entries_updated_at BEFORE UPDATE ON timeline_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Catégories d'événements
INSERT INTO event_categories (name, description, color, icon) VALUES
('Conférence', 'Conférences et séminaires', '#3B82F6', 'MessageSquare'),
('Workshop', 'Ateliers pratiques', '#10B981', 'Wrench'),
('Networking', 'Événements de réseautage', '#8B5CF6', 'Users'),
('Formation', 'Formations et cours', '#F59E0B', 'BookOpen'),
('Webinaire', 'Webinaires en ligne', '#EF4444', 'Video');

-- Rubriques pour webinaires
INSERT INTO event_rubriques (name, description, color) VALUES
('Innovation', 'Innovation et technologie', '#3B82F6'),
('Leadership', 'Leadership et management', '#10B981'),
('Entrepreneuriat', 'Entrepreneuriat et business', '#F59E0B'),
('Santé Mentale', 'Santé mentale et bien-être', '#EF4444'),
('Technologie', 'Technologie et digital', '#8B5CF6');

-- Catégories de blog
INSERT INTO blog_categories (name, description, color) VALUES
('Technologie', 'Articles sur la technologie', '#3B82F6'),
('Entrepreneuriat', 'Articles sur l\'entrepreneuriat', '#10B981'),
('Leadership', 'Articles sur le leadership', '#8B5CF6'),
('Innovation', 'Articles sur l\'innovation', '#F59E0B'),
('Développement', 'Articles sur le développement', '#EF4444');

-- Tags populaires
INSERT INTO tags (name, color) VALUES
('Innovation', '#3B82F6'),
('Leadership', '#10B981'),
('Jeunesse', '#8B5CF6'),
('Technologie', '#F59E0B'),
('Afrique', '#EF4444'),
('Entrepreneuriat', '#06B6D4'),
('Business', '#84CC16'),
('Santé Mentale', '#F97316');

-- ============================================================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rubriques ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Politiques pour le frontend (lecture publique)
CREATE POLICY "Public read access" ON event_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_rubriques FOR SELECT USING (true);
CREATE POLICY "Public read access" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON event_speakers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_moderators FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_tags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_gallery FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_highlights FOR SELECT USING (true);
CREATE POLICY "Public read access" ON event_program FOR SELECT USING (true);
CREATE POLICY "Public read access" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON blog_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read access" ON team_members FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access" ON team_education FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_experience FOR SELECT USING (true);
CREATE POLICY "Public read access" ON team_achievements FOR SELECT USING (true);
CREATE POLICY "Public read access" ON objectives FOR SELECT USING (status = 'active');
CREATE POLICY "Public read access" ON testimonials FOR SELECT USING (status = 'published');
CREATE POLICY "Public read access" ON timeline_entries FOR SELECT USING (status = 'published');

-- Politiques pour les inscriptions et contacts (insertion publique)
CREATE POLICY "Public insert access" ON event_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON blog_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON blog_likes FOR INSERT WITH CHECK (true);

-- Politiques pour l'admin (accès complet pour les utilisateurs authentifiés)
CREATE POLICY "Admin full access" ON event_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_rubriques FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON blog_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON tags FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON events FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_speakers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_moderators FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_tags FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_gallery FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_highlights FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_program FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON blog_posts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON blog_post_tags FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON blog_comments FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON blog_likes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON team_members FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON team_education FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON team_experience FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON team_achievements FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON objectives FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON testimonials FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON timeline_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON event_registrations FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin full access" ON admin_profiles FOR ALL TO authenticated USING (true);

