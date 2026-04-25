# Cahier des Charges — Projet BloodLink (MVP) v2.0

> Application de mise en relation entre donneurs de sang et centres de dons.

---

## 1. Informations générales

| Rubrique | Détail |
|---|---|
| **Nom du projet** | BloodLink |
| **Type** | Application mobile (donneur) + interface web admin (centre / super admin) |
| **Durée** | 6 semaines (1,5 mois) |
| **Rythme** | 3 jours par semaine |
| **Mode** | Collaboratif — pair programming rotatif, aucun rôle figé |
| **Livrable** | MVP fonctionnel, déployable et démontrable |
| **Version** | 2.0 (refonte stack technique) |

### 1.1. Équipe

| # | Nom | Rôle |
|---|---|---|
| 1 | Somali Nathanaël Edudzi | Membre (pair rotatif) |
| 2 | Béni Ouendo | Membre (pair rotatif) |
| 3 | Fatoumata Sidibé | Membre (pair rotatif) |
| 4 | Assia AZ | Membre (pair rotatif) |
| 5 | Souhaila Omri | Membre (pair rotatif) |

---

## 2. Contexte et problématique

Le don de sang souffre de :
- **Manque d'information en temps réel** pour les donneurs
- **Difficulté pour les centres** à mobiliser des donneurs compatibles
- **Absence de canal direct** entre centre et donneurs
- **Processus de rendez-vous manuel**, peu structuré
- **Aucun suivi numérique** des dons et de l'éligibilité

BloodLink propose une plateforme qui met en relation les **donneurs** (mobile), les **centres** (web) via un **système d'alertes ciblées, de rendez-vous et de suivi des dons**.

---

## 3. Objectifs du MVP

### 3.1. Objectif général

> Un centre lance une alerte → le système trouve les donneurs compatibles → le donneur est notifié → il prend rendez-vous → le centre confirme → le don est validé → le profil du donneur est mis à jour.

### 3.2. Objectifs spécifiques

- **O1** — Inscription et connexion sécurisée
- **O2** — Gestion de profil centre
- **O3** — Création d'alertes urgentes ciblées
- **O4** — Notification automatique des donneurs compatibles
- **O5** — Prise et gestion de rendez-vous
- **O6** — Validation d'un don + mise à jour éligibilité
- **O7** — Supervision admin minimale

---

## 4. Périmètre du MVP

### 4.1. Inclus

- Auth Supabase Auth (email + JWT)
- Profils donneur et centre
- Alertes urgentes + matching
- Notifications push FCM
- Rendez-vous
- Validation don + éligibilité auto
- Dashboard admin minimal
- Carte des centres
- RLS sur toutes les tables

### 4.2. Exclu (Post-MVP)

- Certificats PDF, gamification, chat, stock sanguin, stats avancées, audit trail, RDV récurrents, paiements, multilingue

---

## 5. Acteurs

| Acteur | Interface | Description |
|---|---|---|
| **Donneur** | 📱 Mobile | Personne qui donne son sang |
| **Centre (admin)** | 💻 Web | Structure qui collecte le sang |
| **Super admin** | 💻 Web | Superviseur plateforme |
| **Système** | Edge Functions + Triggers | Matching, notifications, règles métier |
| **FCM** | Externe | Notifications push |
| **Supabase** | Externe | Backend as a Service |

---

## 6. Règles métier

| Code | Règle |
|---|---|
| **RM01** | Délai de 56 jours entre deux dons |
| **RM02** | Donneur ≥ 18 ans et ≥ 50 kg |
| **RM03** | Centre créé par super admin uniquement |
| **RM04** | Alerte expire automatiquement après deadline |
| **RM05** | Matching = groupe compatible + rayon + éligibilité |
| **RM06** | RDV sur créneau futur uniquement |
| **RM07** | Seul le centre valide un don |
| **RM08** | Après validation don → `next_donation_date` +56 jours (trigger) |
| **RM09** | Utilisateur désactivé ne peut plus se connecter |
| **RM10** | Mots de passe gérés par Supabase Auth (hash auto) |
| **RM11** | RLS activée sur toutes les tables |

