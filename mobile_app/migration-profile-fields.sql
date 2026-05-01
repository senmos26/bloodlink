-- Migration pour ajouter le champ gender à la table profiles
-- next_donation_date existe déjà, donc on ajoute seulement gender
-- Exécutez cette commande dans l'éditeur SQL Supabase

ALTER TABLE profiles 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', null));

-- Créer un index pour le genre
CREATE INDEX idx_profiles_gender ON profiles(gender) WHERE gender IS NOT NULL;
