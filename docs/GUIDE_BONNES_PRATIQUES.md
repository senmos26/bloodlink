# Guide des Bonnes Pratiques — BloodLink

Ce document définit les règles de collaboration, les conventions de code et l'organisation du travail pour l'équipe BloodLink.

---

## 1. Organisation du projet

### Structure des dossiers

Chaque projet suit une architecture **feature-first** : le code est organisé par fonctionnalité, pas par type de fichier.

#### Mobile (`mobile/src/`)

```
src/
├── app/              # Écrans / navigation par feature
│   ├── (auth)/       # Groupe d'écrans authentification
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/       # Groupe onglets principaux
│   │   ├── index.tsx      # Accueil
│   │   ├── map.tsx        # Carte des centres
│   │   ├── donations.tsx  # Historique dons
│   │   └── profile.tsx    # Profil utilisateur
│   └── _layout.tsx   # Layout racine
│
├── components/       # Composants réutilisables
│   ├── ui/           # Boutons, inputs, cartes, badges...
│   └── forms/        # Composants de formulaire
│
├── hooks/            # Custom React hooks
├── services/         # Clients API / Supabase
├── stores/           # État global (Zustand)
├── types/            # Interfaces TypeScript
├── constants/        # Valeurs fixes (couleurs, URLs...)
└── utils/            # Fonctions utilitaires
```

#### Admin Web (`admin_web/src/`)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentification
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/       # Pages protégées
│   │   ├── layout.tsx     # Sidebar + Header
│   │   ├── page.tsx       # Tableau de bord
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── centers/
│   │   │   └── page.tsx
│   │   └── donations/
│   │       └── page.tsx
│   └── layout.tsx         # Root layout
│
├── components/
│   ├── ui/                # Boutons, tables, modales...
│   └── charts/            # Graphiques Recharts
│
├── hooks/                 # Custom hooks
├── lib/                   # Utils + Supabase client
├── types/                 # Interfaces TypeScript
└── styles/                # Styles globaux si besoin
```

#### Supabase (`supabase/`)

```
supabase/
├── migrations/
│   ├── 00001_initial.sql
│   ├── 00002_add_profiles.sql
│   └── 00003_add_centers.sql
├── seed.sql               # Données de test
└── functions/             # Edge Functions
    └── hello-world/
        └── index.ts
```

**Règle d'or** : quand tu ajoutes une feature (ex: "Alertes"), tu crées un dossier **dans la feature concernée**, pas un dossier générique `alerts/` à la racine.

---

## 2. Git — Workflow de l'équipe

### Branches

| Branche | Rôle |
|---------|------|
| `main` | Production — protégée |
| `dev` | Intégration quotidienne — tous les merges ici |
| `feature/nom-feature` | Une branche par feature |
| `fix/nom-bug` | Une branche par correction |

### Workflow jour après jour

```bash
# 1. S'assurer d'être à jour
git checkout dev
git pull origin dev

# 2. Créer sa branche feature
git checkout -b feature/alertes-push

# 3. Développer, committer souvent
git add .
git commit -m "feat(alerts): ajoute écran liste des alertes"

# 4. Pousser la branche
git push origin feature/alertes-push

# 5. Ouvrir une Pull Request vers dev sur GitHub
# 6. Un autre membre review et merge
```

### Conventions de commit (Conventional Commits)

Format : `<type>(<scope>): <description>`

| Type | Quand l'utiliser |
|------|------------------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `style` | Formatage, pas de changement de logique |
| `refactor` | Refactoring de code |
| `test` | Tests |
| `chore` | Tâches de maintenance |

Exemples :

```
feat(donations): ajoute formulaire de prise de rendez-vous
fix(auth): corrige redirection après login
docs(readme): met à jour les instructions d'installation
style(mobile): applique prettier sur src/app
```

---

## 3. Conventions de code

### TypeScript — Règles strictes

- **Toujours** typer les props, les retours de fonction, les états
- **Jamais** de `any` implicite. Si tu dois utiliser `any`, commente pourquoi
- Utiliser `interface` pour les objets, `type` pour les unions

```typescript
// ✅ BON
interface User {
  id: string;
  email: string;
  full_name: string;
  blood_type: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ ÉVITER
function getUser(id) {
  // ...
}
```

### Nommage

| Élément | Convention | Exemple |
|---------|----------|---------|
| Fichiers composants | PascalCase | `DonationCard.tsx` |
| Fichiers hooks | camelCase, préfixe `use` | `useAuth.ts` |
| Fichiers utils | camelCase | `formatDate.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_URL` |
| Variables | camelCase | `currentUser` |
| Interfaces | PascalCase, suffixe optionnel | `User`, `UserProps` |
| Classes CSS (Tailwind) | kebab-case | `bg-red-500` |

### Composants React

- Fonctionnels uniquement (pas de classes)
- Props destructurées dans les paramètres
- Export nommé par défaut

```typescript
// ✅ BON
interface DonationCardProps {
  donation: Donation;
  onPress: () => void;
}

export function DonationCard({ donation, onPress }: DonationCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Text>{donation.center_name}</Text>
      <Text>{formatDate(donation.date)}</Text>
    </Pressable>
  );
}