### Compatibilité groupes sanguins

| Donneur | Peut donner à |
|---|---|
| `O-` | Tous |
| `O+` | O+, A+, B+, AB+ |
| `A-` | A-, A+, AB-, AB+ |
| `A+` | A+, AB+ |
| `B-` | B-, B+, AB-, AB+ |
| `B+` | B+, AB+ |
| `AB-` | AB-, AB+ |
| `AB+` | AB+ |

---

## 7. Use Cases

| Code | Nom | Acteur | Interface |
|---|---|---|---|
| UC01 | S'inscrire donneur | Donneur | Mobile |
| UC02 | Se connecter | Tous | Mobile + Web |
| UC03 | Se déconnecter | Tous | Mobile + Web |
| UC04 | Gérer profil donneur | Donneur | Mobile |
| UC05 | Gérer profil centre | Centre | Web |
| UC06 | Voir carte des centres | Donneur | Mobile |
| UC07 | Créer alerte urgente | Centre | Web |
| UC08 | Voir alertes actives | Donneur | Mobile |
| UC09 | Recevoir notif alerte | Donneur | Mobile (push) |
| UC10 | Prendre RDV | Donneur | Mobile |
| UC11 | Voir ses RDV | Donneur/Centre | Mobile + Web |
| UC12 | Confirmer/annuler RDV | Centre | Web |
| UC13 | Valider un don | Centre | Web |
| UC14 | Gérer comptes centres | Admin | Web |
| UC15 | Superviser plateforme | Admin | Web |

### Diagramme des cas d'utilisation

```mermaid
graph LR
    D((Donneur 📱))
    C((Centre 💻))
    A((Admin 💻))
    D --> UC01[S'inscrire]
    D --> UC02[Se connecter]
    D --> UC04[Profil donneur]
    D --> UC06[Carte centres]
    D --> UC08[Alertes]
    D --> UC09[Notif push]
    D --> UC10[Prendre RDV]
    D --> UC11[Mes RDV]
    C --> UC02
    C --> UC05[Profil centre]
    C --> UC07[Créer alerte]
    C --> UC12[Confirmer RDV]
    C --> UC13[Valider don]
    A --> UC02
    A --> UC14[Gérer centres]
    A --> UC15[Superviser]
```

### Spécifications détaillées

#### UC01 — S'inscrire donneur
- **Précondition** : Pas de compte existant
- **Scénario** : Saisir email, mot de passe, nom, date naissance, groupe sanguin, poids, téléphone → `supabase.auth.signUp()` → trigger crée profil → redirection accueil
- **Exceptions** : Email utilisé, âge/poids insuffisant (RM02), champs manquants

#### UC02 — Se connecter
- **Scénario** : Email + mot de passe → `supabase.auth.signInWithPassword()` → JWT + session → redirection selon rôle (donor/center_admin/super_admin)
- **Exceptions** : Identifiants incorrects, compte désactivé (RM09)

#### UC07 — Créer alerte urgente
- **Scénario** : Centre saisit groupe sanguin, urgence, rayon, deadline, message → `supabase.from('alerts').insert()` → Edge Function `match-alerts` → push aux donneurs compatibles
- **Exceptions** : Date passée, rayon ≤ 0

#### UC10 — Prendre RDV
- **Précondition** : Donneur éligible (RM01)
- **Scénario** : Choisir centre + date/heure → `supabase.from('appointments').insert()` (pending) → notif centre
- **Exceptions** : Non éligible, créneau passé (RM06)

#### UC13 — Valider don
- **Précondition** : RDV confirmé
- **Scénario** : Centre valide → `donations` insert (validated) → trigger MAJ `next_donation_date` (+56j) → notif donneur

