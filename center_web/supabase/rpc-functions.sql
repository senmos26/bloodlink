-- ============================================================================
-- FONCTIONS RPC POUR LA GESTION DES LIKES ET COMMENTAIRES
-- ============================================================================

-- Fonction pour incrémenter le compteur de likes
CREATE OR REPLACE FUNCTION increment_blog_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur de likes
CREATE OR REPLACE FUNCTION decrement_blog_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter le compteur de commentaires
CREATE OR REPLACE FUNCTION increment_blog_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET comments_count = COALESCE(comments_count, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le compteur de commentaires
CREATE OR REPLACE FUNCTION decrement_blog_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les compteurs de likes
CREATE OR REPLACE FUNCTION sync_blog_likes_count()
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET likes = (
    SELECT COUNT(*) 
    FROM blog_likes 
    WHERE blog_likes.post_id = blog_posts.id
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les compteurs de commentaires
CREATE OR REPLACE FUNCTION sync_blog_comments_count()
RETURNS void AS $$
BEGIN
  UPDATE blog_posts 
  SET comments_count = (
    SELECT COUNT(*) 
    FROM blog_comments 
    WHERE blog_comments.post_id = blog_posts.id 
    AND blog_comments.status = 'approved'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTIONS POUR LA GESTION DES COMMENTAIRES
-- ============================================================================

-- Fonction pour ajouter un commentaire à un article de blog
CREATE OR REPLACE FUNCTION add_blog_comment(
  post_uuid UUID,
  author_name TEXT,
  author_email TEXT,
  comment_content TEXT
)
RETURNS JSON AS $$
DECLARE
  new_comment_id UUID;
  result JSON;
BEGIN
  -- Vérifier que l'article existe et est publié
  IF NOT EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE id = post_uuid AND status = 'published'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Article non trouvé ou non publié'
    );
  END IF;

  -- Insérer le commentaire
  INSERT INTO blog_comments (
    post_id,
    author_name,
    author_email,
    content,
    status
  ) VALUES (
    post_uuid,
    author_name,
    author_email,
    comment_content,
    'pending' -- Statut par défaut : en attente de modération
  ) RETURNING id INTO new_comment_id;

  -- Incrémenter le compteur de commentaires (même en attente)
  PERFORM increment_blog_comments(post_uuid);

  -- Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'id', new_comment_id,
    'created_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour liker un article de blog (avec gestion des doublons)
CREATE OR REPLACE FUNCTION like_blog_post(
  post_uuid UUID,
  user_ip TEXT
)
RETURNS JSON AS $$
DECLARE
  existing_like RECORD;
  is_liked BOOLEAN;
  likes_count INTEGER;
BEGIN
  -- Vérifier que l'article existe et est publié
  IF NOT EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE id = post_uuid AND status = 'published'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Article non trouvé ou non publié'
    );
  END IF;

  -- Vérifier si l'utilisateur a déjà liké cet article
  SELECT * INTO existing_like 
  FROM blog_likes 
  WHERE post_id = post_uuid AND user_ip = like_blog_post.user_ip;

  IF existing_like IS NOT NULL THEN
    -- L'utilisateur a déjà liké, on supprime le like
    DELETE FROM blog_likes WHERE id = existing_like.id;
    PERFORM decrement_blog_likes(post_uuid);
    is_liked := false;
  ELSE
    -- L'utilisateur n'a pas encore liké, on ajoute le like
    INSERT INTO blog_likes (post_id, user_ip) VALUES (post_uuid, user_ip);
    PERFORM increment_blog_likes(post_uuid);
    is_liked := true;
  END IF;

  -- Récupérer le nombre total de likes
  SELECT COALESCE(likes, 0) INTO likes_count 
  FROM blog_posts 
  WHERE id = post_uuid;

  -- Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'liked', is_liked,
    'likes_count', likes_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTIONS POUR LA GESTION DES COMMENTAIRES (ADMIN)
-- ============================================================================

-- Fonction pour mettre à jour le statut d'un commentaire
CREATE OR REPLACE FUNCTION update_comment_status(
  comment_uuid UUID,
  new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que le commentaire existe
  IF NOT EXISTS (SELECT 1 FROM blog_comments WHERE id = comment_uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Commentaire non trouvé'
    );
  END IF;

  -- Vérifier que le statut est valide
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Statut invalide. Utilisez: pending, approved, ou rejected'
    );
  END IF;

  -- Mettre à jour le statut
  UPDATE blog_comments 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = comment_uuid;

  -- Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'message', 'Statut du commentaire mis à jour avec succès'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer un commentaire
CREATE OR REPLACE FUNCTION delete_comment(
  comment_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  post_uuid UUID;
BEGIN
  -- Récupérer l'ID de l'article avant suppression
  SELECT post_id INTO post_uuid FROM blog_comments WHERE id = comment_uuid;
  
  -- Vérifier que le commentaire existe
  IF post_uuid IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Commentaire non trouvé'
    );
  END IF;

  -- Supprimer le commentaire
  DELETE FROM blog_comments WHERE id = comment_uuid;

  -- Décrémenter le compteur de commentaires
  PERFORM decrement_blog_comments(post_uuid);

  -- Retourner le résultat
  RETURN json_build_object(
    'success', true,
    'message', 'Commentaire supprimé avec succès'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions pour les fonctions RPC
GRANT EXECUTE ON FUNCTION add_blog_comment(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION like_blog_post(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_comment_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_comment(UUID) TO authenticated;