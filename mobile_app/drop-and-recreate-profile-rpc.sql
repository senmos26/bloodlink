-- Supprimer l'ancienne fonction update_my_profile puis créer la nouvelle
-- Exécutez cette commande dans l'éditeur SQL Supabase

-- 1. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_my_profile;

-- 2. Créer la nouvelle fonction avec les nouveaux paramètres
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
  v_updated_profile RECORD;
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
  WHERE id = v_user_id
  RETURNING 
    id,
    full_name,
    phone,
    avatar_path,
    blood_type,
    date_of_birth,
    weight_kg,
    gender,
    next_donation_date,
    role,
    is_active,
    created_at,
    updated_at
  INTO v_updated_profile;

  -- Retourner le profil mis à jour
  RETURN QUERY SELECT 
    v_updated_profile.id,
    v_updated_profile.full_name,
    v_updated_profile.phone,
    v_updated_profile.avatar_path,
    v_updated_profile.blood_type,
    v_updated_profile.date_of_birth,
    v_updated_profile.weight_kg,
    v_updated_profile.gender,
    v_updated_profile.next_donation_date,
    v_updated_profile.role,
    v_updated_profile.is_active,
    v_updated_profile.created_at,
    v_updated_profile.updated_at;
END;
$$;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION update_my_profile TO authenticated;
