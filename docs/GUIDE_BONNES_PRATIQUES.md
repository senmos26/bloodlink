# Guide des bonnes pratiques — Projet BloodLink

> Ce document est la **référence commune de l'équipe BloodLink**.
> Il décrit comment **structurer les projets**, **gérer Git**, **nommer les branches**, **écrire les commits** et **collaborer proprement**.
>
> Tout le monde doit lire et respecter ce guide. Toute évolution passe par une PR sur ce fichier.

---

## 0. Sommaire

1. Principes généraux
2. Organisation globale du dépôt (monorepo)
3. Structure du backend FastAPI
4. Structure du projet mobile Flutter
5. Structure du projet admin web Flutter
6. Variables d'environnement et configuration
7. Stratégie Git (branches)
8. Conventions de nommage des branches
9. Conventions de commits (Conventional Commits)
10. Pull Requests et revues de code
11. Qualité de code (lint, format, tests)
12. Documentation projet
13. Checklist d'initialisation
14. Règles de collaboration de l'équipe

---

## 1. Principes généraux

- **Simplicité d'abord** : on choisit une organisation claire plutôt qu'une organisation "parfaite mais illisible".
- **Cohérence** : tout le monde suit exactement les mêmes règles, même si certaines sont discutables.
- **Petits changements** : chaque branche et chaque PR doivent rester **courtes** et **concentrées sur une chose**.
- **Revue obligatoire** : aucun code ne part sur `main` sans avoir été relu par au moins une autre personne.
- **Documentation au fur et à mesure** : quand on ajoute une fonctionnalité, on ajoute aussi sa doc (README, commentaires, `docs/`).
- **Pas de secrets dans Git** : jamais de mot de passe, de clé API ou de `.env` poussés.

---

## 2. Organisation globale du dépôt (monorepo)

Nous travaillons en **monorepo** : **un seul dépôt GitHub** qui contient **tous les projets** BloodLink.

### 2.1. Arborescence recommandée

```
bloodlink/
├─ backend/           # API FastAPI (Python)
├─ mobile/            # Application mobile Flutter (donneur + centre)
├─ admin_web/         # Interface d'administration (Flutter Web)
├─ docs/              # Documentation : cahier des charges, guides, schémas
├─ scripts/           # Scripts utilitaires (seed DB, exports, etc.)
├─ .gitignore
├─ README.md
└─ LICENSE
```

### 2.2. Pourquoi ce choix

