-- ============================================================================
-- PROSAFETY ENGINEERING - DONNÉES INITIALES (SEED)
-- ============================================================================
-- Données de test pour le développement
-- ============================================================================

-- ============================================================================
-- SERVICE POLES (Pôles de services)
-- ============================================================================

INSERT INTO service_poles (id, title, description, icon, sort_order, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'Études & Ingénierie', 'Études techniques et ingénierie de sécurité industrielle', 'FileText', 1, 'active'),
('a1000000-0000-0000-0000-000000000002', 'Conseil & Expertise', 'Conseil et expertise en sécurité et environnement', 'Users', 2, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SERVICES
-- ============================================================================

INSERT INTO services (id, pole_id, slug, ref, title, subtitle, description, icon, standards, sort_order, status) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'risques-industriels', 'REF.ING.01', 'Risques Industriels', 'Analyse et gestion des risques majeurs', 'Études de dangers, POI, PPRT. Analyse des risques industriels majeurs et mise en conformité réglementaire.', 'AlertTriangle', ARRAY['ISO 31000', 'ATEX', 'SEVESO'], 1, 'active'),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'securite-incendie', 'REF.ING.02', 'Sécurité Incendie', 'Protection et prévention incendie', 'Études de sécurité incendie, dimensionnement des moyens de protection et d''extinction.', 'Flame', ARRAY['NFPA', 'APSAD', 'EN 13501'], 2, 'active'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'environnement', 'REF.ING.03', 'Études Environnementales', 'Impact et gestion environnementale', 'Études d''impact environnemental, audits environnementaux, plans de gestion.', 'Leaf', ARRAY['ISO 14001', 'ICPE'], 3, 'active'),
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'dimensionnement', 'REF.ING.04', 'Dimensionnement Équipements', 'Dimensionnement technique', 'Dimensionnement des équipements de sécurité, systèmes de détection et protection.', 'Ruler', ARRAY['EN', 'NF', 'API'], 4, 'active'),
('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'evaluation-offres', 'REF.CSL.01', 'Évaluation des Offres', 'Analyse et comparaison des offres', 'Analyse technique et économique des offres fournisseurs, aide à la décision.', 'ClipboardCheck', ARRAY[]::TEXT[], 5, 'active'),
('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'cahier-des-charges', 'REF.CSL.02', 'Cahier des Charges (CCTP)', 'Rédaction CCTP', 'Rédaction de cahiers des charges techniques pour appels d''offres.', 'FileText', ARRAY[]::TEXT[], 6, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEAM MEMBERS
-- ============================================================================

INSERT INTO team_members (id, role, spec, description, sort_order, status) VALUES
('c1000000-0000-0000-0000-000000000001', 'Directeur Général', 'Ingénieur Sécurité Procédés', 'Expert en sécurité industrielle avec plus de 20 ans d''expérience dans les secteurs pétrolier et chimique.', 1, 'active'),
('c1000000-0000-0000-0000-000000000002', 'Responsable Technique', 'Ingénieur Environnement', 'Spécialiste des études d''impact environnemental et de la conformité réglementaire.', 2, 'active'),
('c1000000-0000-0000-0000-000000000003', 'Consultant Senior', 'Expert Sécurité Incendie', 'Consultant expert en sécurité incendie et systèmes de protection.', 3, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BLOG POSTS
-- ============================================================================

INSERT INTO blog_posts (id, slug, title, category, date, excerpt, read_time, author_name, author_role, introduction, sections, conclusion, tags, status) VALUES
('d1000000-0000-0000-0000-000000000001', 'nouvelles-normes-securite-2024', 'Les nouvelles normes de sécurité industrielle 2024', 'RÉGLEMENTATION', '15.01.2024', 'Découvrez les dernières évolutions réglementaires en matière de sécurité industrielle pour 2024.', '5 MIN', 'Jean Dupont', 'Directeur Général', 'L''année 2024 apporte son lot de nouvelles réglementations en matière de sécurité industrielle. Cet article fait le point sur les principales évolutions.', '[{"id": "1", "title": "Évolutions SEVESO", "content": "Les installations classées SEVESO font l''objet de nouvelles exigences..."}, {"id": "2", "title": "Normes ATEX", "content": "Les zones ATEX doivent désormais respecter..."}]', 'Ces évolutions réglementaires nécessitent une adaptation rapide des entreprises pour rester en conformité.', ARRAY['sécurité', 'normes', 'réglementation', '2024'], 'published'),
('d1000000-0000-0000-0000-000000000002', 'etude-dangers-methodologie', 'Comment réaliser une étude de dangers efficace', 'GUIDE TECHNIQUE', '08.01.2024', 'Guide pratique pour mener à bien vos études de dangers selon les meilleures pratiques.', '8 MIN', 'Marie Martin', 'Responsable Technique', 'L''étude de dangers est un document clé pour toute installation industrielle. Voici notre méthodologie éprouvée.', '[{"id": "1", "title": "Identification des dangers", "content": "La première étape consiste à identifier tous les dangers potentiels..."}, {"id": "2", "title": "Analyse des risques", "content": "Une fois les dangers identifiés, il faut évaluer les risques associés..."}]', 'Une étude de dangers bien menée est la base d''une politique de sécurité efficace.', ARRAY['étude de dangers', 'méthodologie', 'risques'], 'published')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- REFERENCES (Projets)
-- ============================================================================

INSERT INTO "references" (id, ref, slug, type, title, sector, location, period, context, methodology, results_description, result_tags, stats, technologies, tags, sort_order, status) VALUES
('e1000000-0000-0000-0000-000000000001', 'PROJET 2024-001', 'audit-securite-raffinerie', 'audit', 'Audit sécurité raffinerie', 'Pétrochimie', 'Port-Gentil, Gabon', '2024', 'Audit complet de sécurité pour une raffinerie de 50 000 barils/jour. Identification des non-conformités et recommandations.', ARRAY['Analyse documentaire', 'Inspections terrain', 'Interviews du personnel', 'Rapport de synthèse'], 'Mise en conformité complète de l''installation avec les normes internationales.', ARRAY['CONFORMITÉ', 'SÉCURITÉ OPTIMALE'], '[{"value": "50 000", "label": "Barils/jour"}, {"value": "3", "label": "Mois d''audit"}, {"value": "150", "label": "Points vérifiés"}]', ARRAY['ATEX', 'HAZOP', 'SIL'], ARRAY['pétrole', 'raffinerie', 'audit'], 1, 'published'),
('e1000000-0000-0000-0000-000000000002', 'PROJET 2023-015', 'etude-impact-cimenterie', 'etude_de_cas', 'Étude d''impact cimenterie', 'Cimenterie', 'Lomé, Togo', '2023', 'Étude d''impact environnemental pour l''extension d''une cimenterie. Analyse des émissions et plan de mitigation.', ARRAY['Inventaire des émissions', 'Modélisation atmosphérique', 'Étude acoustique', 'Plan de gestion'], 'Obtention de l''autorisation environnementale et démarrage des travaux.', ARRAY['AUTORISATION OBTENUE', 'IMPACT MAÎTRISÉ'], '[{"value": "2M", "label": "Tonnes/an"}, {"value": "6", "label": "Mois d''étude"}, {"value": "100%", "label": "Conformité"}]', ARRAY['EIE', 'Modélisation', 'GES'], ARRAY['ciment', 'environnement', 'impact'], 2, 'published')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================

INSERT INTO certifications (id, code, name, description, status, sort_order) VALUES
('f1000000-0000-0000-0000-000000000001', 'ISO 9001', 'Système de Management de la Qualité', 'Certification internationale pour le management de la qualité.', 'acquired', 1),
('f1000000-0000-0000-0000-000000000002', 'ISO 14001', 'Système de Management Environnemental', 'Certification pour le management environnemental.', 'in_progress', 2),
('f1000000-0000-0000-0000-000000000003', 'ISO 45001', 'Santé et Sécurité au Travail', 'Certification pour la santé et sécurité au travail.', 'target', 3)
ON CONFLICT (id) DO NOTHING;
