-- ============================================================================
-- PROSAFETY ENGINEERING - BLOG SEED DATA
-- ============================================================================
-- Données initiales pour les articles de blog
-- ============================================================================

-- Supprimer les données existantes (optionnel)
-- DELETE FROM blog_posts;

-- Article 1: Nouvelle réglementation ATEX 2024
INSERT INTO blog_posts (
    slug, title, category, date, excerpt, read_time, image_url,
    author_name, author_role, introduction, sections, expert_note,
    conclusion, tags, status
) VALUES (
    'nouvelle-reglementation-atex-2024',
    'Nouvelle réglementation ATEX 2024',
    'RÉGLEMENTATION',
    '12.03.2024',
    'Décryptage des nouvelles directives européennes concernant les atmosphères explosives et leur impact sur les sites industriels.',
    '8 MIN',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1000&auto=format&fit=crop',
    'Ing. Marc D.',
    'Expert Sécurité Procédés',
    'Les directives concernant les atmosphères explosives évoluent en 2024. Cette analyse technique décrypte les impacts majeurs pour les sites classés SEVESO et les installations industrielles standards, avec un focus sur la mise en conformité des équipements existants.',
    '[
        {"id": "1", "title": "Contexte Réglementaire", "content": "<p>La gestion des risques industriels entre dans une nouvelle phase avec l''application de la directive révisée. L''objectif principal est d''harmoniser les protocoles de sécurité à l''échelle européenne, en introduisant des critères plus stricts pour la classification des zones.</p>"},
        {"id": "2", "title": "Nouvelles Obligations de Zonage", "content": "<p>Le zonage ATEX (Atmosphères Explosives) doit désormais intégrer des variables dynamiques liées aux cycles de production. Il ne s''agit plus d''une cartographie statique, mais d''une modélisation évolutive.</p><ul><li><strong>Zone 0/20 :</strong> Danger permanent (inchangé).</li><li><strong>Zone 1/21 :</strong> Danger occasionnel (critères de ventilation renforcés).</li><li><strong>Zone 2/22 :</strong> Danger rare (nouvelles exigences sur l''équipement électrique).</li></ul>"},
        {"id": "3", "title": "Impact sur la Maintenance", "content": "<p>La maintenance préventive devient un pilier central de la conformité. Les plans de maintenance doivent être audités et digitalisés pour assurer une traçabilité totale des interventions en zone à risque.</p><blockquote>\"La sécurité n''est pas une contrainte budgétaire, c''est un investissement stratégique pour la pérennité de l''outil industriel et la protection du capital humain.\"</blockquote>"}
    ]'::jsonb,
    '{"title": "NOTE D''EXPERT", "content": "Les équipements installés avant 2018 devront faire l''objet d''un audit de conformité spécifique avant la fin de l''année fiscale en cours."}'::jsonb,
    'Pour anticiper ces changements, Prosafety Engineering recommande de lancer dès maintenant une pré-analyse de vos installations critiques. Nos experts peuvent réaliser un diagnostic flash en 48h.',
    ARRAY['ATEX', 'DIRECTIVE 2024', 'CONFORMITÉ', 'SEVESO'],
    'published'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    read_time = EXCLUDED.read_time,
    image_url = EXCLUDED.image_url,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    introduction = EXCLUDED.introduction,
    sections = EXCLUDED.sections,
    expert_note = EXCLUDED.expert_note,
    conclusion = EXCLUDED.conclusion,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Article 2: Pourquoi réaliser un Bilan Carbone ISO 14064 ?
INSERT INTO blog_posts (
    slug, title, category, date, excerpt, read_time, image_url,
    author_name, author_role, introduction, sections, expert_note,
    conclusion, tags, status
) VALUES (
    'bilan-carbone-iso-14064',
    'Pourquoi réaliser un Bilan Carbone ISO 14064 ?',
    'ENVIRONNEMENT',
    '28.02.2024',
    'Au-delà de l''obligation légale, découvrez comment la comptabilité carbone devient un levier de performance économique.',
    '7 MIN',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1000&auto=format&fit=crop',
    'Dr. Sophie L.',
    'Consultante Environnement',
    'Le bilan carbone n''est plus une simple obligation réglementaire. C''est devenu un outil stratégique pour les entreprises qui souhaitent optimiser leurs coûts énergétiques et renforcer leur image de marque.',
    '[
        {"id": "1", "title": "Qu''est-ce que l''ISO 14064 ?", "content": "<p>La norme ISO 14064 est une norme internationale qui fournit un cadre pour la quantification, la surveillance, la déclaration et la vérification des émissions de gaz à effet de serre (GES). Elle se compose de trois parties distinctes couvrant l''ensemble du processus de comptabilité carbone.</p>"},
        {"id": "2", "title": "Les Avantages Économiques", "content": "<p>Un bilan carbone bien réalisé permet d''identifier les postes de consommation énergétique les plus importants et de mettre en place des actions correctives ciblées.</p><ul><li><strong>Réduction des coûts :</strong> Jusqu''à 15% d''économies sur la facture énergétique.</li><li><strong>Avantage concurrentiel :</strong> Accès facilité aux marchés publics et appels d''offres.</li><li><strong>Image de marque :</strong> Communication positive auprès des parties prenantes.</li></ul>"},
        {"id": "3", "title": "Méthodologie de Réalisation", "content": "<p>La réalisation d''un bilan carbone suit une méthodologie rigoureuse en plusieurs étapes : définition du périmètre, collecte des données, calcul des émissions, analyse des résultats et définition du plan d''action.</p>"}
    ]'::jsonb,
    '{"title": "CONSEIL EXPERT", "content": "Commencez par les scopes 1 et 2 avant d''aborder le scope 3, plus complexe mais souvent représentant 70% des émissions totales."}'::jsonb,
    'Prosafety Engineering accompagne les entreprises dans leur démarche de comptabilité carbone, de l''audit initial à la certification ISO 14064.',
    ARRAY['ISO 14064', 'BILAN CARBONE', 'GES', 'ENVIRONNEMENT', 'RSE'],
    'published'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    read_time = EXCLUDED.read_time,
    image_url = EXCLUDED.image_url,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    introduction = EXCLUDED.introduction,
    sections = EXCLUDED.sections,
    expert_note = EXCLUDED.expert_note,
    conclusion = EXCLUDED.conclusion,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Article 3: Sécurité Incendie : Erreurs fréquentes
