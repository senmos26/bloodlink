-- SETTINGS OPTIONS (Icons / Standards / Tags / Categories)

CREATE TABLE IF NOT EXISTS settings_icon_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  lucide_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_standard_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_tag_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_blog_category_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings_icon_options (value, label, lucide_name, sort_order, is_active)
VALUES
  ('Factory', 'Industrie', 'Factory', 1, TRUE),
  ('Flame', 'Incendie', 'Flame', 2, TRUE),
  ('Leaf', 'Environnement', 'Leaf', 3, TRUE),
  ('Settings', 'Technique', 'Settings', 4, TRUE),
  ('FileCheck', 'Conformité', 'FileCheck', 5, TRUE),
  ('Briefcase', 'Conseil', 'Briefcase', 6, TRUE)
ON CONFLICT (value) DO NOTHING;

INSERT INTO settings_standard_options (value, label, description, sort_order, is_active)
VALUES
  ('ISO', 'ISO', 'Organisation internationale de normalisation', 1, TRUE),
  ('ATEX', 'ATEX', 'Atmosphères explosives', 2, TRUE),
  ('NFPA', 'NFPA', 'National Fire Protection Association', 3, TRUE),
  ('APSAD', 'APSAD', 'Assemblée Plénière des Sociétés d''Assurances Dommages', 4, TRUE),
  ('API', 'API', 'American Petroleum Institute', 5, TRUE),
  ('ASME', 'ASME', 'American Society of Mechanical Engineers', 6, TRUE)
ON CONFLICT (value) DO NOTHING;

INSERT INTO settings_tag_options (value, label, color, sort_order, is_active)
VALUES
  ('ATEX', 'ATEX', '#ef4444', 1, TRUE),
  ('SÉCURITÉ', 'Sécurité', '#f97316', 2, TRUE),
  ('INCENDIE', 'Incendie', '#dc2626', 3, TRUE),
  ('ENVIRONNEMENT', 'Environnement', '#22c55e', 4, TRUE),
  ('ISO 14064', 'ISO 14064', '#3b82f6', 5, TRUE),
  ('CONFORMITÉ', 'Conformité', '#8b5cf6', 6, TRUE),
  ('AUDIT', 'Audit', '#06b6d4', 7, TRUE),
  ('FORMATION', 'Formation', '#eab308', 8, TRUE),
  ('RÉGLEMENTATION', 'Réglementation', '#64748b', 9, TRUE),
  ('INNOVATION', 'Innovation', '#ec4899', 10, TRUE)
ON CONFLICT (value) DO NOTHING;

INSERT INTO settings_blog_category_options (value, label, description, sort_order, is_active)
VALUES
  ('RÉGLEMENTATION', 'Réglementation', 'Articles sur les nouvelles réglementations', 1, TRUE),
  ('ENVIRONNEMENT', 'Environnement', 'Articles sur l''environnement et le développement durable', 2, TRUE),
  ('GUIDE TECHNIQUE', 'Guide Technique', 'Guides et tutoriels techniques', 3, TRUE),
  ('INNOVATION', 'Innovation', 'Articles sur les innovations technologiques', 4, TRUE),
  ('ACTUALITÉS', 'Actualités', 'Actualités de l''entreprise et du secteur', 5, TRUE),
  ('FORMATION', 'Formation', 'Articles sur les formations et certifications', 6, TRUE)
ON CONFLICT (value) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_settings_icon_options_sort_order ON settings_icon_options(sort_order);
CREATE INDEX IF NOT EXISTS idx_settings_standard_options_sort_order ON settings_standard_options(sort_order);
CREATE INDEX IF NOT EXISTS idx_settings_tag_options_sort_order ON settings_tag_options(sort_order);
CREATE INDEX IF NOT EXISTS idx_settings_blog_category_options_sort_order ON settings_blog_category_options(sort_order);

CREATE TRIGGER update_settings_icon_options_updated_at
  BEFORE UPDATE ON settings_icon_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_standard_options_updated_at
  BEFORE UPDATE ON settings_standard_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_tag_options_updated_at
  BEFORE UPDATE ON settings_tag_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_blog_category_options_updated_at
  BEFORE UPDATE ON settings_blog_category_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE settings_icon_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_standard_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_tag_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_blog_category_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_icon_options_anon_select ON settings_icon_options
  FOR SELECT TO anon
  USING (is_active = TRUE);

CREATE POLICY settings_standard_options_anon_select ON settings_standard_options
  FOR SELECT TO anon
  USING (is_active = TRUE);

CREATE POLICY settings_tag_options_anon_select ON settings_tag_options
  FOR SELECT TO anon
  USING (is_active = TRUE);

CREATE POLICY settings_blog_category_options_anon_select ON settings_blog_category_options
  FOR SELECT TO anon
  USING (is_active = TRUE);

