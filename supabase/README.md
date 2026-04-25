# Supabase — BloodLink Backend

> Backend as a Service pour BloodLink : PostgreSQL, Auth, Realtime, Edge Functions.

---

## Table des matières

1. [Architecture](#architecture)
2. [Structure du dossier](#structure-du-dossier)
3. [Configuration initiale](#configuration-initiale)
4. [Migrations SQL](#migrations-sql)
5. [Edge Functions](#edge-functions)
6. [Configuration Auth](#configuration-auth)
7. [RLS Policies](#rls-policies)
8. [Triggers](#triggers)
9. [Commandes CLI](#commandes-cli)
10. [Dépannage](#dépannage)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE CLOUD                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │ PostgreSQL  │  │  Edge Functions     │ │
│  │             │  │             │  │                     │ │
│  │ • JWT       │  │ • Tables    │  │ • match-alerts      │ │
│  │ • Sessions  │  │ • Enums     │  │ • check-eligibility │ │
│  │ • OAuth     │  │ • RLS       │  │ • create-center     │ │
│  │ • Email     │  │ • Triggers  │  │ • send-push         │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │
│         │                │                                   │
│         └────────────────┼────────────────┐                 │
│                          │                │                 │
│  ┌───────────────────────┴────────────────┴─────────────┐  │
│  │                    REST API / WebSocket               │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  Mobile  │        │  Admin   │        │  Cron    │
   │  (Expo)  │        │  (Next)  │        │  Jobs    │
   └──────────┘        └──────────┘        └──────────┘
```

---

## Structure du dossier

```
supabase/
├── config.toml              # Configuration Supabase CLI
├── README.md                # Ce fichier
├── migrations/              # Scripts SQL versionnés
│   ├── 00001_initial.sql   # Tables, enums, RLS, triggers
│   └── 00002_seed_data.sql # Données de test (dev)
├── functions/              # Edge Functions (TypeScript/Deno)
│   ├── match-alerts/
│   │   └── index.ts
│   ├── check-eligibility/
│   │   └── index.ts
│   ├── create-center/
│   │   └── index.ts
│   └── _shared/            # Code partagé entre functions
│       └── supabase.ts
└── seeds/                  # Données de test (optionnel)
    └── centers.sql
```

---

## Configuration initiale

### 1. Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

```bash
# Installer Supabase CLI globalement
npm install -g supabase
```

### 2. Connexion au projet

```bash
# Se connecter à Supabase
supabase login

# Lier le projet existant (remplacer par votre project-ref)
supabase link --project-ref xgdinqpxjywlfhjylktu
```

### 3. Variables d'environnement

Créer les fichiers `.env.local` :

**Mobile (`bloodlink/mobile/.env.local`) :**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xgdinqpxjywlfhjylktu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Admin Web (`bloodlink/admin_web/.env.local`) :**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xgdinqpxjywlfhjylktu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side uniquement
```

> ⚠️ **IMPORTANT** : Ne jamais commiter `.env.local` ! Vérifier qu'il est dans `.gitignore`.

---

## Migrations SQL

### Appliquer les migrations

```bash
# En local (si supabase start)
supabase db reset

# Sur le projet cloud (production/staging)
supabase db push
```

### Créer une nouvelle migration

```bash
supabase migration new add_notifications_table
# Éditer le fichier supabase/migrations/00002_add_notifications_table.sql
```

### Migration actuelle (`00001_initial.sql`)

| Élément | Description |
|---------|-------------|
| **Extensions** | `uuid-ossp`, `postgis` (optionnel) |
| **Enums** | `user_role`, `blood_type`, `urgency_level`, `alert_status`, `appointment_status`, `donation_status`, `notification_type` |
| **Tables** | `profiles`, `centers`, `alerts`, `appointments`, `donations`, `notifications` |
| **Indexes** | Sur colonnes fréquemment filtrées |
| **RLS** | Policies pour chaque table (public, donor, center_admin, super_admin) |
| **Triggers** | `handle_new_user`, `update_updated_at_column`, `expire_old_alerts`, `update_donor_eligibility`, `update_notification_read_at` |

### Tables créées

```sql
-- Vue d'ensemble des tables
\dt public.*

-- Structure d'une table
\d public.profiles

-- Vérifier les policies RLS
\dp public.profiles
```

---

## Edge Functions

### Liste des functions

| Function | Description | Auth requise |
|----------|-------------|--------------|
| `match-alerts` | Trouve les alertes compatibles pour un donneur | ✅ JWT |
| `check-eligibility` | Vérifie si un donneur peut prendre RDV | ✅ JWT |
| `create-center` | Crée un compte centre (admin uniquement) | ✅ super_admin |
| `send-push` | Envoie notifications push via FCM | ✅ service_role |
| `admin-stats` | Stats pour le dashboard admin | ✅ super_admin |
| `expire-alerts` | Marque les alertes dépassées (cron) | ✅ service_role |

### Déployer une function

```bash
# Déployer une function spécifique
supabase functions deploy match-alerts

# Déployer toutes les functions
supabase functions deploy

# Voir les logs en temps réel
supabase functions logs match-alerts --tail
```

### Tester localement

```bash
# Lancer les functions localement
supabase functions serve

# Dans un autre terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/match-alerts' \
  --header 'Authorization: Bearer <JWT>' \
  --header 'Content-Type: application/json' \
  --data '{
    "donor_id": "uuid",
    "latitude": 6.1370,
    "longitude": 1.2123
  }'
```

---

## Configuration Auth

### Paramètres Email (Supabase Dashboard)

1. Aller sur **Authentication → Providers → Email**
2. Configurer :
   - ✅ **Confirm email** : Activé (recommandé pour production)
   - ✅ **Secure email change** : Activé
   - ✅ **Secure password change** : Activé
   - **Site URL** : `bloodlink://` (deep link mobile)
   - **Redirect URLs** : 
     - `bloodlink://auth/callback`
     - `http://localhost:3000/auth/callback` (dev admin)

### Templates d'email personnalisés (optionnel)

**Confirmation email :**
```html
<h2>Bienvenue sur BloodLink !</h2>
<p>Confirmez votre email en cliquant sur le lien :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
```

### Créer un super_admin manuellement

```sql
-- 1. Créer l'utilisateur via Supabase Auth (Dashboard ou API)
-- 2. Mettre à jour le rôle en SQL :
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = 'UUID_DU_USER';
```

---

## RLS Policies

### Matrice des permissions

| Table | Public | Donneur | Centre Admin | Super Admin |
|-------|--------|---------|--------------|-------------|
| `profiles` | SELECT (public) | ALL (own) | SELECT | ALL |
| `centers` | SELECT (active) | SELECT | ALL (own) | ALL |
| `alerts` | SELECT (active) | SELECT | ALL (own) | ALL |
| `appointments` | - | ALL (own) | ALL (own center) | SELECT |
| `donations` | - | SELECT (own) | ALL (own center) | SELECT |
| `notifications` | - | ALL (own) | - | SELECT |

### Désactiver RLS temporairement (debug uniquement)

```sql
-- ⚠️ DANGER : Ne jamais en production
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Réactiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

---

## Triggers

### Liste des triggers actifs

| Trigger | Table | Événement | Action |
|---------|-------|-----------|--------|
| `on_auth_user_created` | `auth.users` | INSERT | Crée automatiquement un `profile` |
| `update_profiles_updated_at` | `profiles` | UPDATE | MAJ `updated_at` |
| `update_centers_updated_at` | `centers` | UPDATE | MAJ `updated_at` |
| `update_alerts_updated_at` | `alerts` | UPDATE | MAJ `updated_at` |
| `update_appointments_updated_at` | `appointments` | UPDATE | MAJ `updated_at` |
| `on_donation_validated` | `donations` | UPDATE | MAJ `next_donation_date` (+56 jours) |
| `on_notification_read` | `notifications` | UPDATE | MAJ `read_at` |

### Cron job : Expiration des alertes

Configurer dans **Database → Cron Jobs** (ou via SQL) :

```sql
SELECT cron.schedule(
  'expire-old-alerts',
  '*/5 * * * *',  -- Toutes les 5 minutes
  'SELECT public.expire_old_alerts()'
);
```

---

## Commandes CLI

### Commandes essentielles

```bash
# 🔐 Authentification
supabase login                    # Se connecter
supabase logout                   # Se déconnecter

# 🔗 Projet
supabase link --project-ref <ref> # Lier un projet
supabase status                   # Voir le statut

# 💾 Base de données
supabase db pull                  # Récupérer les migrations du cloud
supabase db push                  # Appliquer les migrations locales
supabase db reset                 # Reset complet (local uniquement)
supabase db lint                  # Vérifier les migrations

# 🚀 Edge Functions
supabase functions new my-function    # Créer une nouvelle function
supabase functions serve              # Lancer en local
supabase functions deploy my-function # Déployer
supabase functions logs my-function   # Voir les logs

# 🌐 Local Development
supabase start                    # Démarrer tout (DB + Auth + API)
supabase stop                     # Arrêter
supabase stop --backup            # Arrêter avec backup

# 📊 Database inspection
supabase gen types typescript --linked  # Générer les types TypeScript
```

### Générer les types TypeScript

```bash
# Générer les types pour le projet lié
supabase gen types typescript --linked > ../mobile/src/types/supabase.ts

# Ou pour un projet spécifique
supabase gen types typescript --project-id xgdinqpxjywlfhjylktu > types.ts
```

---

## Dépannage

### Problèmes courants

| Erreur | Cause | Solution |
|--------|-------|----------|
| `New version of Supabase CLI is available` | CLI obsolète | `npm update -g supabase` |
| `Failed to start docker containers` | Docker non lancé | Démarrer Docker Desktop |
| `invalid project ref format` | Mauvais project-ref | Vérifier dans Settings > General |
| `permission denied for table` | RLS bloque | Vérifier les policies, utiliser `auth.uid()` |
| `JWT expired` | Token invalide | Se reconnecter, refresh token |
| `cannot execute ... in a read-only transaction` | Connexion en read-only | Utiliser la bonne clé (anon vs service_role) |

### Vérifier la connexion

```bash
# Tester la connexion auth
curl -X GET 'https://xgdinqpxjywlfhjylktu.supabase.co/auth/v1/user' \
  -H 'apikey: <ANON_KEY>' \
  -H 'Authorization: Bearer <JWT>'

# Tester une requête SQL simple
curl -X POST 'https://xgdinqpxjywlfhjylktu.supabase.co/rest/v1/profiles?select=*&limit=1' \
  -H 'apikey: <ANON_KEY>' \
  -H 'Authorization: Bearer <JWT>'
```

### Debug RLS

```sql
-- Voir les policies d'une table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Voir l'utilisateur courant
SELECT auth.uid();
SELECT auth.role();

-- Tester une policy manuellement
SELECT * FROM public.profiles
WHERE id = auth.uid();
```

### Références utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

## Ressources du projet

| Ressource | Lien |
|-----------|------|
| Dashboard | https://supabase.com/dashboard/project/xgdinqpxjywlfhjylktu |
| API URL | `https://xgdinqpxjywlfhjylktu.supabase.co` |
| GraphQL | `https://xgdinqpxjywlfhjylktu.supabase.co/graphql/v1` |
| Database | `postgresql://postgres:[YOUR-PASSWORD]@db.xgdinqpxjywlfhjylktu.supabase.co:5432/postgres` |

---

*Dernière mise à jour : 2026-04-24*
