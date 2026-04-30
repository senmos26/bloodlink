-- ========================================
-- TABLES POUR LE TRACKING DE PARTAGE
-- ========================================

-- Table pour les liens de partage d'alertes
CREATE TABLE alert_shares (
  id uuid primary key default uuid_generate_v4(),
  short_code varchar(8) unique not null,
  original_url text not null,
  share_data jsonb not null,
  user_id uuid references auth.users(id),
  created_at timestamp default now(),
  expires_at timestamp not null,
  click_count integer default 0,
  conversion_count integer default 0
);

-- Table pour suivre l'activité sur les liens
CREATE TABLE share_activities (
  id uuid primary key default uuid_generate_v4(),
  share_link_id varchar(8) references alert_shares(short_code),
  activity_type varchar(20) not null check (activity_type in ('share', 'click', 'conversion')),
  platform varchar(50),
  user_agent text,
  ip_address inet,
  created_at timestamp default now()
);

-- ========================================
-- INDEX POUR OPTIMISATION
-- ========================================

CREATE INDEX idx_alert_shares_short_code ON alert_shares(short_code);
CREATE INDEX idx_alert_shares_user_id ON alert_shares(user_id);
CREATE INDEX idx_alert_shares_created_at ON alert_shares(created_at);
CREATE INDEX idx_share_activities_share_link_id ON share_activities(share_link_id);
CREATE INDEX idx_share_activities_created_at ON share_activities(created_at);

-- ========================================
-- VUES SQL POUR LES ANALYTICS
-- ========================================