CREATE POLICY settings_icon_options_auth_all ON settings_icon_options
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY settings_standard_options_auth_all ON settings_standard_options
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY settings_tag_options_auth_all ON settings_tag_options
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY settings_blog_category_options_auth_all ON settings_blog_category_options
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION get_settings_icon_options(p_include_inactive BOOLEAN DEFAULT TRUE)
RETURNS TABLE(
  id UUID,
  value TEXT,
  label TEXT,
  lucide_name TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.value, i.label, i.lucide_name, i.sort_order, i.is_active, i.created_at, i.updated_at
  FROM settings_icon_options i
  WHERE (p_include_inactive OR i.is_active = TRUE)
  ORDER BY i.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_settings_icon_option(
  p_value TEXT,
  p_label TEXT,
  p_lucide_name TEXT,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE v_id UUID;
DECLARE v_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_order FROM settings_icon_options;

  INSERT INTO settings_icon_options(value, label, lucide_name, sort_order, is_active)
  VALUES (p_value, p_label, p_lucide_name, v_order, p_is_active)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_settings_icon_option(
  p_id UUID,
  p_value TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_lucide_name TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settings_icon_options
  SET value = COALESCE(p_value, value),
      label = COALESCE(p_label, label),
      lucide_name = COALESCE(p_lucide_name, lucide_name),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_settings_icon_option(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM settings_icon_options WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reorder_settings_icon_options(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
  v_order INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_ids
  LOOP
    UPDATE settings_icon_options SET sort_order = v_order WHERE id = v_id;
    v_order := v_order + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_settings_standard_options(p_include_inactive BOOLEAN DEFAULT TRUE)
RETURNS TABLE(
  id UUID,
  value TEXT,
  label TEXT,
  description TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.value, s.label, s.description, s.sort_order, s.is_active, s.created_at, s.updated_at
  FROM settings_standard_options s
  WHERE (p_include_inactive OR s.is_active = TRUE)
  ORDER BY s.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_settings_standard_option(
  p_value TEXT,
  p_label TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE v_id UUID;
DECLARE v_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_order FROM settings_standard_options;

  INSERT INTO settings_standard_options(value, label, description, sort_order, is_active)
  VALUES (p_value, p_label, p_description, v_order, p_is_active)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_settings_standard_option(
  p_id UUID,
  p_value TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settings_standard_options
  SET value = COALESCE(p_value, value),
      label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_settings_standard_option(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM settings_standard_options WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reorder_settings_standard_options(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
  v_order INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_ids
  LOOP
    UPDATE settings_standard_options SET sort_order = v_order WHERE id = v_id;
    v_order := v_order + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_settings_tag_options(p_include_inactive BOOLEAN DEFAULT TRUE)
RETURNS TABLE(
  id UUID,
  value TEXT,
  label TEXT,
  color TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.value, t.label, t.color, t.sort_order, t.is_active, t.created_at, t.updated_at
  FROM settings_tag_options t
  WHERE (p_include_inactive OR t.is_active = TRUE)
  ORDER BY t.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_settings_tag_option(
  p_value TEXT,
  p_label TEXT,
  p_color TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE v_id UUID;
DECLARE v_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_order FROM settings_tag_options;

  INSERT INTO settings_tag_options(value, label, color, sort_order, is_active)
  VALUES (p_value, p_label, p_color, v_order, p_is_active)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_settings_tag_option(
  p_id UUID,
  p_value TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settings_tag_options
  SET value = COALESCE(p_value, value),
      label = COALESCE(p_label, label),
      color = COALESCE(p_color, color),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_settings_tag_option(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM settings_tag_options WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reorder_settings_tag_options(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
  v_order INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_ids
  LOOP
    UPDATE settings_tag_options SET sort_order = v_order WHERE id = v_id;
    v_order := v_order + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_settings_blog_category_options(p_include_inactive BOOLEAN DEFAULT TRUE)
RETURNS TABLE(
  id UUID,
  value TEXT,
  label TEXT,
  description TEXT,
  sort_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.value, c.label, c.description, c.sort_order, c.is_active, c.created_at, c.updated_at
  FROM settings_blog_category_options c
  WHERE (p_include_inactive OR c.is_active = TRUE)
  ORDER BY c.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_settings_blog_category_option(
  p_value TEXT,
  p_label TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE v_id UUID;
DECLARE v_order INTEGER;
BEGIN
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_order FROM settings_blog_category_options;

  INSERT INTO settings_blog_category_options(value, label, description, sort_order, is_active)
  VALUES (p_value, p_label, p_description, v_order, p_is_active)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_settings_blog_category_option(
  p_id UUID,
  p_value TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_sort_order INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settings_blog_category_options
  SET value = COALESCE(p_value, value),
      label = COALESCE(p_label, label),
      description = COALESCE(p_description, description),
      is_active = COALESCE(p_is_active, is_active),
      sort_order = COALESCE(p_sort_order, sort_order),
      updated_at = NOW()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_settings_blog_category_option(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM settings_blog_category_options WHERE id = p_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reorder_settings_blog_category_options(p_ids UUID[])
RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
  v_order INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_ids
  LOOP
    UPDATE settings_blog_category_options SET sort_order = v_order WHERE id = v_id;
    v_order := v_order + 1;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_settings_icon_options(BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_settings_icon_option(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_settings_icon_option(UUID, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_settings_icon_option(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_settings_icon_options(UUID[]) TO authenticated;

GRANT EXECUTE ON FUNCTION get_settings_standard_options(BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_settings_standard_option(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_settings_standard_option(UUID, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_settings_standard_option(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_settings_standard_options(UUID[]) TO authenticated;

GRANT EXECUTE ON FUNCTION get_settings_tag_options(BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_settings_tag_option(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_settings_tag_option(UUID, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_settings_tag_option(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_settings_tag_options(UUID[]) TO authenticated;

GRANT EXECUTE ON FUNCTION get_settings_blog_category_options(BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_settings_blog_category_option(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_settings_blog_category_option(UUID, TEXT, TEXT, TEXT, BOOLEAN, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_settings_blog_category_option(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_settings_blog_category_options(UUID[]) TO authenticated;
