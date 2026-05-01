-- Version corrigée de update_my_profile
-- Gère correctement les types de colonnes
-- Exécutez cette commande dans l'éditeur SQL Supabase

-- 1. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_my_profile;

-- 2. Créer la fonction corrigée avec les bons types
CREATE OR REPLACE FUNCTION update_my_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_blood_type TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_weight_kg DECIMAL DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur courant
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Mettre à jour le profil avec conversion de types explicite
  UPDATE profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    blood_type = COALESCE(p_blood_type::text, blood_type::text),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    weight_kg = COALESCE(p_weight_kg, weight_kg),
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION update_my_profile TO authenticated;