-- Vue pour les analytics de partage par utilisateur
CREATE OR REPLACE VIEW user_share_analytics AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT alert_shares.id) as total_shares,
  COALESCE(SUM(alert_shares.click_count), 0) as total_clicks,
  COALESCE(SUM(alert_shares.conversion_count), 0) as total_conversions,
  CASE 
    WHEN COALESCE(SUM(alert_shares.click_count), 0) > 0 
    THEN ROUND((COALESCE(SUM(alert_shares.conversion_count), 0)::decimal / SUM(alert_shares.click_count)) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  MAX(alert_shares.created_at) as last_share_date
FROM auth.users u
LEFT JOIN alert_shares ON u.id = alert_shares.user_id
WHERE u.id = auth.uid()
GROUP BY u.id, u.email;

-- Vue pour les plateformes les plus utilisées
CREATE OR REPLACE VIEW platform_analytics AS
SELECT 
  sa.platform,
  COUNT(*) as usage_count,
  COUNT(DISTINCT sa.share_link_id) as unique_shares,
  COUNT(*) FILTER (WHERE sa.activity_type = 'click') as click_count,
  COUNT(*) FILTER (WHERE sa.activity_type = 'conversion') as conversion_count
FROM share_activities sa
WHERE sa.platform IS NOT NULL
GROUP BY sa.platform
ORDER BY usage_count DESC;

-- Vue pour l'activité récente
CREATE OR REPLACE VIEW recent_share_activities AS
SELECT 
  sa.id,
  sa.activity_type,
  sa.platform,
  sa.created_at,
  alert_shares.share_data->>'centerName' as center_name,
  alert_shares.share_data->>'bloodType' as blood_type,
  alert_shares.user_id
FROM share_activities sa
JOIN alert_shares ON sa.share_link_id = alert_shares.short_code
WHERE alert_shares.user_id = auth.uid()
ORDER BY sa.created_at DESC
LIMIT 50;

-- ========================================
-- FONCTIONS RPC SUPABASE
-- ========================================

-- RPC: Créer un lien de partage
CREATE OR REPLACE FUNCTION create_alert_share(
  p_share_data jsonb,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  short_code varchar,
  original_url text,
  share_data jsonb,
  expires_at timestamp
) AS $$
DECLARE
  v_short_code varchar;
  v_original_url text;
  v_share_link record;
BEGIN
  -- Générer un code court unique
  LOOP
    v_short_code := substring(
      encode(gen_random_bytes(6), 'base64'), 
      1, 
      8
    );
    EXIT WHEN NOT EXISTS (SELECT 1 FROM alert_shares WHERE short_code = v_short_code);
  END LOOP;
  
  -- Construire l'URL
  v_original_url := 'https://bloodlink.app/alert/' || v_short_code;
  
  -- Insérer le lien de partage
  INSERT INTO alert_shares (
    short_code,
    original_url,
    share_data,
    user_id,
    expires_at
  ) VALUES (
    v_short_code,
    v_original_url,
    p_share_data,
    p_user_id,
    now() + interval '7 days'
  ) RETURNING * INTO v_share_link;
  
  -- Retourner les données
  RETURN QUERY SELECT 
    v_share_link.id,
    v_share_link.short_code,
    v_share_link.original_url,
    v_share_link.share_data,
    v_share_link.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Tracker un clic
CREATE OR REPLACE FUNCTION track_share_click(
  p_short_code varchar,
  p_platform varchar DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  -- Incrémenter le compteur de clics
  UPDATE alert_shares 
  SET click_count = click_count + 1 
  WHERE short_code = p_short_code;
  
  -- Enregistrer l'activité
  INSERT INTO share_activities (
    share_link_id,
    activity_type,
    platform,
    user_agent,
    ip_address
  ) VALUES (
    p_short_code,
    'click',
    p_platform,
    current_setting('request.headers')::json->>'user-agent',
    inet_client_addr()
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Tracker une conversion
CREATE OR REPLACE FUNCTION track_share_conversion(
  p_short_code varchar,
  p_platform varchar DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  -- Incrémenter le compteur de conversions
  UPDATE alert_shares 
  SET conversion_count = conversion_count + 1 
  WHERE short_code = p_short_code;
  
  -- Enregistrer l'activité
  INSERT INTO share_activities (
    share_link_id,
    activity_type,
    platform,
    user_agent,
    ip_address
  ) VALUES (
    p_short_code,
    'conversion',
    p_platform,
    current_setting('request.headers')::json->>'user-agent',
    inet_client_addr()
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Obtenir les analytics d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_share_analytics()
RETURNS TABLE (
  total_shares bigint,
  total_clicks bigint,
  total_conversions bigint,
  conversion_rate decimal,
  top_platforms json,
  recent_activity json
) AS $$
DECLARE
  v_platforms json;
  v_activity json;
BEGIN
  -- Obtenir les plateformes les plus utilisées
  SELECT json_agg(
    json_build_object(
      'platform', platform,
      'count', usage_count
    )
  ) INTO v_platforms
  FROM platform_analytics
  LIMIT 5;
  
  -- Obtenir l'activité récente
  SELECT json_agg(
    json_build_object(
      'type', activity_type,
      'timestamp', created_at,
      'platform', platform
    )
  ) INTO v_activity
  FROM recent_share_activities
  LIMIT 10;
  
  -- Retourner les analytics
  RETURN QUERY SELECT 
    COALESCE(usa.total_shares, 0),
    COALESCE(usa.total_clicks, 0),
    COALESCE(usa.total_conversions, 0),
    COALESCE(usa.conversion_rate, 0),
    COALESCE(v_platforms, '[]'::json),
    COALESCE(v_activity, '[]'::json)
  FROM user_share_analytics usa;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- ========================================

ALTER TABLE alert_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_activities ENABLE ROW LEVEL SECURITY;

-- Politiques pour alert_shares
CREATE POLICY "Users can view their own shares" ON alert_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shares" ON alert_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour share_activities
CREATE POLICY "Users can view activities for their shares" ON share_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alert_shares 
      WHERE short_code = share_link_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create share activities" ON share_activities
  FOR INSERT WITH CHECK (true);

-- ========================================
-- GRANTS POUR LES FONCTIONS RPC
-- ========================================

-- Donner les permissions aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_alert_share TO authenticated;
GRANT EXECUTE ON FUNCTION track_share_click TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_share_conversion TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_share_analytics TO authenticated;

-- Donner accès aux vues
GRANT SELECT ON user_share_analytics TO authenticated;
GRANT SELECT ON platform_analytics TO authenticated;
GRANT SELECT ON recent_share_activities TO authenticated;
