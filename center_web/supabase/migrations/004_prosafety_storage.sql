-- ============================================================================
-- PROSAFETY ENGINEERING - STORAGE BUCKETS
-- ============================================================================
-- Configuration des buckets de stockage pour les fichiers
-- ============================================================================

-- Créer le bucket pour les images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Créer le bucket pour les documents (brochures, PDF)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    true,
    10485760, -- 10MB
    NULL
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = NULL;

-- ============================================================================
-- STORAGE POLICIES - IMAGES
-- ============================================================================

-- Lecture publique des images
CREATE POLICY "images_public_select" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'images');

-- Upload pour les utilisateurs authentifiés
CREATE POLICY "images_auth_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'images');

-- Mise à jour pour les utilisateurs authentifiés
CREATE POLICY "images_auth_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'images')
    WITH CHECK (bucket_id = 'images');

-- Suppression pour les utilisateurs authentifiés
CREATE POLICY "images_auth_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'images');

-- ============================================================================
-- STORAGE POLICIES - DOCUMENTS
-- ============================================================================

-- Lecture publique des documents
CREATE POLICY "documents_public_select" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'documents');

-- Upload pour les utilisateurs authentifiés
CREATE POLICY "documents_auth_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documents');

-- Mise à jour pour les utilisateurs authentifiés
CREATE POLICY "documents_auth_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'documents')
    WITH CHECK (bucket_id = 'documents');

-- Suppression pour les utilisateurs authentifiés
CREATE POLICY "documents_auth_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'documents');