---

## 8. Exigences non-fonctionnelles

| Code | Exigence |
|---|---|
| NF01 | Auth via Supabase Auth (JWT auto, refresh token) |
| NF02 | RLS sur toutes les tables |
| NF03 | API < 500ms pour 95% des requêtes |
| NF04 | Mobile Android API 24+ via Expo |
| NF05 | Git : `main` / `pre-prod` / `feature/*` |
| NF06 | Données protégées par RLS selon rôle |
| NF07 | Géolocalisation DECIMAL (PostGIS post-MVP) |
| NF08 | Edge Functions via Supabase CLI |
| NF09 | Clés API jamais commitées |
| NF10 | Dashboard admin responsive |

---

## 9. Architecture technique

### 9.1. Stack v2.0

| Couche | Technologie |
|---|---|
| App mobile | React Native + Expo |
| Dashboard web | Next.js 15 + TypeScript + Tailwind |
| Backend/DB | Supabase (PostgreSQL, Auth, RLS, Edge Functions, Storage) |
| State mobile | Zustand |
| Push | Firebase FCM |
| Cartes | Google Maps / Mapbox |
| Déploiement mobile | EAS Build (Expo) |
| Déploiement web | Vercel |
| Versionning | Git + GitHub |

### 9.2. Diagramme d'architecture

```mermaid
graph TB
    subgraph Clients
        Mobile[📱 React Native + Expo]
        Web[💻 Next.js + Tailwind]
    end
    subgraph Supabase
        Auth[🔐 Auth JWT]
        DB[(🗄️ PostgreSQL + RLS)]
        API[🔌 REST API]
        EF[⚡ Edge Functions]
        Storage[📦 Storage]
    end
    subgraph Externe
        FCM[🔔 FCM]
        Maps[🗺️ Maps]
    end
    Mobile --> API
    Mobile --> Auth
    Web --> API
    Web --> Auth
    API --> DB
    EF --> DB
    EF --> FCM
    Mobile --> Maps
```

### 9.3. Structure projet

```
bloodlink/
├── mobile/          # React Native + Expo
│   └── src/         # app/, components/, services/, stores/, hooks/, types/
├── admin_web/       # Next.js 15
│   └── src/         # app/, components/, lib/, middleware.ts
├── supabase/        # Backend
│   ├── migrations/  # SQL versionné
│   └── functions/   # Edge Functions
├── shared/          # Types partagés
└── docs/            # Documentation
```

---

## 10. Modèle de données

### Enums

| Enum | Valeurs |
|---|---|
| `user_role` | donor, center_admin, super_admin |
| `blood_type` | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `urgency_level` | low, medium, high, critical |
| `alert_status` | active, expired, closed |
| `appointment_status` | pending, confirmed, cancelled, completed |
| `donation_status` | pending, validated, rejected |
| `notification_type` | alert, appointment, donation, system |

### Table profiles

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK, FK → auth.users |
| full_name | VARCHAR(200) | NOT NULL |
| phone | VARCHAR(20) | NOT NULL |
| blood_type | ENUM | NULLABLE |
| date_of_birth | DATE | NULLABLE |
| weight_kg | DECIMAL(5,2) | CHECK ≥ 50 |
| role | ENUM user_role | DEFAULT donor |
| is_active | BOOLEAN | DEFAULT TRUE |
| next_donation_date | DATE | NULLABLE |
| fcm_token | VARCHAR(255) | NULLABLE |
| latitude/longitude | DECIMAL | NULLABLE |
| created_at/updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### Table centers

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(200) | NOT NULL |
| address | TEXT | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| phone/email | VARCHAR | NOT NULL |
| latitude/longitude | DECIMAL | NOT NULL |
| admin_id | UUID | UNIQUE FK → profiles |
| is_active | BOOLEAN | DEFAULT TRUE |

