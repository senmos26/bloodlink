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
    '8d7d0001-9d10-4b7a-8b10-000000000001',
    'Hôpital Privé de Salé',
    'Intersection Avenue Ben Guerir et Avenue Mediouna, Arrondissement Bettana',
    'Salé',
    '+212500000101',
    'bettana-hopital-prive@bloodlink.local',
    34.03151830,
    -6.80252180,
    TRUE
  ),
  (
    '8d7d0001-9d10-4b7a-8b10-000000000002',
    'Centre de santé urbain Ibn Al Haytham',
    'Arrondissement Bettana, proche de la station tram Bettana',
    'Salé',
    '+212500000102',
    'bettana-ibn-al-haytham@bloodlink.local',
    34.03420000,
    -6.80590000,
    TRUE
  ),
  (
    '8d7d0001-9d10-4b7a-8b10-000000000003',
    'Centre de diagnostic multi-disciplinaire Bettana',
    'Hay Essalam, Bettana',
    'Salé',
    '+212500000103',
    'bettana-diagnostic@bloodlink.local',
    34.03980000,
    -6.79050000,
    TRUE
  ),
  (
    '8d7d0001-9d10-4b7a-8b10-000000000004',
    'Centre de prise en charge des maladies chroniques Bettana',
    'Hay Essalam, Bettana',
    'Salé',
    '+212500000104',
    'bettana-maladies-chroniques@bloodlink.local',
    34.04060000,
    -6.78960000,
    TRUE
  ),
  (
    '8d7d0001-9d10-4b7a-8b10-000000000005',
    'Centre d''Hémodialyse Bettana',
    'Hay Moulay Ismail, Bettana',
    'Salé',
    '+212500000105',
    'bettana-hemodialyse@bloodlink.local',
    34.03680000,
    -6.79890000,
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
    '9e8e0001-7b20-4d7a-8c20-000000000001',
    '8d7d0001-9d10-4b7a-8b10-000000000001',
    'O-',
    'critical',
    12,
    'Besoin urgent de donneurs O- autour de Bettana pour prise en charge hospitalière.',
    NOW() + INTERVAL '3 days',
    'active'
  ),
  (
    '9e8e0001-7b20-4d7a-8c20-000000000002',
    '8d7d0001-9d10-4b7a-8b10-000000000002',
    'A+',
    'high',
    8,
    'Collecte prioritaire à proximité de la station tram Bettana.',
    NOW() + INTERVAL '5 days',
    'active'
  ),
  (
    '9e8e0001-7b20-4d7a-8c20-000000000003',
    '8d7d0001-9d10-4b7a-8b10-000000000003',
    'B+',
    'medium',
    10,
    'Besoin régulier pour le secteur Hay Essalam.',
    NOW() + INTERVAL '7 days',
    'active'
  ),
  (
    '9e8e0001-7b20-4d7a-8c20-000000000004',
    '8d7d0001-9d10-4b7a-8b10-000000000004',
    'AB+',
    'low',
    6,
    'Campagne locale de sensibilisation et de collecte autour de Bettana.',
    NOW() + INTERVAL '10 days',
    'active'
  ),
  (
    '9e8e0001-7b20-4d7a-8c20-000000000005',
    '8d7d0001-9d10-4b7a-8b10-000000000005',
    'O+',
    'high',
    9,
    'Collecte renforcée demandée pour les structures de Bettana.',
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
