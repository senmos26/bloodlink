-- Migration: Centres de don à Rabat (secteur Av. Jean Jaurès / Agdal)
-- Créé le: 2026-04-28

-- Centres de transfusion et hôpitaux autour de Rabat centre/Agdal
INSERT INTO public.centers (
  id,
  name,
  address,
  city,
  phone,
  email,
  latitude,
  longitude,
  is_active
)
VALUES
  (
    '8d7d0002-9d10-4b7a-8b10-000000000101',
    'Centre de Transfusion Sanguine (CTS) Ibn Sina',
    'Hôpital Ibn Sina, Av. Ibn Sina, Rabat',
    'Rabat',
    '+212537780101',
    'cts.ibnsina@bloodlink.local',
    34.02550000,
    -6.84200000,
    TRUE
  ),
  (
    '8d7d0002-9d10-4b7a-8b10-000000000102',
    'Hôpital des Spécialités de Rabat',
    'Av. Mohamed Belarbi El Alaoui, Souissi, Rabat',
    'Rabat',
    '+212537780102',
    'hopital.specialites@bloodlink.local',
    34.01850000,
    -6.83850000,
    TRUE
  ),
  (
    '8d7d0002-9d10-4b7a-8b10-000000000103',
    'Centre Hospitalier Universitaire (CHU) Ibn Sina',
    'Quartier Souissi, Rabat',
    'Rabat',
    '+212537780103',
    'chu.ibnsina@bloodlink.local',
    34.02800000,
    -6.84500000,
    TRUE
  ),
  (
    '8d7d0002-9d10-4b7a-8b10-000000000104',
    'Clinique Dar Al Amal',
    'Av. Omar Ibn Al Khattab, Agdal, Rabat',
    'Rabat',
    '+212537780104',
    'clinique.daramal@bloodlink.local',
    34.02200000,
    -6.84800000,
    TRUE
  ),
  (
    '8d7d0002-9d10-4b7a-8b10-000000000105',
    'Centre de Santé Anassr',
    'Bd. Mohamed VI, près de l''hôpital Militaire, Rabat',
    'Rabat',
    '+212537780105',
    'cs.anassr@bloodlink.local',
    34.03100000,
    -6.83500000,
    TRUE
  ),
  (
    '8d7d0002-9d10-4b7a-8b10-000000000106',
    'Hôpital Militaire de Rabat',
    'Bd. Mohamed VI, Av. des FAR, Rabat',
    'Rabat',
    '+212537780106',
    'hopital.militaire@bloodlink.local',
    34.03300000,
    -6.83200000,
    TRUE
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Alertes actives pour les centres de Rabat
INSERT INTO public.alerts (
  id,
  center_id,
  blood_type_required,
  urgency_level,
  radius_km,
  message,
  deadline,
  status
)
VALUES
  (
    '9e8e0002-7b20-4d7a-8c20-000000000101',
    '8d7d0002-9d10-4b7a-8b10-000000000101',
    'O-',
    'critical',
    15,
    'Urgence vitale: besoin immédiat de donneurs O- au CTS Ibn Sina pour un patient en chirurgie cardiaque.',
    NOW() + INTERVAL '2 days',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000102',
    '8d7d0002-9d10-4b7a-8b10-000000000101',
    'A+',
    'high',
    10,
    'Collecte urgente de sang A+ pour réapprovisionnement des stocks critiques.',
    NOW() + INTERVAL '4 days',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000103',
    '8d7d0002-9d10-4b7a-8b10-000000000102',
    'AB-',
    'medium',
    12,
    'Appel aux donneurs AB-: stocks bas à l''Hôpital des Spécialités.',
    NOW() + INTERVAL '6 days',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000104',
    '8d7d0002-9d10-4b7a-8b10-000000000103',
    'B+',
    'high',
    8,
    'Besoin urgent B+ pour service d''hématologie du CHU Ibn Sina.',
    NOW() + INTERVAL '3 days',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000105',
    '8d7d0002-9d10-4b7a-8b10-000000000104',
    'O+',
    'medium',
    10,
    'Collecte régulière: donneurs O+ recherchés à la Clinique Dar Al Amal.',
    NOW() + INTERVAL '7 days',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000106',
    '8d7d0002-9d10-4b7a-8b10-000000000106',
    'A-',
    'critical',
    20,
    'Urgence militaire: donneurs A- nécessaires pour blessés graves.',
    NOW() + INTERVAL '1 day',
    'active'
  ),
  (
    '9e8e0002-7b20-4d7a-8c20-000000000107',
    '8d7d0002-9d10-4b7a-8b10-000000000105',
    'B-',
    'low',
    8,
    'Campagne de sensibilisation et collecte B- au Centre de Santé Anassr.',
    NOW() + INTERVAL '10 days',
    'active'
  )
ON CONFLICT (id) DO UPDATE
SET
  center_id = EXCLUDED.center_id,
  blood_type_required = EXCLUDED.blood_type_required,
  urgency_level = EXCLUDED.urgency_level,
  radius_km = EXCLUDED.radius_km,
  message = EXCLUDED.message,
  deadline = EXCLUDED.deadline,
  status = EXCLUDED.status,
  updated_at = NOW();