// ❌ ÉVITER
export default class DonationCard extends React.Component {
  render() {
    return <Text>...</Text>;
  }
}
```

### Imports — Ordre recommandé

```typescript
// 1. React / Framework
import { useState } from "react";
import { View, Text } from "react-native";

// 2. Librairies tierces
import { useQuery } from "@tanstack/react-query";

// 3. Services / API
import { supabase } from "@/services/supabase";

// 4. Hooks
import { useAuth } from "@/hooks/useAuth";

// 5. Composants
import { Button } from "@/components/ui/Button";

// 6. Utils / Types
import { formatDate } from "@/utils/formatDate";
import type { Donation } from "@/types";
```

---

## 4. Supabase — Règles de la base

### Migrations SQL

- **Numérotation séquentielle** : `00001_`, `00002_`, etc.
- Chaque migration doit être **idempotente** (peut tourner plusieurs fois sans casser)
- Toujours tester `npx supabase db reset` après une migration

```sql
-- 00002_add_profiles.sql
-- Créer la table profiles liée à auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  blood_type text CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  created_at timestamptz DEFAULT now()
);

-- Politique RLS : un utilisateur ne voit que son profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Row Level Security (RLS)

**TOUJOURS** activer RLS sur les tables publiques. Sans RLS, n'importe qui peut lire/écrire dans la base.

```sql
ALTER TABLE ma_table ENABLE ROW LEVEL SECURITY;
```

---

## 5. Revue de code (Pull Requests)

### Avant de demander une review

- [ ] Les tests passent (`npm test`, `flutter test`...)
- [ ] Le linter est propre (`eslint`, `prettier --check`)
- [ ] Tu as testé manuellement la feature
- [ ] La PR a une description claire : **quoi**, **pourquoi**, **comment tester**

### Template de description PR

```markdown
## Quoi
Ajoute l'écran de carte des centres de transfusion.

## Pourquoi
L'utilisateur doit pouvoir visualiser les centres proches de sa position.

## Comment tester
1. Lancer l'app mobile
2. Aller dans l'onglet "Carte"
3. Vérifier que les centres s'affichent avec des marqueurs
4. Cliquer sur un marqueur → affiche la fiche du centre

## Screenshots
[screenshot ici]
```

---

## 6. Déploiement

| Projet | Plateforme | Commande |
|--------|----------|----------|
| Mobile | Expo EAS | `eas build --platform android` |
| Admin Web | Vercel | Push sur `main` → auto-deploy |
| Supabase | Supabase Cloud | `npx supabase db push` |

**Règle** : on ne merge sur `main` que ce qui a été testé sur `dev`.

---

## 7. Outils recommandés dans l'éditeur

- **ESLint** + **Prettier** — formatage et linting auto
- **TypeScript strict** — attrape les erreurs avant l'exécution
- **GitLens** (VS Code) — voir l'auteur et l'historique
- **Thunder Client / Postman** — tester les API Supabase

---

## 8. Checklist quotidienne

Avant de commencer à coder :

- [ ] `git checkout dev && git pull origin dev`
- [ ] Créer une branche feature propre
- [ ] Lire les PR ouvertes pour ne pas faire doublon

Avant de committer :

- [ ] Le code compile sans erreur TypeScript
- [ ] Pas de `console.log` oubliés
- [ ] Les imports sont ordonnés
- [ ] Le message de commit suit la convention

Avant de merger une PR :

- [ ] Review par au moins 1 autre membre
- [ ] Tous les checks CI passent
- [ ] Le code a été testé manuellement

---

*Ce guide évolue avec le projet. Propose des modifications via une PR sur `docs/GUIDE_BONNES_PRATIQUES.md`.*