INSERT INTO blog_posts (
    slug, title, category, date, excerpt, read_time, image_url,
    author_name, author_role, introduction, sections, expert_note,
    conclusion, tags, status
) VALUES (
    'securite-incendie-erreurs-frequentes',
    'Sécurité Incendie : Erreurs fréquentes',
    'GUIDE TECHNIQUE',
    '15.01.2024',
    'Retour d''expérience sur les non-conformités les plus couramment observées lors de nos audits APSAD.',
    '6 MIN',
    'https://images.unsplash.com/photo-1599694242661-8f50dd54eb26?q=80&w=1000&auto=format&fit=crop',
    'Ing. Paul R.',
    'Expert Sécurité Incendie',
    'Après plus de 200 audits réalisés en 2023, notre équipe a identifié les erreurs les plus fréquentes en matière de sécurité incendie. Ce guide pratique vous aidera à éviter ces pièges courants.',
    '[
        {"id": "1", "title": "Erreur #1 : Maintenance Négligée", "content": "<p>La première cause de non-conformité est le défaut de maintenance des équipements de sécurité incendie. Les extincteurs, RIA et systèmes de détection doivent faire l''objet de vérifications périodiques documentées.</p>"},
        {"id": "2", "title": "Erreur #2 : Signalétique Inadaptée", "content": "<p>Une signalétique mal positionnée ou non conforme aux normes NF peut compromettre l''évacuation en cas d''urgence.</p><ul><li>Plans d''évacuation obsolètes</li><li>Balisage lumineux défaillant</li><li>Issues de secours mal identifiées</li></ul>"},
        {"id": "3", "title": "Erreur #3 : Formation Insuffisante", "content": "<p>Le personnel doit être formé régulièrement aux procédures d''évacuation et à l''utilisation des moyens de première intervention. Les exercices d''évacuation annuels sont obligatoires.</p>"}
    ]'::jsonb,
    '{"title": "POINT RÉGLEMENTAIRE", "content": "Selon l''article R4227-39 du Code du travail, des exercices d''évacuation doivent être réalisés au moins tous les 6 mois dans les établissements où sont manipulées des substances inflammables."}'::jsonb,
    'Un audit préventif permet d''identifier et de corriger ces non-conformités avant qu''elles ne deviennent critiques. Contactez nos experts pour un diagnostic complet.',
    ARRAY['SÉCURITÉ INCENDIE', 'APSAD', 'AUDIT', 'CONFORMITÉ', 'ERP'],
    'published'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    read_time = EXCLUDED.read_time,
    image_url = EXCLUDED.image_url,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    introduction = EXCLUDED.introduction,
    sections = EXCLUDED.sections,
    expert_note = EXCLUDED.expert_note,
    conclusion = EXCLUDED.conclusion,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Article 4: Digitalisation des permis de feu