### Table alerts

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| center_id | UUID | FK → centers |
| blood_type_required | ENUM | NOT NULL |
| urgency_level | ENUM | NOT NULL |
| radius_km | INTEGER | CHECK > 0 |
| message | TEXT | NULLABLE |
| deadline | TIMESTAMPTZ | NOT NULL |
| status | ENUM | DEFAULT active |

### Table appointments

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| donor_id | UUID | FK → profiles |
| center_id | UUID | FK → centers |
| alert_id | UUID | FK NULLABLE → alerts |
| scheduled_date | TIMESTAMPTZ | CHECK > NOW() |
| status | ENUM | DEFAULT pending |

### Table donations

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| donor_id/center_id | UUID | FK |
| appointment_id | UUID | FK NULLABLE |
| donation_date | TIMESTAMPTZ | NOT NULL |
| volume_ml | INTEGER | DEFAULT 450 |
| status | ENUM | DEFAULT pending |
| validated_by | UUID | FK NULLABLE |

### Table notifications

| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → profiles |
| title/body | VARCHAR/TEXT | NOT NULL |
| type | ENUM | NOT NULL |
| is_read | BOOLEAN | DEFAULT FALSE |
| data | JSONB | NULLABLE |

---

## 11. Diagramme UML

```mermaid
classDiagram
    class Profile { +UUID id +string full_name +BloodType blood_type +UserRole role +isEligible() }
    class Center { +UUID id +string name +float lat/lng +createAlert() +validateDonation() }
    class Alert { +UUID id +BloodType blood_type_required +UrgencyLevel urgency_level +matchDonors() }
    class Appointment { +UUID id +datetime scheduled_date +AppointmentStatus status +confirm() }
    class Donation { +UUID id +DonationStatus status +validate() }
    class Notification { +UUID id +string title/body +markAsRead() }
    Profile "1" --> "*" Appointment : prend
    Profile "1" --> "*" Donation : effectue
    Center "1" --> "*" Alert : publie
    Center "1" --> "*" Appointment : gère
    Alert "1" --> "*" Appointment : génère
    Appointment "1" --> "0..1" Donation : produit
```

---

## 12. Schéma relationnel (MCD)

```mermaid
erDiagram
    PROFILES ||--o{ APPOINTMENTS : prend
    PROFILES ||--o{ DONATIONS : effectue
    PROFILES ||--o{ NOTIFICATIONS : recoit
    CENTERS ||--o| PROFILES : administre
    CENTERS ||--o{ ALERTS : publie
    CENTERS ||--o{ APPOINTMENTS : accueille
    ALERTS ||--o{ APPOINTMENTS : genere
    APPOINTMENTS ||--o| DONATIONS : produit
```

---

## 13. Diagramme de séquence (scénario principal)

```mermaid
sequenceDiagram
    C=Centre(Web), SB=Supabase, EF=EdgeFn, FCM=Firebase, D=Donneur(Mobile)
    C->>SB: insert alert
    SB->>EF: match-alerts
    EF->>FCM: push ciblé
    FCM-->>D: notif reçue
    D->>SB: insert appointment
    C->>SB: update appointment (confirmed)
    C->>SB: insert donation (validated)
    SB->>SB: TRIGGER: next_donation_date +56j
    SB->>FCM: notif donneur
```

---

## 14. RLS Policies

| Table | Donneur | Centre Admin | Super Admin |
|---|---|---|---|
| profiles | ALL (propre) | SELECT | ALL |
| centers | SELECT | ALL (propre) | ALL |
| alerts | SELECT | ALL (propre centre) | ALL |
| appointments | ALL (propre) | ALL (propre centre) | SELECT |
| donations | SELECT (propre) | ALL (propre centre) | SELECT |
| notifications | ALL (propre) | - | SELECT |

---

## 15. Edge Functions

