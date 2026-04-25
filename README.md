# BloodLink

Application de mise en relation entre donneurs de sang et centres de transfusion sanguine.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + TypeScript (Expo) |
| Admin Web | Next.js 15 + TypeScript + Tailwind CSS |
| Backend / BDD | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Langage | **TypeScript partout** |

## Architecture monorepo

```
bloodlink/
├── mobile/              # Application mobile (Expo)
│   ├── src/
│   │   ├── app/         # Écrans de l'application
│   │   ├── components/  # Composants réutilisables
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API / Supabase clients
│   │   ├── stores/      # État global (Zustand)
│   │   ├── types/       # Types TypeScript
│   │   └── utils/       # Fonctions utilitaires
│   └── ...
│
├── admin_web/           # Dashboard admin (Next.js)
│   ├── src/
│   │   ├── app/         # App Router Next.js
│   │   ├── components/  # Composants réutilisables
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utils, Supabase client
│   │   └── types/       # Types TypeScript
│   └── ...
│
├── supabase/
│   ├── migrations/      # Migrations SQL versionnées
│   ├── seed.sql         # Données initiales
│   └── functions/       # Edge Functions
│
└── docs/                # Documentation du projet
    ├── GUIDE_INSTALLATION.md
    └── GUIDE_BONNES_PRATIQUES.md
```

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) (v20+)
- [Git](https://git-scm.com/)
- Compte [Supabase](https://supabase.com) (gratuit)

### 1. Installation

```bash
cd bloodlink

# Mobile
cd mobile
npm install

# Admin Web
cd ../admin_web
npm install
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer **Project URL** et **anon public** dans Settings → API
3. Créer les fichiers `.env` :

**`mobile/.env.local`**
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**`admin_web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### 3. Lancer les projets

```bash
# Mobile (Expo)
cd mobile
npx expo start

# Admin Web (Next.js)
cd admin_web
npm run dev
```

## Commandes de développement

| Commande | Description |
|----------|-------------|
| `cd mobile && npx expo start` | Lancer l'app mobile |
| `cd admin_web && npm run dev` | Lancer l'admin web |
| `cd admin_web && npm run build` | Build production admin |
| `npx supabase db reset` | Réinitialiser la base locale |
| `npx supabase migration up` | Appliquer les migrations |

## Documentation

- [`docs/GUIDE_INSTALLATION.md`](./docs/GUIDE_INSTALLATION.md) — Guide d'installation détaillé
- [`docs/GUIDE_BONNES_PRATIQUES.md`](./docs/GUIDE_BONNES_PRATIQUES.md) — Règles de collaboration, Git, conventions de code

## Pourquoi cette stack ?

- **Un seul langage** (TypeScript) = même codebase, moins de context-switch
- **Supabase** gère authentification, base de données, stockage et temps réel
- **Expo** simplifie le développement mobile (hot reload, OTA updates)
- **Next.js** offre rendu côté serveur, API routes et déploiement facile sur Vercel
- **Moins de pièces à assembler** = concentration sur les fonctionnalités métier