INSERT INTO blog_posts (
    slug, title, category, date, excerpt, read_time, image_url,
    author_name, author_role, introduction, sections, expert_note,
    conclusion, tags, status
) VALUES (
    'digitalisation-permis-de-feu',
    'Digitalisation des permis de feu',
    'INNOVATION',
    '10.12.2023',
    'Comment les outils numériques sécurisent et accélèrent les processus d''autorisation de travaux par points chauds.',
    '5 MIN',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1000&auto=format&fit=crop',
    'Ing. Thomas B.',
    'Responsable Innovation',
    'La digitalisation des permis de feu représente une avancée majeure dans la gestion de la sécurité des travaux par points chauds. Découvrez comment cette transformation améliore la traçabilité et réduit les risques.',
    '[
        {"id": "1", "title": "Les Limites du Papier", "content": "<p>Les permis de feu traditionnels sur papier présentent de nombreuses limitations : risque de perte, difficulté de suivi en temps réel, archivage complexe et absence de traçabilité automatique.</p>"},
        {"id": "2", "title": "Avantages de la Digitalisation", "content": "<p>La dématérialisation apporte des bénéfices immédiats :</p><ul><li><strong>Traçabilité complète :</strong> Historique de toutes les validations</li><li><strong>Alertes automatiques :</strong> Notifications aux responsables</li><li><strong>Géolocalisation :</strong> Suivi des zones de travaux</li><li><strong>Reporting :</strong> Statistiques et indicateurs en temps réel</li></ul>"},
        {"id": "3", "title": "Mise en Œuvre", "content": "<p>Le déploiement d''une solution digitale de permis de feu nécessite une phase de paramétrage adaptée à votre organisation et une formation des équipes terrain.</p>"}
    ]'::jsonb,
    '{"title": "RETOUR D''EXPÉRIENCE", "content": "Nos clients ayant adopté la digitalisation constatent une réduction de 40% du temps de traitement des permis et une amélioration significative de la conformité."}'::jsonb,
    'Prosafety Engineering propose des solutions de digitalisation sur mesure, intégrées à vos systèmes existants.',
    ARRAY['DIGITALISATION', 'PERMIS DE FEU', 'INNOVATION', 'SÉCURITÉ', 'TRAVAUX'],
    'published'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    read_time = EXCLUDED.read_time,
    image_url = EXCLUDED.image_url,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    introduction = EXCLUDED.introduction,
    sections = EXCLUDED.sections,
    expert_note = EXCLUDED.expert_note,
    conclusion = EXCLUDED.conclusion,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Article 5: Maintenance Prédictive en Zone ATEX
INSERT INTO blog_posts (
    slug, title, category, date, excerpt, read_time, image_url,
    author_name, author_role, introduction, sections, expert_note,
    conclusion, tags, status
) VALUES (
    'maintenance-predictive-zone-atex',
    'Maintenance Prédictive en Zone ATEX',
    'RÉGLEMENTATION',
    '05.11.2023',
    'Les capteurs IoT certifiés ATEX révolutionnent la maintenance en prévenant les défaillances avant qu''elles ne surviennent.',
    '9 MIN',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=1000&auto=format&fit=crop',
    'Ing. Marc D.',
    'Expert Sécurité Procédés',
    'L''Internet des Objets (IoT) ouvre de nouvelles perspectives pour la maintenance des équipements en atmosphères explosives. Découvrez comment les capteurs certifiés ATEX permettent d''anticiper les pannes.',
    '[
        {"id": "1", "title": "Qu''est-ce que la Maintenance Prédictive ?", "content": "<p>Contrairement à la maintenance préventive basée sur des intervalles fixes, la maintenance prédictive utilise des données en temps réel pour déterminer le moment optimal d''intervention. Cette approche réduit les arrêts non planifiés et optimise la durée de vie des équipements.</p>"},
        {"id": "2", "title": "Capteurs IoT Certifiés ATEX", "content": "<p>Les capteurs utilisés en zone ATEX doivent répondre à des exigences strictes :</p><ul><li><strong>Certification Ex :</strong> Conformité aux directives ATEX/IECEx</li><li><strong>Sécurité intrinsèque :</strong> Limitation de l''énergie électrique</li><li><strong>Communication sans fil :</strong> Protocoles sécurisés (LoRa, WirelessHART)</li></ul>"},
        {"id": "3", "title": "Cas d''Usage Industriels", "content": "<p>Les applications sont nombreuses : surveillance vibratoire des machines tournantes, monitoring thermique des armoires électriques, détection de fuites sur les réseaux de fluides, analyse des gaz ambiants.</p>"}
    ]'::jsonb,
    '{"title": "TECHNOLOGIE", "content": "Les algorithmes de machine learning permettent désormais de prédire les défaillances avec une précision supérieure à 90% sur certains types d''équipements."}'::jsonb,
    'Prosafety Engineering accompagne les industriels dans le déploiement de solutions IoT certifiées pour leurs zones à risques.',
    ARRAY['MAINTENANCE PRÉDICTIVE', 'IOT', 'ATEX', 'INDUSTRIE 4.0', 'CAPTEURS'],
    'published'
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    date = EXCLUDED.date,
    excerpt = EXCLUDED.excerpt,
    read_time = EXCLUDED.read_time,
    image_url = EXCLUDED.image_url,
    author_name = EXCLUDED.author_name,
    author_role = EXCLUDED.author_role,
    introduction = EXCLUDED.introduction,
    sections = EXCLUDED.sections,
    expert_note = EXCLUDED.expert_note,
    conclusion = EXCLUDED.conclusion,
    tags = EXCLUDED.tags,
    status = EXCLUDED.status,
    updated_at = NOW();
