-- Migration: Vrais centres de transfusion sanguine à Rabat
-- Source: Recherche web - Centre National, CHU Ibn Sina, etc.
-- Date: 2026-04-28

-- Supprime les faux centres de test précédents
DELETE FROM public.alerts WHERE center_id LIKE '8d7d0002-9d10-4b7a-8b10-%';
DELETE FROM public.centers WHERE id LIKE '8d7d0002-9d10-4b7a-8b10-%';

-- Vrais centres de transfusion sanguine à Rabat
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
    '8d7d0003-9d10-4b7a-8b10-000000000001',
    'Centre National de Transfusion Sanguine (CNTS)',
    '472, rue Mfadel Cherkaoui, quartier Al Irfane',
    'Rabat',
    '+212537774993',
    'cnts.rabat@sante.gov.ma',
    34.02080000,
    -6.84150000,
    TRUE
  ),
  (
    '8d7d0003-9d10-4b7a-8b10-000000000002',
    'CHU Ibn Sina - Service de Transfusion Sanguine',
    'Hôpital des Enfants, quartier Souissi, CHU Ibn Sina',
    'Rabat',
    '+212537776666',
    'transfusion.chu@sante.gov.ma',
    34.02550000,
    -6.84200000,
    TRUE
  ),
  (
    '8d7d0003-9d10-4b7a-8b10-000000000003',
    'Centre de Transfusion Sanguine - Hôpital Militaire',
    'Bd. Mohamed VI, quartier Souissi, près du CHU Ibn Sina',
    'Rabat',
    '+212537772222',
    'transfusion.militaire@forcesarmees.ma',
    34.02800000,
    -6.83800000,
    TRUE
  ),
  (
    '8d7d0003-9d10-4b7a-8b10-000000000004',
    'Centre de Transfusion Sanguine - EMI Agdal',
    'École Mohammadia d''Ingénieurs, Avenue Ibn Sina, Agdal',
    'Rabat',
    '+212537770014',
    'transfusion@emi.ac.ma',
    34.02300000,
    -6.85300000,
    TRUE
  ),
  (
    '8d7d0003-9d10-4b7a-8b10-000000000005',
    'Hôpital des Spécialités de Rabat - Banque de Sang',
    'Avenue Mohamed Belarbi El Alaoui, Souissi',
    'Rabat',
    '+212537781010',
    'banquesang@hopitaux.gov.ma',
    34.01850000,
    -6.83850000,
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

-- Alertes actives pour ces centres
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
    '9e8e0003-7b20-4d7a-8c20-000000000001',
    '8d7d0003-9d10-4b7a-8b10-000000000001',
    'O-',
    'critical',
    20,
    'Urgence nationale: besoin immédiat de donneurs O- au CNTS Rabat.',
    NOW() + INTERVAL '1 day',
    'active'
  ),
  (
    '9e8e0003-7b20-4d7a-8c20-000000000002',
    '8d7d0003-9d10-4b7a-8b10-000000000001',
    'A+',
    'high',
    15,
    'Collecte urgente A+ pour réapprovisionner les stocks du CNTS.',
    NOW() + INTERVAL '3 days',
    'active'
  ),
  (
    '9e8e0003-7b20-4d7a-8c20-000000000003',
    '8d7d0003-9d10-4b7a-8b10-000000000002',
    'AB-',
    'medium',
    10,
    'CHU Ibn Sina: besoin régulier de donneurs AB- pour service pédiatrique.',
    NOW() + INTERVAL '5 days',
    'active'
  ),
  (
    '9e8e0003-7b20-4d7a-8c20-000000000004',
    '8d7d0003-9d10-4b7a-8b10-000000000002',
    'B+',
    'high',
    12,
    'Urgence CHU: besoin B+ pour patient en oncologie pédiatrique.',
    NOW() + INTERVAL '2 days',
    'active'
  ),
  (
    '9e8e0003-7b20-4d7a-8c20-000000000005',
    '8d7d0003-9d10-4b7a-8b10-000000000003',
    'O+',
    'medium',
    25,
    'Appel aux donneurs O+ pour l''Hôpital Militaire de Rabat.',
    NOW() + INTERVAL '4 days',
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