| Function | Description | Auth |
|---|---|---|
| match-alerts | Alertes compatibles pour donneur | JWT donor |
| check-eligibility | Vérifie éligibilité RDV | JWT donor |
| create-center | Crée compte centre | JWT super_admin |
| send-push | Envoie push FCM | service_role |
| admin-stats | Stats dashboard admin | JWT super_admin |
| expire-alerts | Marque alertes dépassées (cron) | service_role |

---

## 16. Méthodologie

### Rotation des pairs

| Semaine | Pair A | Pair B | Review |
|---|---|---|---|
| S1 | Assia + Souhaila | Béni + Nathanaël | Fatoumata |
| S2 | Assia + Nathanaël | Souhaila + Fatoumata | Béni |
| S3 | Souhaila + Béni | Fatoumata + Nathanaël | Assia |
| S4 | Nathanaël + Assia | Souhaila + Fatoumata | Béni |
| S5 | Fatoumata + Béni | Assia + Souhaila | Nathanaël |
| S6 | Tous ensemble | Tous ensemble | - |

### Rituels
- Daily 15min : quoi fait hier, aujourd'hui, blocage ?
- Revue fin de module : démo + rétrospective
- Pair programming : driver change toutes les 30min

### Règles Git
- Branches : `main`, `pre-prod`, `feature/<nom>`
- Revue de code obligatoire avant merge
- Pas de push direct sur `main`/`pre-prod`

---

## 17. Planning

| Semaine | Module | Détail |
|---|---|---|
| S1 | Auth & Setup | Login/Register mobile + web, Supabase Auth, Zustand |
| S2 | Profils | Profil donneur, photo, dashboard centre |
| S3 | Carte & Alertes | Google Maps, création alertes, match-alerts |
| S4 | RDV & Notifs | Prise RDV, push FCM, gestion RDV centre |
| S5 | Dons & Validation | QR code, validation don, stats admin |
| S6 | Tests & Deploy | E2E, corrections, APK, Vercel, doc finale |

> Voir `PLAN_TACHES.md` pour les checklists détaillées.

---

## 18. Livrables

- Code source (mobile + web + supabase) sur GitHub
- Ce document (v2.0)
- `ARCHITECTURE_TECHNIQUE.md`
- `PLAN_TACHES.md`
- `GUIDE_INSTALLATION.md`
- `GUIDE_BONNES_PRATIQUES.md`
- Build Android (APK)
- Dashboard web (Vercel)
- Vidéo démo (5-10 min)

---

## 19. Risques

| Risque | Mitigation |
|---|---|
| Matching complexe (M3) | Version simplifiée sans PostGIS |
| Intégration FCM | Tester dès S2 |
| Coordination | Daily + pair programming |
| Dépendance Maps | Fallback liste centres |
| Absences | Doc continue + pair |
| Apprentissage stack | Pair programming + tutoriels |

---

## 20. Critères d'acceptation

- [ ] Donneur : inscription, connexion, profil
- [ ] Centre : connexion, création alerte
- [ ] Donneurs compatibles reçoivent notification
- [ ] Donneur prend RDV
- [ ] Centre confirme RDV
- [ ] Centre valide don
- [ ] `next_donation_date` MAJ automatique
- [ ] Admin crée/suspend compte centre
- [ ] Bout en bout fonctionnel Android + web
- [ ] RLS active et testée

---

## 21. Annexes

### Conventions
- Branches : `main`, `pre-prod`, `feature/<module>`, `fix/<sujet>`
- Commits : `type(scope): message` (ex : `feat(auth): login screen`)
- Code : ESLint + Prettier

### Glossaire

| Terme | Définition |
|---|---|
| MVP | Minimum Viable Product |
| JWT | JSON Web Token |
| FCM | Firebase Cloud Messaging |
| RLS | Row Level Security |
| Edge Function | Fonction serveur Deno (Supabase) |
| EAS | Expo Application Services |

---

*Fin du cahier des charges BloodLink v2.0 — MVP 6 semaines.*
