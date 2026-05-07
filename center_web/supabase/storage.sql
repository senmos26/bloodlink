-- ============================================================================
-- CONFIGURATION SUPABASE STORAGE POUR LA TROUVAILLE
-- ============================================================================

-- Créer le bucket public pour les médias
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'la-trouvaille-media',
  'la-trouvaille-media',
  true,
  10485760, -- 10MB max
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
);

-- Politiques Storage : Les utilisateurs authentifiés peuvent tout faire
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'la-trouvaille-media');

-- Tout le monde peut lire (bucket public)
CREATE POLICY "Public can view files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'la-trouvaille-media');

-- Les authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'la-trouvaille-media');

-- Les authentifiés peuvent supprimer
CREATE POLICY "Authenticated users can delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'la-trouvaille-media');
