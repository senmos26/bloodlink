# Guide d'Installation — BloodLink

Ce guide explique comment installer et configurer l'environnement de développement pour le projet BloodLink.

---

## 1. Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|-------------|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Git | 2.x | `git --version` |
| Expo CLI | — | `npx expo --version` |

Si un outil est manquant :

- **Node.js** : télécharge sur [nodejs.org](https://nodejs.org) (prendre la version LTS)
- **Git** : télécharge sur [git-scm.com](https://git-scm.com)

---

## 2. Architecture du projet

BloodLink est composé de **3 applications** + un backend Supabase :

| Application | Dossier | Port | Stack | Rôle |
|-------------|---------|------|-------|------|
| **Mobile App** | `mobile_app/` | 8081 | React Native + Expo SDK 54 + NativeWind | App donneur |
| **Centre Web** | `center_web/` | 3000 | Next.js 15.4 + Tailwind 4 + shadcn/ui | Dashboard centre + IA SangBot |
| **Admin Web** | `admin_web/` | 3001 | Next.js 16.2 + Tailwind 4 + shadcn/ui | Dashboard super admin |
| **Backend** | Supabase Cloud | — | PostgreSQL + Auth + RLS + Edge Functions | Données, auth, logique métier |

---

## 3. Outils du projet

### 3.1. TypeScript

TypeScript est le **langage** utilisé dans tout le projet. Pas besoin d'installation globale : inclus dans les dépendances de chaque projet.

### 3.2. React Native + Expo SDK 54

**React Native** permet de créer des apps mobiles avec du code web (React).

**Expo** est une surcouche qui simplifie React Native :
- Pas besoin d'Android Studio ou Xcode pour tester
- Hot reload instantané
- Build dans le cloud avec EAS

**NativeWind** apporte Tailwind CSS dans React Native.

### 3.3. Next.js (Centre + Admin)

**Next.js** est un framework React pour le web avec :
- App Router (routage par dossiers)
- Rendu côté serveur (SSR)
- API routes intégrées (utilisé pour `/api/chat` SSE)
- Déploiement facile sur Vercel

### 3.4. Supabase

| Fonction | Ce que Supabase fournit |
|----------|------------------------|
| Base de données | PostgreSQL managé + pgvector + PostGIS |
| Authentification | Register, login, JWT, reset password |
| API | REST auto-généré + RPC |
| Stockage fichiers | Upload images, avatars |
| Temps réel | WebSockets pour notifications |
| Edge Functions | Fonctions serveur Deno |

### 3.5. shadcn/ui

Composants UI basés sur Radix UI + Tailwind. 53 composants dans `center_web/`, utilisés aussi dans `admin_web/`.

### 3.6. IA Chat — SangBot 🆕

Assistant conversationnel intégré dans l'app mobile, utilisant :
- **Vercel AI SDK v6** : streaming SSE, tool calling
- **Groq** (Llama 3.3 70B) : provider principal (14400 req/jour gratuit)
- **Google Gemini 2.0 Flash** : fallback
- **OpenRouter** : fallback ultime
- **RAG** : Google text-embedding-004 + Supabase pgvector

### 3.7. Autres outils

| Outil | Usage |
|-------|-------|
| Zustand | État global mobile |
| React Query | Data fetching + cache |
| next-intl | i18n (fr/en/de/es) dans center_web |
| Framer Motion + GSAP | Animations UI |
| jspdf + @react-pdf/renderer | Export PDF |
| react-native-qrcode-svg + jsQR | QR code génération + scan |
| expo-notifications | Push notifications FCM |
| Leaflet + react-leaflet | Cartes admin |
| react-native-maps | Cartes mobile |

---

## 4. Installation complète

### 4.1. Cloner le repo

```bash
git clone https://github.com/senmos26/bloodlink.git
cd Boold_link
```

### 4.2. Installer les dépendances — Mobile

```bash
cd mobile_app
npm install
```

### 4.3. Installer les dépendances — Centre Web

```bash
cd ../center_web
npm install
```

### 4.4. Installer les dépendances — Admin Web

```bash
cd ../admin_web
npm install
```

---

## 5. Configuration Supabase

### 5.1. Créer un projet

1. Va sur [supabase.com](https://supabase.com)
2. Crée un compte (gratuit)
3. Clique **"New Project"**
4. Nomme-le `bloodlink`
5. Attends que le projet soit prêt (2-3 minutes)

### 5.2. Récupérer les clés

Dans **Settings** → **API**, copie :
- `Project URL`
- `anon public` (clé publique)
- `service_role` (clé secrète, server-side uniquement)

### 5.3. Activer les extensions

Dans **Database** → **Extensions**, active :
- `postgis` (géolocalisation)
- `vector` (pgvector, pour RAG embeddings)

### 5.4. Créer les fichiers d'environnement

**Mobile** : `mobile_app/.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**Centre Web** : `center_web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
GROQ_API_KEY=gsk_votre-cle-groq
GOOGLE_GENERATIVE_AI_API_KEY=AIza_votre-cle-google
OPENROUTER_API_KEY=sk-or_votre-cle-openrouter
NEXT_PUBLIC_APP_URL=https://bloodlink.ma
```

**Admin Web** : `admin_web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

**Important** : `.env.local` et `.env` sont dans `.gitignore`. Ces clés ne seront **jamais** poussées sur GitHub.

### 5.5. Appliquer les migrations SQL

Les migrations sont situées dans le dossier racine `supabase/migrations/` :

| # | Fichier | Description |
|---|---------|-------------|
| 00001 | `00001_initial.sql` | Schéma de base complet (tables profiles, centers, appointments, donations, alerts, notifications) et politiques RLS de départ |
| 00002 | `00002_rabat_centers.sql` | Insertion de centres de transfusion factices pour le secteur de Rabat |
| 00003 | `00003_rabat_real_centers.sql` | Insertion de vrais centres de transfusion opérationnels à Rabat |
| 00004 | `00004_push_notification_support.sql` | Ajout du champ token de notification (FCM) sur les profils et de la table des tokens |
| 00005 | `00005_fix_trigger_blood_type.sql` | Correction du trigger sur le type sanguin à l'inscription |
| 00006 | `00006_chat_conversations.sql` | Table des conversations et messages pour l'historique du chatbot IA SangBot |
| 00006_fix | `00006_fix_trigger_role_overwrite.sql` | Correction critique du trigger d'inscription pour éviter l'écrasement involontaire des rôles admin/donneur |
| 00007 | `00007_alerts_push_automation.sql` | Automatisation complète des notifications push et in-app lors de la création d'alertes via déclencheur PostgreSQL |

**Via Dashboard** : SQL Editor → copier-coller chaque migration dans l'ordre chronologique → Run

**Via CLI** :
```bash
npx supabase login
npx supabase link --project-ref votre-project-ref
npx supabase db push
```

### 5.6. Clés IA (optionnel, pour SangBot)

| Provider | Comment obtenir | Variable |
|----------|----------------|----------|
| **Groq** | [console.groq.com](https://console.groq.com) → Keys | `GROQ_API_KEY` |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com) → API Key | `GOOGLE_GENERATIVE_AI_API_KEY` |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) → Keys | `OPENROUTER_API_KEY` |

Sans ces clés, le chat IA ne fonctionnera pas mais le reste de l'app fonctionne normalement.

---

## 6. Lancer les projets

### 6.1. Lancer l'app mobile

```bash
cd mobile_app
npx expo start
```

- Scanne le QR code avec l'app **Expo Go** (Android) ou l'appareil photo (iOS)
- Ou appuie `a` pour lancer sur l'émulateur Android
- Ou appuie `w` pour lancer sur le navigateur web
- Accessible sur `http://localhost:8081`

### 6.2. Lancer le Centre Web

```bash
cd center_web
npm run dev
```

- Ouvre http://localhost:3000 dans le navigateur
- L'API chat SSE est sur http://localhost:3000/api/chat

### 6.3. Lancer l'Admin Web

```bash
cd admin_web
npm run dev
```

- Ouvre http://localhost:3001 dans le navigateur

### 6.4. Lancer les 3 en parallèle

```bash
# Terminal 1 — Mobile
cd mobile_app && npx expo start

# Terminal 2 — Centre Web
cd center_web && npm run dev

# Terminal 3 — Admin Web
cd admin_web && npm run dev
```

---

## 7. Commandes utiles

### Mobile

| Commande | Description |
|----------|-------------|
| `npx expo start` | Démarrer le serveur Expo |
| `npx expo start --clear` | Démarrer en vidant le cache |
| `npx expo start --android` | Lancer sur Android |
| `npx expo start --web` | Lancer sur navigateur |
| `eas build --platform android` | Build APK (EAS) |

### Centre Web

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement (port 3000) |
| `npm run dev:frontend` | Next.js uniquement |
| `npm run build` | Build pour production |
| `npm run lint` | Vérifier ESLint |
| `npm run test:unit` | Tests unitaires (Vitest) |
| `npm run test` | Tests E2E (Playwright) |

### Admin Web

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement (port 3001) |
| `npm run build` | Build pour production |
| `npm run lint` | Vérifier ESLint |

### Supabase

| Commande | Description |
|----------|-------------|
| `npx supabase login` | Se connecter |
| `npx supabase link --project-ref xxx` | Lier le projet |
| `npx supabase db push` | Pousser les migrations |
| `npx supabase db reset` | Réinitialiser la base locale |
| `npx supabase migration new nom` | Créer une migration |
| `npx supabase functions deploy nom` | Déployer une Edge Function |

### Git

| Commande | Description |
|----------|-------------|
| `git checkout -b feature/nom` | Créer une branche feature |
| `git add . && git commit -m "feat: ..."` | Commiter |
| `git push origin feature/nom` | Pousser la branche |

---

## 8. Structure du code expliquée

### Mobile — `mobile_app/`

- **`app/`** : Écrans Expo Router
  - `(auth)/` : login, register, verify-otp
  - `(tabs)/` : index (home), appointments, profile, map
  - `alerts.tsx`, `appointment.tsx`, `booking.tsx`, `notifications.tsx`, `share-alert.tsx`, `share-analytics.tsx`
  - `_layout.tsx` : layout racine
- **`components/`** : Composants réutilisables
  - `ai/` : ChatDrawer, ChatInput, ChatMessage, ChatWidget, useChat
  - `ui/` : Composants atomiques
  - `profile/` : Composants profil
  - `screens/` : Écrans composites
- **`services/`** : Clients API
  - `supabase.ts`, `alerts.ts`, `appointments.ts`, `dashboard.ts`, `map.ts`, `notifications.ts`, `profile.ts`, `push.native.ts`, `alert-sharing.ts`
- **`hooks/`** : Custom hooks
- **`supabase/migrations/`** (à la racine) : 8 migrations SQL

### Centre Web — `center_web/src/`

- **`app/`** : Pages Next.js (App Router avec i18n)
  - `[locale]/(auth)/` : login, forgot-password, new-password
  - `[locale]/(dashboard)/` : page, alerts, appointments, donations, donors, settings
  - `[locale]/terms/` : page conditions
  - `api/chat/` : SSE streaming SangBot
  - `api/auth/` : callbacks Supabase
- **`components/ui/`** : 53 composants shadcn/ui
- **`features/`** : Modules métier
  - `ai/` : models, prompts, rag, tools, types
  - `alerts/`, `appointments/`, `auth/`, `center-dashboard/`, `center-settings/`, `dashboard/`, `donations/`, `donors/`, `notifications/`
- **`entities/`** : alert, appointment, center, donation, donor
- **`shared/`** : i18n (fr/en/de/es), supabase, auth, utils, types

### Admin Web — `admin_web/src/`

- **`app/`** : Pages Next.js
  - `admin/` : dashboard, centers, donors, appointments, appointments-full, donations, alerts, profiles, notifications, scan-qr, statistics, settings
  - `login/`, `register/`, `reset-password/`
- **`components/`** : Composants UI shadcn
- **`features/`** : alerts, appointments, auth, centers, dashboard, donations, notifications, profiles, settings
- **`lib/`** : supabase, utils

---

## 9. Dépannage

### Erreur : "Cannot find module"

```bash
npm install
```

Les dépendances ne sont pas installées. Lance `npm install` dans le dossier concerné.

### Erreur : "Failed to connect to Supabase"

Vérifie que les variables d'environnement sont bien configurées :
- Fichier `.env` présent dans `mobile_app/`
- Fichier `.env.local` présent dans `center_web/` et `admin_web/`
- Les clés correspondent bien à ton projet Supabase

### Erreur : "Port 3000 already in use"

```bash
npx kill-port 3000
# Ou lancer sur un autre port
npm run dev -- --port 3002
```

### Erreur : "Metro bundler" sur mobile

```bash
cd mobile_app
npx expo start --clear
```

### Erreur : Chat IA ne répond pas

Vérifie :
1. `GROQ_API_KEY` (ou `GOOGLE_GENERATIVE_AI_API_KEY`) dans `center_web/.env.local`
2. Le serveur centre_web est lancé sur le port 3000
3. Le mobile envoie bien le `accessToken` JWT dans la requête

### Erreur : RAG ne fonctionne pas

Le RAG nécessite `GOOGLE_GENERATIVE_AI_API_KEY` pour les embeddings. Sans cette clé, le RAG est désactivé silencieusement et le chat fonctionne sans contexte de connaissances.

---

## 10. Ressources d'apprentissage

| Sujet | Ressource |
|-------|-----------|
| TypeScript | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) |
| React Native | [reactnative.dev](https://reactnative.dev/) |
| Expo SDK 54 | [docs.expo.dev](https://docs.expo.dev/) |
| NativeWind | [www.nativewind.dev](https://www.nativewind.dev/) |
| Next.js 15 | [nextjs.org/docs](https://nextjs.org/docs) |
| Supabase | [supabase.com/docs](https://supabase.com/docs) |
| Tailwind CSS 4 | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com/) |
| Zustand | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) |
| React Query | [tanstack.com/query](https://tanstack.com/query) |
| Vercel AI SDK | [sdk.vercel.ai](https://sdk.vercel.ai/) |
| Groq | [console.groq.com](https://console.groq.com/) |
| next-intl | [next-intl.dev](https://next-intl.dev/) |

---

*Dernière mise à jour : 2026-05-12*