- **Un seul historique Git** pour tout le produit
- **Plus simple à cloner et à partager** avec les nouveaux arrivants
- **Revue de code transverse** (front + back dans la même PR quand c'est logique)
- **Moins de risques de désynchronisation** entre backend et apps

### 2.3. Règles globales

- Chaque sous-projet (`backend/`, `mobile/`, `admin_web/`) a **son propre `README.md`** avec ses commandes de lancement.
- Le `README.md` racine explique **comment lancer l'ensemble** et renvoie vers les READMEs enfants.
- Toute la documentation **projet** (pas propre au code) va dans `docs/`.

---

## 3. Structure du backend FastAPI

> Inspiré des **FastAPI best practices** (feature-based / modular monolith).

### 3.1. Arborescence recommandée

```
backend/
├─ app/
│  ├─ main.py                 # Point d'entrée FastAPI
│  ├─ core/                   # Config, sécurité, dépendances globales
│  │  ├─ config.py            # Chargement des variables d'environnement
│  │  ├─ security.py          # Hash, JWT, vérifications
│  │  └─ database.py          # Session SQLAlchemy, engine
│  ├─ models/                 # Modèles ORM (SQLAlchemy)
│  │  ├─ __init__.py
│  │  ├─ user.py
│  │  ├─ donor.py
│  │  ├─ center.py
│  │  ├─ alert.py
│  │  ├─ appointment.py
│  │  └─ donation.py
│  ├─ schemas/                # Schémas Pydantic (request / response)
│  │  ├─ auth.py
│  │  ├─ donor.py
│  │  ├─ center.py
│  │  └─ ...
│  ├─ routes/                 # Endpoints HTTP (APIRouter par domaine)
│  │  ├─ auth.py
│  │  ├─ donors.py
│  │  ├─ centers.py
│  │  ├─ alerts.py
│  │  ├─ appointments.py
│  │  ├─ donations.py
│  │  └─ admin.py
│  ├─ services/               # Logique métier (pas de SQL brut ni de HTTP)
│  │  ├─ auth_service.py
│  │  ├─ matching_service.py
│  │  ├─ notification_service.py
│  │  └─ ...
│  ├─ domain/                 # Règles métier pures (RM01..RM12)
│  │  └─ rules.py
│  └─ utils/                  # Petites fonctions utilitaires
├─ alembic/                   # Migrations de base de données
│  ├─ versions/
│  └─ env.py
├─ tests/
│  ├─ test_auth.py
│  ├─ test_donors.py
│  └─ ...
├─ .env.example
├─ pyproject.toml             # (ou requirements.txt)
├─ alembic.ini
└─ README.md
```

### 3.2. Principes

- **`routes/`** ne contient **que** la couche HTTP : validation d'entrée, appel au service, réponse.
- **`services/`** contient la **logique métier** : pas de `FastAPI`, pas de `Request`.
- **`models/`** contient uniquement la **définition des tables** SQLAlchemy.
- **`schemas/`** contient **uniquement du Pydantic** (DTO d'entrée/sortie).
- **`domain/rules.py`** centralise les règles métier pures (âge, poids, compatibilité sanguine, délai entre dons…).
- **Aucun secret dans le code** : tout vient de `core/config.py` qui lit le `.env`.

### 3.3. Règles de codage

- **PEP 8** + formatage automatique avec `ruff format` (ou `black`).
- **Lint** avec `ruff`.
- **Typage** obligatoire sur les signatures publiques des services.
- **Docstrings** courtes sur les fonctions métier non triviales.
- **Nom des fichiers** : `snake_case`, en anglais.
- **Nom des classes** : `PascalCase`.
- **Nom des fonctions / variables** : `snake_case`.

---

## 4. Structure du projet mobile Flutter

> Nous utilisons une approche **feature-first** avec une **séparation en couches** inspirée de Clean Architecture (sans sur-ingénierie).

### 4.1. Arborescence recommandée

```
mobile/
├─ lib/
│  ├─ main.dart
│  ├─ app/                        # App globale
│  │  ├─ app.dart                 # MaterialApp, routeur, thème
│  │  ├─ router.dart              # Configuration GoRouter
│  │  └─ theme.dart               # Couleurs, typographies
│  ├─ core/                       # Code partagé transverse
│  │  ├─ network/                 # Dio, intercepteurs, base URL
│  │  ├─ storage/                 # SharedPreferences, secure storage
│  │  ├─ errors/                  # Exceptions, mapping d'erreurs
│  │  └─ utils/                   # Helpers généraux
│  ├─ shared/                     # Widgets, composants UI réutilisables
│  │  ├─ widgets/
│  │  └─ constants/
│  └─ features/                   # Une feature = un dossier
│     ├─ auth/
│     │  ├─ data/                 # Appels API, modèles de transport
│     │  ├─ domain/               # Entités, cas d'usage
│     │  └─ presentation/         # Écrans, widgets, state
│     ├─ profile_donor/
│     ├─ profile_center/
│     ├─ alerts/
│     ├─ appointments/
│     └─ donations/
├─ assets/
│  ├─ images/
│  └─ icons/
├─ test/
├─ pubspec.yaml
└─ README.md
```

### 4.2. Principes

- **Une feature = un dossier** complet (écran + logique + appels API).
- **`core/`** contient ce qui est **transverse** (réseau, stockage, erreurs).
- **`shared/`** contient les **widgets UI réutilisables** (boutons, champs, cards…).
- **Pas de logique métier dans les widgets** : elle va dans `domain/` ou dans le state de la feature.
- **Appels HTTP uniquement dans `data/`** : jamais directement depuis un widget.

### 4.3. Règles de codage

- **Formatage** : `dart format .` obligatoire avant push.
- **Lint** : `flutter analyze` doit passer sans erreurs.
- **Nom des fichiers** : `snake_case.dart`.
- **Nom des classes / widgets** : `PascalCase`.
- **Nom des variables / fonctions** : `camelCase`.
- **Const** partout où c'est possible pour optimiser le build.
- **Assets** obligatoirement déclarés dans `pubspec.yaml`.

---

## 5. Structure du projet admin web Flutter

L'admin web suit **la même logique** que `mobile/` mais avec ses propres features.

### 5.1. Arborescence recommandée

```
admin_web/
├─ lib/
│  ├─ main.dart
│  ├─ app/
│  │  ├─ app.dart
│  │  ├─ router.dart
│  │  └─ theme.dart
│  ├─ core/
│  ├─ shared/
│  └─ features/
│     ├─ auth/
│     ├─ dashboard/
│     ├─ users/
│     ├─ centers/
│     ├─ alerts/
│     └─ appointments/
├─ web/
├─ test/
├─ pubspec.yaml
└─ README.md
```

### 5.2. Règles spécifiques au web

- **Responsive design** pensé dès le début (desktop d'abord, tablette ensuite).
- **Tableaux paginés** pour toute liste d'admin.
- **Confirmation explicite** pour toute action destructive (suspendre, supprimer…).
- **Pas de logique sensible côté client** : toute la sécurité est côté backend.

---

## 6. Variables d'environnement et configuration

### 6.1. Règles

- **Jamais de `.env` dans Git**.
- **Toujours un `.env.example`** versionné, avec les **clés mais sans les valeurs**.
- Chaque projet a **son propre `.env`** local.
- **Pas de valeurs par défaut dangereuses** dans le code (jamais de mot de passe codé en dur).

### 6.2. Exemple `backend/.env.example`

```
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/bloodlink
JWT_SECRET=change_me
JWT_EXPIRES_MINUTES=60
ENV=development
```

### 6.3. Exemple `mobile/.env.example` (si utilisé)

```
API_BASE_URL=http://localhost:8000
MAPS_API_KEY=
```

---

## 7. Stratégie Git (branches)

Nous utilisons une variante légère de **GitHub Flow**, adaptée à un petit projet étudiant.

### 7.1. Branches permanentes

- **`main`**
  - Branche **stable**, toujours déployable.
  - Aucun commit direct, **jamais**.
  - Ne reçoit que des merges depuis `dev` ou des `hotfix/*`.

- **`dev`**
  - Branche **d'intégration** active.
  - Reçoit toutes les features via PR.
  - C'est la base de travail quotidienne de l'équipe.

### 7.2. Branches temporaires

- **`feature/<sujet>`** : nouvelle fonctionnalité
- **`fix/<sujet>`** : correction de bug
- **`chore/<sujet>`** : tâches techniques (config, outillage…)
- **`docs/<sujet>`** : documentation
- **`hotfix/<sujet>`** : correction urgente sur `main`

### 7.3. Règles absolues

- **Pas de push direct** sur `main` ou `dev`.
- **Une branche = une tâche** (une fonctionnalité, un bug, une doc).
- **Durée de vie courte** : une branche doit vivre **quelques jours maximum**.
- **Rebase ou merge ?** On utilise **merge avec PR** (plus simple pour les juniors).
- **On supprime la branche** après merge.

### 7.4. Schéma simple

```
main    ●──────●──────●──────●
             ↑       ↑      ↑
dev     ●───●───●───●───●───●
                ↑   ↑   ↑
feature/... ────●   ●   ●
```

---

## 8. Conventions de nommage des branches

### 8.1. Format

```
<type>/<sujet-court-en-kebab-case>
```

### 8.2. Types autorisés

- **`feature/`** — nouvelle fonctionnalité
- **`fix/`** — correction de bug
- **`chore/`** — maintenance, config, tooling
- **`docs/`** — documentation uniquement
- **`refactor/`** — refactoring sans changement fonctionnel
- **`test/`** — ajout ou correction de tests
- **`hotfix/`** — correctif urgent sur `main`

### 8.3. Exemples valides

- `feature/auth-login`
- `feature/alert-create`
- `fix/donor-profile-validation`
- `docs/readme-backend`
- `chore/setup-fastapi`
- `refactor/matching-service`
- `test/auth-endpoints`

### 8.4. Exemples à éviter

- `test` (pas de type, pas de sujet clair)
- `nouvelle_branche` (pas de convention)
- `feature/FatoumataDev` (nom de personne, pas de sujet)
- `feature/tout` (pas assez précis)

---

## 9. Conventions de commits (Conventional Commits)

Nous suivons la spécification **Conventional Commits**.

### 9.1. Format

```
<type>(<scope>): <description courte à l'impératif>
```

- **`type`** : voir liste ci-dessous
- **`scope`** (optionnel) : zone du code (`auth`, `donor`, `alert`, `ui`, `db`…)
- **`description`** : courte, en anglais ou en français (on choisit **français** pour l'équipe), à l'**impératif** présent

### 9.2. Types autorisés

- **`feat`** : nouvelle fonctionnalité
- **`fix`** : correction de bug
- **`docs`** : documentation
- **`style`** : formatage, espaces, renommage trivial (pas de logique)
- **`refactor`** : refactoring sans changement fonctionnel
- **`test`** : ajout ou correction de tests
- **`chore`** : maintenance, config, dépendances
- **`perf`** : amélioration de performance
- **`build`** : système de build, packaging
- **`ci`** : configuration CI/CD

### 9.3. Exemples valides

```
feat(auth): ajoute l'endpoint de connexion JWT
fix(donor): corrige la validation du poids minimum
docs(readme): ajoute les instructions de lancement local
chore(backend): ajoute ruff et configure le linter
refactor(matching): simplifie la requête PostGIS
test(auth): ajoute les tests unitaires du login
```

### 9.4. Corps et pied de commit (optionnels)

```
feat(alert): ajoute la création d'alerte côté centre

Permet à un centre authentifié de créer une alerte avec
groupe sanguin, rayon et date limite. Applique les règles
RM03 et RM04.

Refs: #12
```

### 9.5. Règles d'écriture

- **Un commit = une idée claire**.
- **Description courte** (72 caractères max sur la première ligne).
- **Impératif** : "ajoute", "corrige", "supprime", pas "ajouté" / "a ajouté".
- **Pas de point final** sur la première ligne.
- **Pas de commit "wip"** sur `dev` ou `main`.

### 9.6. Commits à éviter

- `update`
- `fix`
- `changements`
- `wip`
- `test commit`
- `asdfgh`

---

## 10. Pull Requests et revues de code

### 10.1. Ouverture d'une PR

- **Titre** : suit la convention des commits (`feat(auth): ...`).
- **Description** : expliquer **quoi**, **pourquoi**, et **comment tester**.
- **Checklist** dans la PR :
  - [ ] Tests ajoutés ou mis à jour
  - [ ] Lint / format OK
  - [ ] Documentation à jour si besoin
  - [ ] Pas de secret commité
  - [ ] Pas de code mort

### 10.2. Taille d'une PR

- **Objectif** : PR de **moins de 400 lignes modifiées**.
- Si c'est plus grand → **découper** en plusieurs PR.

### 10.3. Revue

- **Au moins 1 relecteur** en plus de l'auteur.
- Le relecteur **vérifie** :
  - la logique métier
  - la cohérence avec les règles RM
  - le nommage
  - la présence de tests
  - l'absence de secrets
  - le respect des conventions
- On privilégie les **commentaires constructifs**, pas les jugements.

### 10.4. Merge

- **Merge commit** (ou **squash** si la branche a beaucoup de petits commits).
- La **branche est supprimée** après merge.
- `dev` est **toujours vert** (les tests passent).

---

## 11. Qualité de code (lint, format, tests)

### 11.1. Backend (Python)

- **Formatage** : `ruff format .`
- **Lint** : `ruff check .`
- **Tests** : `pytest`
- **Typage** : utiliser les annotations de type partout
- **Avant chaque push** : format + lint + tests

### 11.2. Flutter (mobile + admin web)

- **Formatage** : `dart format .`
- **Lint** : `flutter analyze`
- **Tests** : `flutter test`
- **Avant chaque push** : format + analyze + test

### 11.3. Règle d'or

> **Rien ne part en PR si le projet ne compile pas ou si les tests échouent.**

---

## 12. Documentation projet

### 12.1. Ce qu'on documente

- Le **cahier des charges** (`docs/CAHIER_DES_CHARGES.md`)
- Le **guide des bonnes pratiques** (ce document)
- Un **README par sous-projet** avec :
  - prérequis
  - installation
  - commandes de lancement
  - commandes de test
- Les **règles métier** (`docs/rules.md`)
- Les **décisions d'architecture** importantes (`docs/adr/`)
- Les **schémas** (base de données, flux, use cases) dans `docs/diagrams/`

### 12.2. Règles

- La doc **vit avec le code**.
- Quand une fonctionnalité change, **la doc change dans la même PR**.
- Pas de PDF figé comme seule source de vérité : **le Markdown versionné prime**.

---

## 13. Checklist d'initialisation

À faire **avant de commencer à coder les fonctionnalités**.

### 13.1. Dépôt

- [ ] Créer le dépôt GitHub `bloodlink`
- [ ] Ajouter les collaborateurs
- [ ] Créer `main` et `dev`
- [ ] Protéger `main` (pas de push direct, PR obligatoires)
- [ ] Protéger `dev` (PR obligatoires, review obligatoire)
- [ ] Ajouter le `.gitignore` racine
- [ ] Ajouter le `README.md` racine
- [ ] Ajouter le `LICENSE`

### 13.2. Backend

- [ ] Créer `backend/`
- [ ] Initialiser l'environnement Python (venv)
- [ ] Créer `pyproject.toml` (ou `requirements.txt`)
- [ ] Installer FastAPI, Uvicorn, SQLAlchemy, Alembic, psycopg, Pydantic, passlib, python-jose
- [ ] Créer l'arborescence `app/` (core, models, schemas, routes, services, domain)
- [ ] Créer `app/main.py` minimal qui démarre
- [ ] Créer `.env.example`
- [ ] Ajouter `ruff` et configurer le lint
- [ ] Installer PostgreSQL + PostGIS **en local** sur chaque machine
- [ ] Créer la base `bloodlink` en local
- [ ] Vérifier la connexion DB depuis l'app
- [ ] Initialiser Alembic
- [ ] Rédiger `backend/README.md`

### 13.3. Mobile

- [ ] Créer `mobile/` avec `flutter create`
- [ ] Nettoyer le projet de démarrage
- [ ] Ajouter `dio`, `flutter_riverpod`, `go_router`
- [ ] Créer l'arborescence `lib/` (app, core, shared, features)
- [ ] Configurer le thème et le routeur
- [ ] Ajouter un écran de test qui s'affiche
- [ ] Rédiger `mobile/README.md`

### 13.4. Admin web

- [ ] Créer `admin_web/` avec `flutter create --platforms=web`
- [ ] Nettoyer le projet de démarrage
- [ ] Ajouter les mêmes dépendances de base
- [ ] Créer l'arborescence `lib/`
- [ ] Vérifier `flutter run -d chrome`
- [ ] Rédiger `admin_web/README.md`

### 13.5. Documentation

- [ ] Déplacer `CAHIER_DES_CHARGES.md` dans `docs/`
- [ ] Ajouter `docs/GUIDE_BONNES_PRATIQUES.md` (ce fichier)
- [ ] Créer `docs/rules.md` (règles métier RM01..RM12)

---

## 14. Règles de collaboration de l'équipe

### 14.1. Rythme

- **3 jours par semaine** de travail effectif.
- **Daily court** au début de chaque journée (15 min max).
- **Revue de fin de module** à la fin de chaque semaine.

### 14.2. Communication

- **Canal principal** : Discord (ou équivalent choisi par l'équipe).
- **Suivi des tâches** : ClickUp.
- **Code review** : GitHub uniquement (pas dans Discord).
- **Questions techniques** : dans la PR concernée, pas en message privé.

### 14.3. Répartition

- On ne se divise pas en "front" et "back" rigides.
- Chaque membre est **capable de toucher à plusieurs parties** du projet.
- **Pair programming** encouragé sur les parties critiques (auth, matching, validation du don).

### 14.4. Conflits

- Un désaccord technique se résout par :
  1. discussion dans la PR
  2. si non résolu → discussion en daily
  3. si toujours pas → décision du pilote du module

---

## 15. Résumé en 10 règles

1. **Monorepo unique** avec `backend/`, `mobile/`, `admin_web/`, `docs/`.
2. **Pas de Docker** pour le développement : tout est installé en local.
3. **`main` et `dev` sont protégées**, jamais de push direct.
4. **Une branche = une tâche** : `feature/...`, `fix/...`, `docs/...`.
5. **Conventional Commits** obligatoires.
6. **PR courtes** (< 400 lignes) avec au moins 1 reviewer.
7. **Tests + lint + format** passent avant tout push.
8. **Aucun secret dans Git** : tout passe par `.env` local.
9. **Documentation à jour** dans la même PR que le code.
10. **Communication dans la PR** et suivi dans ClickUp.

---

*Dernière mise à jour : à compléter à chaque évolution de ce guide via une PR `docs/update-guide`.*
