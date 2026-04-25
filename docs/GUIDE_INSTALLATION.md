# Guide d'Installation — BloodLink

Ce guide explique comment installer et configurer l'environnement de développement pour le projet BloodLink.

---

## 1. Prérequis

Tu dois avoir installé sur ta machine :

| Outil | Version minimale | Vérification |
|-------|-----------------|-------------|
| Node.js | 20.x | `node --version` |
| npm | 10.x | `npm --version` |
| Git | 2.x | `git --version` |

Si un outil est manquant :

- **Node.js** : télécharge sur [nodejs.org](https://nodejs.org) (prendre la version LTS)
- **Git** : télécharge sur [git-scm.com](https://git-scm.com)

---

## 2. Outils du projet

### 2.1. TypeScript

TypeScript est le **langage** utilisé dans tout le projet. C'est du JavaScript avec des types.

- Pas besoin d'installation globale : il est déjà inclus dans les dépendances de chaque projet (`mobile/` et `admin_web/`)
- Le compilateur vérifie les types à chaque build

### 2.2. React Native (via Expo)

**React Native** permet de créer des apps mobiles avec du code web (React).

**Expo** est une surcouche qui simplifie React Native :
- Pas besoin d'Android Studio ou Xcode pour tester
- Hot reload instantané
- Mises à jour "Over The Air" (OTA)
- Build dans le cloud avec EAS

Pour lancer l'app mobile :
```bash
cd mobile
npx expo start
```

Ça ouvre un QR code. Tu scannes avec l'app **Expo Go** sur ton téléphone.

### 2.3. Next.js

**Next.js** est un framework React pour le web.

- App Router (routage par dossiers)
- Rendu côté serveur (SSR)
- API routes intégrées
- Déploiement facile sur Vercel

Pour lancer l'admin web :
```bash
cd admin_web
npm run dev
```

L'app est accessible sur http://localhost:3000

### 2.4. Supabase

**Supabase** remplace tout un backend traditionnel.

| Fonction | Ce que Supabase fournit |
|----------|------------------------|
| Base de données | PostgreSQL managé avec dashboard |
| Authentification | Register, login, OAuth, magic link, JWT |
| API | REST et GraphQL auto-générés |
| Stockage fichiers | Upload images, PDF... |
| Temps réel | WebSockets pour notifications |
| Edge Functions | Petites fonctions serveur |

### 2.5. Tailwind CSS

**Tailwind** est un framework CSS "utility-first".

Tu écris des classes utilitaires directement dans le HTML :

```tsx
<div className="bg-red-500 text-white p-4 rounded-lg">
  Urgence sang
</div>
```

Au lieu d'écrire du CSS traditionnel :

```css
.alert {
  background-color: red;
  color: white;
  padding: 16px;
  border-radius: 8px;
}
```

### 2.6. Zustand

**Zustand** gère l'état global de l'application (login, données utilisateur...).

C'est une alternative plus simple à Redux :

```typescript
const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### 2.7. React Query (TanStack Query)

**React Query** gère les requêtes API (cache, retry, synchronisation).

```typescript
const { data: centers, isLoading } = useQuery({
  queryKey: ["centers"],
  queryFn: fetchCenters,
});
```

---

## 3. Installation complète du projet

### 3.1. Cloner le repo

```bash
git clone https://github.com/senmos26/bloodlink.git
cd bloodlink/bloodlink
```

### 3.2. Installer les dépendances mobile

```bash
cd mobile
npm install
```

### 3.3. Installer les dépendances admin web

```bash
cd ../admin_web
npm install
```

### 3.4. Installer Supabase CLI (optionnel mais recommandé)

Le CLI Supabase te permet de gérer les migrations localement.

```bash
npm install supabase --save-dev
```

---

## 4. Configuration Supabase

### 4.1. Créer un projet

1. Va sur [supabase.com](https://supabase.com)
2. Crée un compte (gratuit)
3. Clique **"New Project"**
4. Nomme-le `bloodlink`
5. Attends que le projet soit prêt (2-3 minutes)

### 4.2. Récupérer les clés

1. Dans ton projet Supabase, va dans **Settings** → **API**
2. Copie :
   - `Project URL`
   - `anon public` (clé publique)

### 4.3. Créer les fichiers d'environnement

**Mobile** : `mobile/.env.local`
```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**Admin Web** : `admin_web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

**Important** : `.env.local` est dans `.gitignore`. Ces clés ne seront **jamais** poussées sur GitHub.

### 4.4. Appliquer les migrations SQL

1. Dans le dashboard Supabase, va dans **SQL Editor**
2. Copie-colle le contenu de `supabase/migrations/00001_initial.sql`
3. Clique **Run**

Ou avec le CLI :
```bash
npx supabase login
npx supabase link --project-ref votre-project-ref
npx supabase db push
```

---

## 5. Lancer les projets

### 5.1. Lancer l'app mobile

```bash
cd mobile
npx expo start
```

- Scanne le QR code avec l'app **Expo Go** (Android) ou l'appareil photo (iOS)
- Ou appuie `a` pour lancer sur l'émulateur Android
- Ou appuie `w` pour lancer sur le navigateur web

### 5.2. Lancer l'admin web

```bash
cd admin_web
npm run dev
```

- Ouvre http://localhost:3000 dans le navigateur

---

## 6. Commandes utiles

### Mobile

| Commande | Description |
|----------|-------------|
| `npx expo start` | Démarrer le serveur Expo |
| `npx expo start --android` | Lancer sur Android |
| `npx expo start --web` | Lancer sur navigateur |
| `npx expo build:android` | Build APK (besoin de EAS) |

### Admin Web

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm run build` | Build pour production |
| `npm run start` | Lancer le build de production |
| `npm run lint` | Vérifier ESLint |

### Supabase

| Commande | Description |
|----------|-------------|
| `npx supabase db reset` | Réinitialiser la base locale |
| `npx supabase migration new nom_migration` | Créer une migration |
| `npx supabase db push` | Pousser les migrations |
| `npx supabase gen types typescript --project-id xxx` | Générer les types TypeScript |

### Git

| Commande | Description |
|----------|-------------|
| `git checkout -b feature/nom` | Créer une branche feature |
| `git add . && git commit -m "feat: ..."` | Commiter |
| `git push origin feature/nom` | Pousser la branche |
| `git checkout dev && git pull origin dev` | Mettre à jour dev |

---

## 7. Structure du code expliquée

### Mobile — `mobile/src/`

- **`app/`** : Les écrans de l'application. Expo Router se base sur la structure des fichiers.
  - `index.tsx` = écran d'accueil
  - `(auth)/` = groupe d'écrans d'authentification
  - `(tabs)/` = groupe d'écrans en onglets
  - `_layout.tsx` = layout partagé (header, navigation...)

- **`components/`** : Composants réutilisables
  - `ui/` : Boutons, inputs, cartes (atomiques)
  - `forms/` : Composants de formulaire

- **`services/`** : Clients API
  - `supabase.ts` : Configuration du client Supabase

- **`stores/`** : État global avec Zustand
  - `authStore.ts` : État de l'authentification
  - `donationStore.ts` : État des dons

- **`types/`** : Interfaces TypeScript partagées
  - `user.ts`, `donation.ts`, `center.ts`...

- **`utils/`** : Fonctions utilitaires
  - `formatDate.ts` : Formatage de dates
  - `geolocation.ts` : Calcul de distances

### Admin Web — `admin_web/src/`

- **`app/`** : Pages Next.js (App Router)
  - `layout.tsx` : Layout racine (providers, fonts)
  - `(auth)/login/page.tsx` : Page de connexion
  - `(dashboard)/page.tsx` : Tableau de bord
  - `(dashboard)/users/page.tsx` : Liste des utilisateurs

- **`components/ui/`** : Composants réutilisables
  - `Button.tsx`, `Table.tsx`, `Modal.tsx`...

- **`lib/supabase.ts`** : Client Supabase configuré

- **`hooks/`** : Custom hooks
  - `useAuth.ts` : Hook d'authentification
  - `useCenters.ts` : Hook de récupération des centres

### Supabase — `supabase/`

- **`migrations/`** : Scripts SQL versionnés
  - `00001_initial.sql` : Création des tables de base
  - `00002_add_profiles.sql` : Ajout de la table profiles
  - Les migrations s'appliquent **dans l'ordre**

- **`seed.sql`** : Données de test
  - Centres de transfusion fictifs
  - Utilisateurs de test

- **`functions/`** : Edge Functions
  - Petites fonctions serveur en TypeScript
  - Exécutées sur les serveurs Supabase

---

## 8. Dépannage

### Erreur : "Cannot find module"

```bash
npm install
```

Les dépendances ne sont pas installées. Lance `npm install` dans le dossier concerné.

### Erreur : "Failed to connect to Supabase"

Vérifie que les variables d'environnement sont bien configurées :
- Fichier `.env.local` présent dans `mobile/` ou `admin_web/`
- Les clés correspondent bien à ton projet Supabase

### Erreur : "Port 3000 already in use"

```bash
# Trouver le processus qui utilise le port 3000
npx kill-port 3000

# Ou lancer sur un autre port
npm run dev -- --port 3001
```

### Erreur : "Metro bundler" sur mobile

```bash
cd mobile
npx expo start --clear
```

Le flag `--clear` vide le cache du bundler.

---

## 9. Ressources d'apprentissage

| Sujet | Ressource |
|-------|-----------|
| TypeScript | [typescriptlang.org/docs](https://www.typescriptlang.org/docs/) |
| React Native | [reactnative.dev](https://reactnative.dev/) |
| Expo | [docs.expo.dev](https://docs.expo.dev/) |
| Next.js | [nextjs.org/docs](https://nextjs.org/docs) |
| Supabase | [supabase.com/docs](https://supabase.com/docs) |
| Tailwind CSS | [tailwindcss.com/docs](https://tailwindcss.com/docs) |
| Zustand | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) |
| React Query | [tanstack.com/query](https://tanstack.com/query) |

---

*Ce guide est maintenu à jour. Si tu bloques, demande de l'aide dans l'équipe avant de perdre du temps.*
