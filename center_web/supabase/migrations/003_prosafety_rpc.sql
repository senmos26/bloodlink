-- ============================================================================
-- PROSAFETY ENGINEERING - RPC FUNCTIONS (Remote Procedure Calls)
-- ============================================================================
-- Fonctions pour les opérations CRUD et statistiques
-- Compatible avec le front-office et le back-office
-- ============================================================================

-- ============================================================================
-- SECTION 1: CONTACTS - RPC
-- ============================================================================

-- Créer un contact (front-office)
CREATE OR REPLACE FUNCTION create_contact(
    p_name VARCHAR,
    p_email VARCHAR,
    p_message TEXT,
    p_company VARCHAR DEFAULT NULL,
    p_service VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO contacts (name, email, company, service, message, status)
    VALUES (p_name, p_email, p_company, p_service, p_message, 'new')
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les contacts avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_contacts(
    p_status VARCHAR DEFAULT NULL,
    p_service VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    email VARCHAR,
    company VARCHAR,
    service VARCHAR,
    message TEXT,
    status VARCHAR,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.name, c.email, c.company, c.service,
        c.message, c.status, c.replied_at, c.created_at, c.updated_at
    FROM contacts c
    WHERE (p_status IS NULL OR c.status = p_status)
      AND (p_service IS NULL OR c.service = p_service)
      AND (p_search IS NULL OR 
           c.name ILIKE '%' || p_search || '%' OR 
           c.email ILIKE '%' || p_search || '%' OR
           c.message ILIKE '%' || p_search || '%')
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour le statut d'un contact (back-office)
CREATE OR REPLACE FUNCTION update_contact_status(
    p_id UUID,
    p_status VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE contacts
    SET status = p_status,
        replied_at = CASE WHEN p_status = 'replied' THEN NOW() ELSE replied_at END,
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer un contact (back-office)
CREATE OR REPLACE FUNCTION delete_contact(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM contacts WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques des contacts par service
CREATE OR REPLACE FUNCTION count_contacts_by_service()
RETURNS TABLE(service TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(c.service, 'Non spécifié')::TEXT AS service,
        COUNT(*)::BIGINT AS count
    FROM contacts c
    GROUP BY c.service
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques des contacts par statut
CREATE OR REPLACE FUNCTION count_contacts_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.status::TEXT,
        COUNT(*)::BIGINT AS count
    FROM contacts c
    GROUP BY c.status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: BLOG_POSTS - RPC
-- ============================================================================

-- Créer un article (back-office)
CREATE OR REPLACE FUNCTION create_blog_post(
    p_slug VARCHAR,
    p_title VARCHAR,
    p_category VARCHAR,
    p_date VARCHAR,
    p_excerpt TEXT,
    p_read_time VARCHAR,
    p_image_url TEXT,
    p_author_name VARCHAR,
    p_author_role VARCHAR,
    p_introduction TEXT,
    p_sections JSONB,
    p_expert_note JSONB,
    p_conclusion TEXT,
    p_tags TEXT[],
    p_status VARCHAR DEFAULT 'draft'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO blog_posts (
        slug, title, category, date, excerpt, read_time, image_url,
        author_name, author_role, introduction, sections, expert_note,
        conclusion, tags, status
    )
    VALUES (
        p_slug, p_title, p_category, p_date, p_excerpt, p_read_time, p_image_url,
        p_author_name, p_author_role, p_introduction, p_sections, p_expert_note,
        p_conclusion, p_tags, p_status
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les articles publiés (front-office)
CREATE OR REPLACE FUNCTION get_published_blog_posts(
    p_category VARCHAR DEFAULT NULL,
    p_tag TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    slug VARCHAR,
    title VARCHAR,
    category VARCHAR,
    date VARCHAR,
    excerpt TEXT,
    read_time VARCHAR,
    image_url TEXT,
    author_name VARCHAR,
    author_role VARCHAR,
    tags TEXT[],
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id, bp.slug, bp.title, bp.category, bp.date, bp.excerpt,
        bp.read_time, bp.image_url, bp.author_name, bp.author_role,
        bp.tags, bp.created_at
    FROM blog_posts bp
    WHERE bp.status = 'published'
      AND (p_category IS NULL OR bp.category = p_category)
      AND (p_tag IS NULL OR p_tag = ANY(bp.tags))
      AND (p_search IS NULL OR 
           bp.title ILIKE '%' || p_search || '%' OR 
           bp.excerpt ILIKE '%' || p_search || '%')
    ORDER BY bp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer un article par slug (front-office + back-office)
CREATE OR REPLACE FUNCTION get_blog_post_by_slug(p_slug VARCHAR, p_include_drafts BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
    id UUID,
    slug VARCHAR,
    title VARCHAR,
    category VARCHAR,
    date VARCHAR,
    excerpt TEXT,
    read_time VARCHAR,
    image_url TEXT,
    author_name VARCHAR,
    author_role VARCHAR,
    introduction TEXT,
    sections JSONB,
    expert_note JSONB,
    conclusion TEXT,
    tags TEXT[],
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id, bp.slug, bp.title, bp.category, bp.date, bp.excerpt,
        bp.read_time, bp.image_url, bp.author_name, bp.author_role,
        bp.introduction, bp.sections, bp.expert_note, bp.conclusion,
        bp.tags, bp.status, bp.created_at, bp.updated_at
    FROM blog_posts bp
    WHERE bp.slug = p_slug
      AND (p_include_drafts OR bp.status = 'published');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer tous les articles avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_blog_posts(
    p_status VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    slug VARCHAR,
    title VARCHAR,
    category VARCHAR,
    date VARCHAR,
    excerpt TEXT,
    read_time VARCHAR,
    image_url TEXT,
    author_name VARCHAR,
    tags TEXT[],
    status VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id, bp.slug, bp.title, bp.category, bp.date, bp.excerpt,
        bp.read_time, bp.image_url, bp.author_name, bp.tags,
        bp.status, bp.created_at
    FROM blog_posts bp
    WHERE (p_status IS NULL OR bp.status = p_status)
      AND (p_category IS NULL OR bp.category = p_category)
      AND (p_search IS NULL OR 
           bp.title ILIKE '%' || p_search || '%' OR 
           bp.excerpt ILIKE '%' || p_search || '%')
    ORDER BY bp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour un article (back-office)
CREATE OR REPLACE FUNCTION update_blog_post(
    p_id UUID,
    p_slug VARCHAR DEFAULT NULL,
    p_title VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_date VARCHAR DEFAULT NULL,
    p_excerpt TEXT DEFAULT NULL,
    p_read_time VARCHAR DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_author_name VARCHAR DEFAULT NULL,
    p_author_role VARCHAR DEFAULT NULL,
    p_introduction TEXT DEFAULT NULL,
    p_sections JSONB DEFAULT NULL,
    p_expert_note JSONB DEFAULT NULL,
    p_conclusion TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE blog_posts
    SET slug = COALESCE(p_slug, slug),
        title = COALESCE(p_title, title),
        category = COALESCE(p_category, category),
        date = COALESCE(p_date, date),
        excerpt = COALESCE(p_excerpt, excerpt),
        read_time = COALESCE(p_read_time, read_time),
        image_url = COALESCE(p_image_url, image_url),
        author_name = COALESCE(p_author_name, author_name),
        author_role = COALESCE(p_author_role, author_role),
        introduction = COALESCE(p_introduction, introduction),
        sections = COALESCE(p_sections, sections),
        expert_note = COALESCE(p_expert_note, expert_note),
        conclusion = COALESCE(p_conclusion, conclusion),
        tags = COALESCE(p_tags, tags),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer un article (back-office)
CREATE OR REPLACE FUNCTION delete_blog_post(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM blog_posts WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques des articles par catégorie
CREATE OR REPLACE FUNCTION count_blog_posts_by_category()
RETURNS TABLE(category TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.category::TEXT,
        COUNT(*)::BIGINT AS count
    FROM blog_posts bp
    GROUP BY bp.category
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: SERVICES - RPC
-- ============================================================================

-- Créer un service (back-office)
CREATE OR REPLACE FUNCTION create_service(
    p_pole_id UUID,
    p_slug VARCHAR,
    p_ref VARCHAR,
    p_title VARCHAR,
    p_subtitle VARCHAR,
    p_description TEXT,
    p_icon VARCHAR,
    p_brochure_url TEXT,
    p_standards TEXT[],
    p_sort_order INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO services (
        pole_id, slug, ref, title, subtitle, description,
        icon, brochure_url, standards, sort_order, status
    )
    VALUES (
        p_pole_id, p_slug, p_ref, p_title, p_subtitle, p_description,
        p_icon, p_brochure_url, p_standards, p_sort_order, p_status
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les services actifs (front-office)
CREATE OR REPLACE FUNCTION get_active_services()
RETURNS TABLE(
    id UUID,
    pole_id UUID,
    slug VARCHAR,
    ref VARCHAR,
    title VARCHAR,
    subtitle VARCHAR,
    description TEXT,
    icon VARCHAR,
    brochure_url TEXT,
    standards TEXT[],
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.pole_id, s.slug, s.ref, s.title, s.subtitle,
        s.description, s.icon, s.brochure_url, s.standards, s.sort_order
    FROM services s
    WHERE s.status = 'active'
    ORDER BY s.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer un service par slug (front-office + back-office)
CREATE OR REPLACE FUNCTION get_service_by_slug(p_slug VARCHAR, p_include_inactive BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
    id UUID,
    pole_id UUID,
    slug VARCHAR,
    ref VARCHAR,
    title VARCHAR,
    subtitle VARCHAR,
    description TEXT,
    icon VARCHAR,
    brochure_url TEXT,
    standards TEXT[],
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.pole_id, s.slug, s.ref, s.title, s.subtitle,
        s.description, s.icon, s.brochure_url, s.standards,
        s.sort_order, s.status, s.created_at, s.updated_at
    FROM services s
    WHERE s.slug = p_slug
      AND (p_include_inactive OR s.status = 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer tous les services avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_services(
    p_status VARCHAR DEFAULT NULL,
    p_pole_id UUID DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    pole_id UUID,
    slug VARCHAR,
    ref VARCHAR,
    title VARCHAR,
    subtitle VARCHAR,
    icon VARCHAR,
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id, s.pole_id, s.slug, s.ref, s.title, s.subtitle,
        s.icon, s.sort_order, s.status, s.created_at
    FROM services s
    WHERE (p_status IS NULL OR s.status = p_status)
      AND (p_pole_id IS NULL OR s.pole_id = p_pole_id)
      AND (p_search IS NULL OR 
           s.title ILIKE '%' || p_search || '%' OR 
           s.description ILIKE '%' || p_search || '%')
    ORDER BY s.sort_order ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour un service (back-office)
CREATE OR REPLACE FUNCTION update_service(
    p_id UUID,
    p_pole_id UUID DEFAULT NULL,
    p_slug VARCHAR DEFAULT NULL,
    p_ref VARCHAR DEFAULT NULL,
    p_title VARCHAR DEFAULT NULL,
    p_subtitle VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_icon VARCHAR DEFAULT NULL,
    p_brochure_url TEXT DEFAULT NULL,
    p_standards TEXT[] DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE services
    SET pole_id = COALESCE(p_pole_id, pole_id),
        slug = COALESCE(p_slug, slug),
        ref = COALESCE(p_ref, ref),
        title = COALESCE(p_title, title),
        subtitle = COALESCE(p_subtitle, subtitle),
        description = COALESCE(p_description, description),
        icon = COALESCE(p_icon, icon),
        brochure_url = COALESCE(p_brochure_url, brochure_url),
        standards = COALESCE(p_standards, standards),
        sort_order = COALESCE(p_sort_order, sort_order),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer un service (back-office)
CREATE OR REPLACE FUNCTION delete_service(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM services WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réordonner les services (back-office)
CREATE OR REPLACE FUNCTION reorder_services(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
    v_order INTEGER := 0;
BEGIN
    FOREACH v_id IN ARRAY p_ids
    LOOP
        UPDATE services SET sort_order = v_order WHERE id = v_id;
        v_order := v_order + 1;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: TEAM_MEMBERS - RPC
-- ============================================================================

-- Créer un membre (back-office)
CREATE OR REPLACE FUNCTION create_team_member(
    p_role VARCHAR,
    p_spec VARCHAR,
    p_description TEXT,
    p_image_url TEXT DEFAULT NULL,
    p_sort_order INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO team_members (role, spec, description, image_url, sort_order, status)
    VALUES (p_role, p_spec, p_description, p_image_url, p_sort_order, p_status)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les membres actifs (front-office)
CREATE OR REPLACE FUNCTION get_active_team_members()
RETURNS TABLE(
    id UUID,
    role VARCHAR,
    spec VARCHAR,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id, tm.role, tm.spec, tm.description, tm.image_url, tm.sort_order
    FROM team_members tm
    WHERE tm.status = 'active'
    ORDER BY tm.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer tous les membres avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_team_members(
    p_status VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    role VARCHAR,
    spec VARCHAR,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.id, tm.role, tm.spec, tm.description, tm.image_url,
        tm.sort_order, tm.status, tm.created_at
    FROM team_members tm
    WHERE (p_status IS NULL OR tm.status = p_status)
      AND (p_search IS NULL OR 
           tm.role ILIKE '%' || p_search || '%' OR 
           tm.spec ILIKE '%' || p_search || '%')
    ORDER BY tm.sort_order ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour un membre (back-office)
CREATE OR REPLACE FUNCTION update_team_member(
    p_id UUID,
    p_role VARCHAR DEFAULT NULL,
    p_spec VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE team_members
    SET role = COALESCE(p_role, role),
        spec = COALESCE(p_spec, spec),
        description = COALESCE(p_description, description),
        image_url = COALESCE(p_image_url, image_url),
        sort_order = COALESCE(p_sort_order, sort_order),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer un membre (back-office)
CREATE OR REPLACE FUNCTION delete_team_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM team_members WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réordonner les membres (back-office)
CREATE OR REPLACE FUNCTION reorder_team_members(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
    v_order INTEGER := 0;
BEGIN
    FOREACH v_id IN ARRAY p_ids
    LOOP
        UPDATE team_members SET sort_order = v_order WHERE id = v_id;
        v_order := v_order + 1;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: REFERENCES - RPC
-- ============================================================================

-- Créer une référence (back-office)
CREATE OR REPLACE FUNCTION create_reference(
    p_ref VARCHAR,
    p_slug VARCHAR,
    p_type VARCHAR,
    p_title VARCHAR,
    p_sector VARCHAR,
    p_location VARCHAR,
    p_period VARCHAR,
    p_image_url TEXT,
    p_context TEXT,
    p_methodology TEXT[],
    p_results_description TEXT,
    p_result_tags TEXT[],
    p_stats JSONB,
    p_technologies TEXT[],
    p_tags TEXT[],
    p_sort_order INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'draft'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO "references" (
        ref, slug, type, title, sector, location, period, image_url,
        context, methodology, results_description, result_tags,
        stats, technologies, tags, sort_order, status
    )
    VALUES (
        p_ref, p_slug, p_type, p_title, p_sector, p_location, p_period, p_image_url,
        p_context, p_methodology, p_results_description, p_result_tags,
        p_stats, p_technologies, p_tags, p_sort_order, p_status
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les références publiées (front-office)
CREATE OR REPLACE FUNCTION get_published_references(
    p_type VARCHAR DEFAULT NULL,
    p_sector VARCHAR DEFAULT NULL,
    p_tag TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    ref VARCHAR,
    slug VARCHAR,
    type VARCHAR,
    title VARCHAR,
    sector VARCHAR,
    location VARCHAR,
    period VARCHAR,
    image_url TEXT,
    context TEXT,
    result_tags TEXT[],
    stats JSONB,
    technologies TEXT[],
    tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.ref, r.slug, r.type, r.title, r.sector, r.location,
        r.period, r.image_url, r.context, r.result_tags, r.stats,
        r.technologies, r.tags
    FROM "references" r
    WHERE r.status = 'published'
      AND (p_type IS NULL OR r.type = p_type)
      AND (p_sector IS NULL OR r.sector = p_sector)
      AND (p_tag IS NULL OR p_tag = ANY(r.tags))
      AND (p_search IS NULL OR 
           r.title ILIKE '%' || p_search || '%' OR 
           r.context ILIKE '%' || p_search || '%')
    ORDER BY r.sort_order ASC, r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer une référence par slug (front-office + back-office)
CREATE OR REPLACE FUNCTION get_reference_by_slug(p_slug VARCHAR, p_include_drafts BOOLEAN DEFAULT FALSE)
RETURNS TABLE(
    id UUID,
    ref VARCHAR,
    slug VARCHAR,
    type VARCHAR,
    title VARCHAR,
    sector VARCHAR,
    location VARCHAR,
    period VARCHAR,
    image_url TEXT,
    context TEXT,
    methodology TEXT[],
    results_description TEXT,
    result_tags TEXT[],
    stats JSONB,
    technologies TEXT[],
    tags TEXT[],
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.ref, r.slug, r.type, r.title, r.sector, r.location,
        r.period, r.image_url, r.context, r.methodology, r.results_description,
        r.result_tags, r.stats, r.technologies, r.tags, r.sort_order,
        r.status, r.created_at, r.updated_at
    FROM "references" r
    WHERE r.slug = p_slug
      AND (p_include_drafts OR r.status = 'published');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer toutes les références avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_references(
    p_status VARCHAR DEFAULT NULL,
    p_type VARCHAR DEFAULT NULL,
    p_sector VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    ref VARCHAR,
    slug VARCHAR,
    type VARCHAR,
    title VARCHAR,
    sector VARCHAR,
    location VARCHAR,
    period VARCHAR,
    image_url TEXT,
    tags TEXT[],
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.ref, r.slug, r.type, r.title, r.sector, r.location,
        r.period, r.image_url, r.tags, r.sort_order, r.status, r.created_at
    FROM "references" r
    WHERE (p_status IS NULL OR r.status = p_status)
      AND (p_type IS NULL OR r.type = p_type)
      AND (p_sector IS NULL OR r.sector = p_sector)
      AND (p_search IS NULL OR 
           r.title ILIKE '%' || p_search || '%' OR 
           r.context ILIKE '%' || p_search || '%')
    ORDER BY r.sort_order ASC, r.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour une référence (back-office)
CREATE OR REPLACE FUNCTION update_reference(
    p_id UUID,
    p_ref VARCHAR DEFAULT NULL,
    p_slug VARCHAR DEFAULT NULL,
    p_type VARCHAR DEFAULT NULL,
    p_title VARCHAR DEFAULT NULL,
    p_sector VARCHAR DEFAULT NULL,
    p_location VARCHAR DEFAULT NULL,
    p_period VARCHAR DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_context TEXT DEFAULT NULL,
    p_methodology TEXT[] DEFAULT NULL,
    p_results_description TEXT DEFAULT NULL,
    p_result_tags TEXT[] DEFAULT NULL,
    p_stats JSONB DEFAULT NULL,
    p_technologies TEXT[] DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE "references"
    SET ref = COALESCE(p_ref, ref),
        slug = COALESCE(p_slug, slug),
        type = COALESCE(p_type, type),
        title = COALESCE(p_title, title),
        sector = COALESCE(p_sector, sector),
        location = COALESCE(p_location, location),
        period = COALESCE(p_period, period),
        image_url = COALESCE(p_image_url, image_url),
        context = COALESCE(p_context, context),
        methodology = COALESCE(p_methodology, methodology),
        results_description = COALESCE(p_results_description, results_description),
        result_tags = COALESCE(p_result_tags, result_tags),
        stats = COALESCE(p_stats, stats),
        technologies = COALESCE(p_technologies, technologies),
        tags = COALESCE(p_tags, tags),
        sort_order = COALESCE(p_sort_order, sort_order),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer une référence (back-office)
CREATE OR REPLACE FUNCTION delete_reference(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM "references" WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques des références par secteur
CREATE OR REPLACE FUNCTION count_references_by_sector()
RETURNS TABLE(sector TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.sector::TEXT,
        COUNT(*)::BIGINT AS count
    FROM "references" r
    GROUP BY r.sector
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques des références par type
CREATE OR REPLACE FUNCTION count_references_by_type()
RETURNS TABLE(type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.type::TEXT,
        COUNT(*)::BIGINT AS count
    FROM "references" r
    GROUP BY r.type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 6: CERTIFICATIONS - RPC
-- ============================================================================

-- Créer une certification (back-office)
CREATE OR REPLACE FUNCTION create_certification(
    p_code VARCHAR,
    p_name VARCHAR,
    p_description TEXT,
    p_status VARCHAR DEFAULT 'target',
    p_icon VARCHAR DEFAULT NULL,
    p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO certifications (code, name, description, status, icon, sort_order)
    VALUES (p_code, p_name, p_description, p_status, p_icon, p_sort_order)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer toutes les certifications (front-office + back-office)
CREATE OR REPLACE FUNCTION get_certifications(
    p_status VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    code VARCHAR,
    name VARCHAR,
    description TEXT,
    status VARCHAR,
    icon VARCHAR,
    sort_order INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, c.code, c.name, c.description, c.status,
        c.icon, c.sort_order, c.created_at, c.updated_at
    FROM certifications c
    WHERE (p_status IS NULL OR c.status = p_status)
      AND (p_search IS NULL OR 
           c.code ILIKE '%' || p_search || '%' OR 
           c.name ILIKE '%' || p_search || '%')
    ORDER BY c.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour une certification (back-office)
CREATE OR REPLACE FUNCTION update_certification(
    p_id UUID,
    p_code VARCHAR DEFAULT NULL,
    p_name VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL,
    p_icon VARCHAR DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE certifications
    SET code = COALESCE(p_code, code),
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        status = COALESCE(p_status, status),
        icon = COALESCE(p_icon, icon),
        sort_order = COALESCE(p_sort_order, sort_order),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer une certification (back-office)
CREATE OR REPLACE FUNCTION delete_certification(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM certifications WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: DASHBOARD STATS - RPC
-- ============================================================================

-- Statistiques globales du dashboard (back-office)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
    total_contacts BIGINT,
    unread_contacts BIGINT,
    total_blog_posts BIGINT,
    published_blog_posts BIGINT,
    total_services BIGINT,
    active_services BIGINT,
    total_team_members BIGINT,
    active_team_members BIGINT,
    total_references BIGINT,
    published_references BIGINT,
    total_certifications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM contacts)::BIGINT,
        (SELECT COUNT(*) FROM contacts WHERE status = 'new')::BIGINT,
        (SELECT COUNT(*) FROM blog_posts)::BIGINT,
        (SELECT COUNT(*) FROM blog_posts WHERE status = 'published')::BIGINT,
        (SELECT COUNT(*) FROM services)::BIGINT,
        (SELECT COUNT(*) FROM services WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM team_members)::BIGINT,
        (SELECT COUNT(*) FROM team_members WHERE status = 'active')::BIGINT,
        (SELECT COUNT(*) FROM "references")::BIGINT,
        (SELECT COUNT(*) FROM "references" WHERE status = 'published')::BIGINT,
        (SELECT COUNT(*) FROM certifications)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 8: PERMISSIONS
-- ============================================================================

-- Contacts
GRANT EXECUTE ON FUNCTION create_contact(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_contacts(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_status(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_contact(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_contacts_by_service() TO authenticated;
GRANT EXECUTE ON FUNCTION count_contacts_by_status() TO authenticated;

-- Blog posts
GRANT EXECUTE ON FUNCTION create_blog_post(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, JSONB, JSONB, TEXT, TEXT[], VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_published_blog_posts(VARCHAR, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_blog_post_by_slug(VARCHAR, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_blog_posts(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_blog_post(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, VARCHAR, VARCHAR, TEXT, JSONB, JSONB, TEXT, TEXT[], VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_blog_post(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_blog_posts_by_category() TO authenticated;

-- Services
GRANT EXECUTE ON FUNCTION create_service(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT[], INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_services() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_service_by_slug(VARCHAR, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_services(VARCHAR, UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_service(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, TEXT, TEXT[], INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_service(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_services(UUID[]) TO authenticated;

-- Team members
GRANT EXECUTE ON FUNCTION create_team_member(VARCHAR, VARCHAR, TEXT, TEXT, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_team_members() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_team_members(VARCHAR, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_team_member(UUID, VARCHAR, VARCHAR, TEXT, TEXT, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_team_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_team_members(UUID[]) TO authenticated;

-- References
GRANT EXECUTE ON FUNCTION create_reference(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TEXT[], TEXT, TEXT[], JSONB, TEXT[], TEXT[], INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_published_references(VARCHAR, VARCHAR, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_reference_by_slug(VARCHAR, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_references(VARCHAR, VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_reference(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TEXT[], TEXT, TEXT[], JSONB, TEXT[], TEXT[], INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_reference(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_references_by_sector() TO authenticated;
GRANT EXECUTE ON FUNCTION count_references_by_type() TO authenticated;

-- Certifications
GRANT EXECUTE ON FUNCTION create_certification(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_certifications(VARCHAR, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_certification(UUID, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_certification(UUID) TO authenticated;

-- Dashboard
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
