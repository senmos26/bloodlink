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
    LEFT JOIN service_poles sp ON sp.id = s.pole_id
    WHERE s.status = 'active'
      AND (s.pole_id IS NULL OR sp.status = 'active')
    ORDER BY s.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    LEFT JOIN service_poles sp ON sp.id = s.pole_id
    WHERE s.slug = p_slug
      AND (
        p_include_inactive
        OR (
          s.status = 'active'
          AND (s.pole_id IS NULL OR sp.status = 'active')
        )
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_active_services() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_service_by_slug(VARCHAR, BOOLEAN) TO anon, authenticated;
