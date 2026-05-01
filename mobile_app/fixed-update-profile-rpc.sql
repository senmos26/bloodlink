-- Version simplifiée de la fonction update_my_profile
-- Résout le problème de colonne ambiguë
-- Exécutez cette commande dans l'éditeur SQL Supabase

-- 1. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_my_profile;

-- 2. Créer la nouvelle fonction simplifiée
CREATE OR REPLACE FUNCTION update_my_profile(
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_blood_type TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_weight_kg DECIMAL DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_next_donation_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_path TEXT,
  blood_type TEXT,
  date_of_birth DATE,
  weight_kg DECIMAL,
  gender TEXT,
  next_donation_date TIMESTAMPTZ,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
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

  -- Mettre à jour le profil
  UPDATE profiles
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    blood_type = COALESCE(p_blood_type, blood_type),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    weight_kg = COALESCE(p_weight_kg, weight_kg),
    gender = COALESCE(p_gender, gender),
    next_donation_date = COALESCE(p_next_donation_date, next_donation_date),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Retourner le profil mis à jour avec une requête simple
  RETURN QUERY SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.avatar_path,
    p.blood_type,
    p.date_of_birth,
    p.weight_kg,
    p.gender,
    p.next_donation_date,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = v_user_id;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION update_my_profile TO authenticated;
