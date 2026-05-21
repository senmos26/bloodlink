-- Migration 00007_alerts_push_automation.sql
-- Automatisation des notifications push et in-app lors de la création d'alertes
-- Créée le: 2026-05-21

-- 1. Activer l'extension pg_net si elle n'est pas déjà installée
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Créer la table des paramètres de l'application (pour stocker de manière sécurisée les secrets)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Activer RLS pour empêcher toute lecture externe (les fonctions SECURITY DEFINER peuvent toujours lire)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 3. Fonction helper pour vérifier la compatibilité des groupes sanguins
CREATE OR REPLACE FUNCTION public.check_blood_compatibility(
  p_donor public.blood_type,
  p_recipient public.blood_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (
    p_donor = 'O-' OR
    (p_donor = 'O+' AND p_recipient IN ('O+', 'A+', 'B+', 'AB+')) OR
    (p_donor = 'A-' AND p_recipient IN ('A-', 'A+', 'AB-', 'AB+')) OR
    (p_donor = 'A+' AND p_recipient IN ('A+', 'AB+')) OR
    (p_donor = 'B-' AND p_recipient IN ('B-', 'B+', 'AB-', 'AB+')) OR
    (p_donor = 'B+' AND p_recipient IN ('B+', 'AB+')) OR
    (p_donor = 'AB-' AND p_recipient IN ('AB-', 'AB+')) OR
    (p_donor = 'AB+' AND p_recipient = 'AB+')
  );
END;
$$;

COMMENT ON FUNCTION public.check_blood_compatibility IS 'Détermine si le sang d''un donneur est compatible avec celui d''un receveur.';

-- 4. Fonction helper pour calculer la distance géodésique de Haversine en kilomètres
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R double precision := 6371.0; -- Rayon de la Terre en km
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * asin(sqrt(a));
  RETURN R * c;
END;
$$;

COMMENT ON FUNCTION public.calculate_distance IS 'Calcule la distance entre deux points GPS en km en utilisant la formule de Haversine.';

-- 5. RPC pour récupérer les donneurs compatibles pour une alerte donnée
CREATE OR REPLACE FUNCTION public.get_compatible_donors_for_alert(p_alert_id UUID)
RETURNS TABLE (
  user_id UUID,
  fcm_token VARCHAR(255),
  distance_km double precision
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_center_lat double precision;
  v_center_lon double precision;
  v_blood_type public.blood_type;
  v_radius_km integer;
BEGIN
  -- Récupérer les détails de l'alerte et du centre associé
  SELECT c.latitude, c.longitude, a.blood_type_required, a.radius_km
  INTO v_center_lat, v_center_lon, v_blood_type, v_radius_km
  FROM public.alerts a
  JOIN public.centers c ON a.center_id = c.id
  WHERE a.id = p_alert_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.fcm_token,
    public.calculate_distance(v_center_lat, v_center_lon, p.latitude::double precision, p.longitude::double precision) AS distance_km
  FROM public.profiles p
  WHERE 
    p.role = 'donor'::public.user_role
    AND p.is_active = TRUE
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    -- Compatibilité sanguine
    AND public.check_blood_compatibility(p.blood_type, v_blood_type)
    -- Éligibilité temporelle
    AND (p.next_donation_date IS NULL OR p.next_donation_date <= CURRENT_DATE)
    -- Filtre géographique (dans le rayon de l'alerte)
    AND public.calculate_distance(v_center_lat, v_center_lon, p.latitude::double precision, p.longitude::double precision) <= v_radius_km;
END;
$$;

COMMENT ON FUNCTION public.get_compatible_donors_for_alert IS 'Récupère les donneurs actifs compatibles et à proximité d''une alerte.';

-- 6. Trigger et fonction pour appeler l'Edge Function send-push lors de la création d'une alerte
CREATE OR REPLACE FUNCTION public.handle_alert_insert_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_secret text;
  v_payload jsonb;
  v_url text;
BEGIN
  -- Récupérer le secret depuis public.app_settings
  SELECT value INTO v_webhook_secret
  FROM public.app_settings
  WHERE key = 'webhook_secret';

  v_webhook_secret := COALESCE(v_webhook_secret, '');
  
  -- URL de l'Edge Function Deno send-push
  v_url := 'https://xgdinqpxjywlfhjylktu.supabase.co/functions/v1/send-push';

  -- Construire le payload JSON à envoyer
  v_payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'alerts',
    'record', row_to_json(NEW)
  );

  -- Appel HTTP POST asynchrone via pg_net
  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_webhook_secret
    ),
    body := v_payload
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_alert_insert_webhook IS 'Déclenche l''envoi asynchrone d''une alerte vers l''Edge Function via HTTP POST.';

-- Création du trigger après insertion d'une alerte
DROP TRIGGER IF EXISTS trg_alert_insert_webhook ON public.alerts;
CREATE TRIGGER trg_alert_insert_webhook
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_alert_insert_webhook();
