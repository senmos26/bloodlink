-- ============================================================================
-- PROSAFETY ENGINEERING - SERVICE POLES RPC FUNCTIONS
-- ============================================================================
-- Fonctions RPC pour la gestion des pôles de services
-- ============================================================================

-- Créer un pôle de services (back-office)
CREATE OR REPLACE FUNCTION create_service_pole(
    p_title VARCHAR,
    p_description TEXT,
    p_icon VARCHAR DEFAULT NULL,
    p_sort_order INTEGER DEFAULT 0,
    p_status VARCHAR DEFAULT 'active'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO service_poles (title, description, icon, sort_order, status)
    VALUES (p_title, p_description, p_icon, p_sort_order, p_status)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer tous les pôles avec filtres (back-office)
CREATE OR REPLACE FUNCTION get_service_poles(
    p_status VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    description TEXT,
    icon VARCHAR,
    sort_order INTEGER,
    status VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id, sp.title, sp.description, sp.icon,
        sp.sort_order, sp.status, sp.created_at, sp.updated_at
    FROM service_poles sp
    WHERE (p_status IS NULL OR sp.status = p_status)
      AND (p_search IS NULL OR 
           sp.title ILIKE '%' || p_search || '%' OR 
           sp.description ILIKE '%' || p_search || '%')
    ORDER BY sp.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les pôles actifs (front-office)
CREATE OR REPLACE FUNCTION get_active_service_poles()
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    description TEXT,
    icon VARCHAR,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id, sp.title, sp.description, sp.icon, sp.sort_order
    FROM service_poles sp
    WHERE sp.status = 'active'
    ORDER BY sp.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour un pôle (back-office)
CREATE OR REPLACE FUNCTION update_service_pole(
    p_id UUID,
    p_title VARCHAR DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_icon VARCHAR DEFAULT NULL,
    p_sort_order INTEGER DEFAULT NULL,
    p_status VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE service_poles
    SET title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        icon = COALESCE(p_icon, icon),
        sort_order = COALESCE(p_sort_order, sort_order),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer un pôle (back-office)
CREATE OR REPLACE FUNCTION delete_service_pole(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM service_poles WHERE id = p_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Réordonner les pôles (back-office)
CREATE OR REPLACE FUNCTION reorder_service_poles(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
    v_id UUID;
    v_order INTEGER := 0;
BEGIN
    FOREACH v_id IN ARRAY p_ids
    LOOP
        UPDATE service_poles SET sort_order = v_order WHERE id = v_id;
        v_order := v_order + 1;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_service_pole(VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_service_poles(VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_service_poles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_service_pole(UUID, VARCHAR, TEXT, VARCHAR, INTEGER, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_service_pole(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_service_poles(UUID[]) TO authenticated;
