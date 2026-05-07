-- ============================================================================
-- OPTIMISATION DES PERFORMANCES POUR LE BLOG
-- Respecte la structure réelle de la base de données
-- ============================================================================

-- Créer des index pour améliorer les performances des requêtes
-- Ces index accélèrent les recherches et les tris

-- Index sur published_at pour le tri (très utilisé)
-- Structure BD : published_at timestamp with time zone (peut être NULL)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at 
ON blog_posts(published_at DESC NULLS LAST);

-- Index composite sur status et published_at (pour les filtres)
-- Structure BD : status character varying avec CHECK (draft, published, archived)
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published 
ON blog_posts(status, published_at DESC NULLS LAST);

-- Index sur created_at pour le tri alternatif
-- Structure BD : created_at timestamp with time zone DEFAULT now()
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at 
ON blog_posts(created_at DESC);

-- Index sur category_id pour les jointures avec les catégories
-- Structure BD : category_id uuid (peut être NULL) avec FK vers blog_categories
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id 
ON blog_posts(category_id) 
WHERE category_id IS NOT NULL;

-- Index sur slug pour les recherches par slug (déjà UNIQUE dans la BD)
-- Structure BD : slug character varying NOT NULL UNIQUE
-- L'index unique existe déjà, mais on ajoute un index normal pour les recherches
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug 
ON blog_posts(slug);

-- Index sur title pour les recherches (utilisé dans les filtres)
-- Structure BD : title character varying NOT NULL
CREATE INDEX IF NOT EXISTS idx_blog_posts_title 
ON blog_posts(title);

-- Index pour les recherches full-text (titre et extrait)
-- PostgreSQL full-text search index (nécessite l'extension pg_trgm)
-- À activer seulement si l'extension pg_trgm est disponible
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_title_trgm 
-- ON blog_posts USING gin (title gin_trgm_ops);

-- Index pour les tags (via la table de liaison blog_post_tags)
-- Structure BD : blog_post_tags avec PRIMARY KEY (post_id, tag_id)
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id 
ON blog_post_tags(post_id);

CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id 
ON blog_post_tags(tag_id);

-- Index pour les commentaires
-- Structure BD : blog_comments avec post_id uuid, status avec CHECK, created_at
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id 
ON blog_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_status 
ON blog_comments(status);

-- Index sur created_at pour les commentaires (tri chronologique)
CREATE INDEX IF NOT EXISTS idx_blog_comments_created_at 
ON blog_comments(created_at DESC);

-- Index composite pour les commentaires par article et statut
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_status 
ON blog_comments(post_id, status, created_at DESC);

-- Index pour les catégories (recherche par name qui est UNIQUE)
-- Structure BD : blog_categories avec name character varying NOT NULL UNIQUE
CREATE INDEX IF NOT EXISTS idx_blog_categories_name 
ON blog_categories(name);

-- Index pour les likes (table blog_likes)
-- Structure BD : blog_likes avec post_id uuid, user_ip character varying
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id 
ON blog_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_blog_likes_user_ip 
ON blog_likes(user_ip);

-- Statistiques pour optimiser le planificateur de requêtes PostgreSQL
ANALYZE blog_posts;
ANALYZE blog_categories;
ANALYZE blog_comments;
ANALYZE blog_post_tags;
ANALYZE tags;
ANALYZE blog_likes;

-- Vérifier les index créés
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename IN ('blog_posts', 'blog_categories', 'blog_comments', 'blog_post_tags', 'tags')
ORDER BY tablename, indexname;
