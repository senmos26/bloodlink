# BloodLink 🩸

Application de mise en relation entre donneurs de sang et centres de transfusion sanguine, avec assistant IA intégré (SangBot).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| **Mobile** | React Native + Expo SDK 54 + NativeWind (Tailwind CSS natif) |
| **Centre Web** | Next.js 15.4 + Tailwind 4 + shadcn/ui (53 composants) |
| **Admin Web** | Next.js 16.2 + Tailwind 4 + shadcn/ui |
| **IA Chat** | Vercel AI SDK v6 + Groq (Llama 3.3 70B) + RAG (pgvector) |
| **Backend / BDD** | Supabase (PostgreSQL + Auth + Storage + Realtime + pgvector) |
| **Langage** | **TypeScript partout** |

## Architecture monorepo

```
Boold_link/
├── mobile_app/              # Application mobile donneur (Expo SDK 54)
│   ├── app/                 # Écrans Expo Router
│   │   ├── (auth)/          # Login, register, verify-otp
│   │   ├── (tabs)/          # Home, map, appointments, profile
│   │   └── ...              # Alert detail, booking, share, analytics
│   ├── components/
│   │   ├── ai/              # ChatDrawer, ChatInput, ChatWidget, useChat
│   │   ├── ui/              # Composants atomiques
│   │   └── profile/         # Composants profil
│   ├── services/            # Supabase, alerts, appointments, push, sharing
│   ├── hooks/               # Custom hooks
│   └── supabase/migrations/ # 7 migrations SQL
│
├── center_web/              # Dashboard centre + IA SangBot (Next.js 15.4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [locale]/    # i18n (fr/en/de/es) via next-intl
│   │   │   │   ├── (auth)/  # Login, forgot/new-password
│   │   │   │   └── (dashboard)/ # Alerts, appointments, donations, donors, settings
│   │   │   └── api/chat/    # SSE streaming SangBot
│   │   ├── components/ui/   # 53 composants shadcn/ui
│   │   ├── features/
│   │   │   ├── ai/          # models, prompts, rag, tools (SangBot)
│   │   │   └── ...          # alerts, appointments, auth, dashboard, donations...
│   │   ├── entities/        # alert, appointment, center, donation, donor
│   │   └── shared/          # i18n, supabase, auth, utils, types
│   └── ...
│
├── admin_web/               # Dashboard super admin (Next.js 16.2)
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/       # Dashboard, centers, donors, appointments, donations, alerts, scan-qr, statistics, settings
│   │   │   └── login/       # Auth pages
│   │   ├── components/      # Composants UI shadcn
│   │   ├── features/        # alerts, appointments, auth, centers, dashboard...
│   │   └── lib/             # supabase, utils
│   └── ...
│
└── docs/                    # Documentation du projet
    ├── CAHIER_DES_CHARGES_V2.md
    ├── ARCHITECTURE_TECHNIQUE.md
    ├── GUIDE_INSTALLATION.md
    └── GUIDE_BONNES_PRATIQUES.md
```

## Fonctionnalités

- 🔴 **Alertes urgentes** — Centres créent des alertes de besoin de sang, matching automatique par groupe + géolocalisation
- 📅 **Prise de rendez-vous** — Donneurs prennent RDV, centres confirment/annulent
- 🩸 **Validation de don** — Centres valident les dons, mise à jour automatique de l'éligibilité (56 jours)
- 🤖 **SangBot (IA)** — Assistant conversationnel avec streaming SSE, tool calling, RAG sur base de connaissances
- 🔗 **Partage d'alertes** — Liens courts, QR codes, analytics de clics/conversions
- 🌍 **Multilingue** — Interface centre web en fr/en/de/es (next-intl)
- 📱 **Push notifications** — Expo Notifications + Firebase FCM
- 📄 **Export PDF** — jspdf, @react-pdf/renderer, exceljs
- 🗺️ **Cartographie** — react-native-maps (mobile), Leaflet (admin)
- 🔐 **Sécurité RLS** — Row Level Security sur toutes les tables

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) (v20+)
- [Git](https://git-scm.com/)
- Compte [Supabase](https://supabase.com) (gratuit)
- Clé [Groq](https://console.groq.com/) (gratuit, pour SangBot)

### 1. Installation

```bash
cd Boold_link

# Mobile
cd mobile_app && npm install

# Centre Web
cd ../center_web && npm install

# Admin Web
cd ../admin_web && npm install
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Activer les extensions **postgis** et **vector** dans Database → Extensions
3. Récupérer **Project URL**, **anon public** et **service_role** dans Settings → API
4. Créer les fichiers `.env` :

**`mobile_app/.env`**
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**`center_web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
GROQ_API_KEY=gsk_votre-cle-groq
GOOGLE_GENERATIVE_AI_API_KEY=AIza_votre-cle-google
OPENROUTER_API_KEY=sk-or_votre-cle-openrouter
NEXT_PUBLIC_APP_URL=https://bloodlink.ma
```

**`admin_web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

5. Appliquer les migrations : SQL Editor → copier-coller `mobile_app/supabase/migrations/001_*.sql` à `007_*.sql`

### 3. Lancer les projets

```bash
# Terminal 1 — Mobile (port 8081)
cd mobile_app && npx expo start

# Terminal 2 — Centre Web (port 3000)
cd center_web && npm run dev

# Terminal 3 — Admin Web (port 3001)
cd admin_web && npm run dev
```

## Commandes de développement

| Commande | Description |
|----------|-------------|
| `cd mobile_app && npx expo start` | Lancer l'app mobile |
| `cd center_web && npm run dev` | Lancer le centre web |
| `cd admin_web && npm run dev` | Lancer l'admin web |
| `cd center_web && npm run build` | Build production centre |
| `cd admin_web && npm run build` | Build production admin |
| `npx supabase db push` | Appliquer les migrations |
| `npx supabase db reset` | Réinitialiser la base locale |
| `eas build --platform android` | Build APK (EAS) |

## Documentation

- [`docs/CAHIER_DES_CHARGES_V2.md`](./docs/CAHIER_DES_CHARGES_V2.md) — Cahier des charges complet
- [`docs/ARCHITECTURE_TECHNIQUE.md`](./docs/ARCHITECTURE_TECHNIQUE.md) — Architecture technique détaillée
- [`docs/GUIDE_INSTALLATION.md`](./docs/GUIDE_INSTALLATION.md) — Guide d'installation pas à pas
- [`docs/GUIDE_BONNES_PRATIQUES.md`](./docs/GUIDE_BONNES_PRATIQUES.md) — Règles de collaboration, Git, conventions

## Pourquoi cette stack ?

- **Un seul langage** (TypeScript) = même codebase, moins de context-switch
- **Supabase** gère auth, BDD, stockage, temps réel et Edge Functions
- **Expo SDK 54** simplifie le mobile (hot reload, OTA, EAS build)
- **NativeWind** apporte Tailwind CSS dans React Native
- **shadcn/ui** fournit 53 composants accessibles et personnalisables
- **Vercel AI SDK** permet le streaming SSE et tool calling avec fallback multi-provider
- **Groq** offre 14400 req/jour gratuites pour SangBot
- **next-intl** gère l'internationalisation sans friction
- **Next.js** offre SSR, API routes et déploiement facile sur Vercel
