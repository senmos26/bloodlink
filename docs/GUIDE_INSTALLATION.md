# Guide d'installation et de découverte des outils — BloodLink

> Ce document sert à **deux choses** :
>
> 1. Expliquer **ce que sont les outils** utilisés dans le projet BloodLink, de manière simple, pour que toute l'équipe apprenne en même temps qu'elle travaille.
> 2. Servir de **manuel d'installation pas à pas** du projet, reproductible par chaque membre de l'équipe.

---

## 1. À qui s'adresse ce guide

Ce guide est pensé pour :

- toute l'équipe BloodLink
- quelqu'un qui n'a jamais manipulé FastAPI, PostgreSQL, SQLAlchemy ou Alembic
- un nouveau membre qui rejoindrait le projet plus tard

L'idée est qu'en le lisant tu puisses :

- comprendre **pourquoi** on utilise chaque outil
- installer le projet **from scratch** sur ta machine
- commencer à coder côté backend

---

## 2. Vue d'ensemble du projet

BloodLink est composé de **trois parties** :

- **backend** : une API REST construite avec FastAPI en Python.
- **mobile** : une application Flutter pour les donneurs et les centres.
- **admin_web** : une interface d'administration en Flutter Web.

Tout est rangé dans **un seul dépôt Git** (monorepo) :

```text
bloodlink/
├─ backend/       # API FastAPI
├─ mobile/        # App Flutter mobile
├─ admin_web/     # Interface d'administration Flutter Web
├─ docs/          # Documentation projet
└─ scripts/       # Scripts utilitaires
```

Pour le MVP, on travaille **en local**, sans Docker. Chaque développeur installe les outils sur sa machine.

---

## 3. Les outils utilisés côté backend

Voici, **outil par outil**, à quoi ils servent.

### 3.1. Python

Python est le **langage de programmation** dans lequel est écrit notre backend.

- Version utilisée : **Python 3.13**
- C'est comme JavaScript, mais pour faire du serveur, des scripts, de la data, etc.
- On écrit notre API avec Python + FastAPI.

### 3.2. `pip`

`pip` est le **gestionnaire de paquets** de Python.

- Il sert à installer des bibliothèques Python.
- C'est l'équivalent de `npm` pour Node.js.
- Exemple : `pip install fastapi` installe FastAPI.

### 3.3. `venv` (environnement virtuel)

`venv` est un **dossier isolé** où on installe les bibliothèques Python **uniquement pour le projet**.

Pourquoi on l'utilise ?

- Pour que les bibliothèques de BloodLink **ne se mélangent pas** avec le reste de ta machine.
- Pour que **tout le monde ait les mêmes versions** de paquets.
- Pour ne pas casser Python au niveau système.

Dans le projet, il est situé ici :

```text
backend/.venv/
```

### 3.4. FastAPI

FastAPI est le **framework** qu'on utilise pour construire l'API.

Ce qu'il fait :

- on définit des routes HTTP (`GET`, `POST`, `PATCH`, etc.)
- il gère la validation des données automatiquement
- il génère une documentation interactive automatique
- il est rapide et moderne

Exemple très simple :

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def hello():
    return {"message": "Bonjour BloodLink"}
```

C'est comme **Express.js** pour Node, mais plus structuré et typé.

### 3.5. Uvicorn

Uvicorn est le **serveur** qui fait tourner l'application FastAPI.

- FastAPI définit l'API
- Uvicorn l'exécute et l'expose sur le réseau local
- Il supporte le **hot reload** : si tu modifies un fichier, il redémarre tout seul

On l'utilise via la commande :

```powershell
python -m uvicorn app.main:app --reload
```

### 3.6. SQLAlchemy

SQLAlchemy est un **ORM** pour Python.

Un ORM (Object Relational Mapper) permet de :

- manipuler la base de données **avec des classes Python**
- plutôt que d'écrire du SQL à la main

Exemple :

```python
class Utilisateur(Base):
    __tablename__ = "utilisateur"
    id = Column(UUID, primary_key=True)
    email = Column(String, unique=True)
```

SQLAlchemy traduit ça automatiquement en SQL pour PostgreSQL.

### 3.7. Alembic

Alembic est l'outil de **migrations de base de données** associé à SQLAlchemy.

Une migration, c'est un script qui décrit un **changement** dans la base :

- créer une table
- ajouter une colonne
- supprimer un champ

Pourquoi on l'utilise ?

- pour que **toute l'équipe ait la même structure de base**
- pour pouvoir **revenir en arrière** en cas d'erreur
- pour garder un **historique** des évolutions de la base

### 3.8. psycopg

`psycopg` est le **driver PostgreSQL** pour Python.

- SQLAlchemy parle à la base via psycopg
- c'est lui qui fait le vrai lien entre Python et PostgreSQL

Tu n'as pas à le manipuler directement, mais il doit être installé.

### 3.9. Pydantic et `pydantic-settings`

Pydantic est utilisé par FastAPI pour **valider les données**.

- tu décris la forme attendue d'une donnée dans une classe
- Pydantic vérifie automatiquement que ça correspond

Exemple :

```python
class LoginInput(BaseModel):
    email: EmailStr
    password: str
```

`pydantic-settings` permet de **charger la configuration** depuis un fichier `.env`, par exemple la connexion DB, le port, le secret JWT, etc.

### 3.10. `python-jose`

`python-jose` est utilisé pour **générer et valider les JWT**.

Un JWT est un jeton d'authentification signé :

- quand un utilisateur se connecte, on lui envoie un JWT
- il renvoie ce jeton à chaque requête
- on vérifie qu'il est bien valide

### 3.11. `passlib` + `bcrypt`

- `bcrypt` est un algorithme qui **hash les mots de passe**
- `passlib` est une librairie Python qui l'utilise proprement

Pourquoi ?

- on ne stocke **jamais** un mot de passe en clair
- on stocke seulement son hash
- bcrypt est conçu pour être **lent exprès**, ce qui rend les attaques par force brute plus difficiles

### 3.12. `pytest`

`pytest` est le framework de **tests automatisés** côté backend.

Pourquoi c'est important ?

- on écrit des tests pour vérifier que le code fait bien ce qu'on veut
- les tests tournent à chaque fois qu'on change du code
- ça évite de **casser l'existant** sans s'en rendre compte

### 3.13. `httpx`

`httpx` est un client HTTP Python.

On l'utilise surtout dans les **tests** pour :

- appeler les endpoints de notre propre API
- vérifier que les réponses sont correctes

### 3.14. `ruff`

`ruff` est un **linter** et un **formateur** de code Python.

- il vérifie le style
- il détecte des erreurs fréquentes
- il peut reformatter le code automatiquement

Ça sert à avoir **du code homogène** dans toute l'équipe.

---

## 4. Les outils utilisés côté données

### 4.1. PostgreSQL

PostgreSQL est notre **base de données relationnelle**.

- stocke tous les utilisateurs, centres, alertes, rendez-vous, etc.
- c'est un système **très robuste** utilisé dans beaucoup d'entreprises
- version utilisée dans le projet : **PostgreSQL 18**

### 4.2. PostGIS

PostGIS est une **extension de PostgreSQL** qui ajoute le support des données géographiques.

Dans BloodLink, on en a besoin pour :

- stocker la position des centres
- stocker la position des donneurs
- faire des requêtes du style :
  - *"trouver tous les donneurs dans un rayon de 10 km autour d'un centre"*

PostGIS nous permet de faire ça **directement en SQL**, de façon efficace.

### 4.3. pgAdmin

pgAdmin est une **interface graphique** pour administrer PostgreSQL.

- permet de voir les bases
- de créer / modifier / supprimer des tables
- d'exécuter des requêtes SQL à la main
- plus simple que la ligne de commande quand on débute

---

## 5. Les outils utilisés côté front-end

> Ces outils seront installés plus tard, quand on démarrera la partie mobile et la partie admin web.

### 5.1. Flutter

Flutter est le **framework** utilisé pour :

- l'application mobile (Android)
- l'application web d'administration

Avec un seul code Dart on peut viser plusieurs plateformes.

### 5.2. Dart

Dart est le **langage** utilisé par Flutter.

Pas besoin de l'apprendre avant Flutter : en pratique, on apprend les deux en même temps.

---

## 6. Les outils utilisés pour la collaboration

### 6.1. Git

Git est le **système de gestion de versions** du code.

- chaque modification est historisée
- on peut revenir en arrière
- on travaille à plusieurs sans s'écraser

### 6.2. GitHub

GitHub est la **plateforme en ligne** qui héberge le dépôt du projet.

- https://github.com/senmos26/bloodlink
- on y fait les PR (Pull Requests) et les revues de code

### 6.3. ClickUp

ClickUp est l'outil de **gestion de tâches** utilisé par l'équipe.

- on y suit les tâches par semaine
- on y met des rapports
- on s'assigne le travail

---

## 7. Manuel d'installation du projet

Cette section explique comment **installer le projet BloodLink** depuis zéro sur une machine Windows.

### 7.1. Prérequis à installer sur la machine

Avant de cloner le projet, tu dois avoir :

- **Python 3.13** (ou une version proche de 3.12/3.13)
- **PostgreSQL 16 ou plus récent** (on utilise la 18)
- **Git**
- un éditeur de code, par exemple **VS Code** ou **Windsurf**

### 7.2. Vérifier les prérequis

Dans un terminal PowerShell, tape :

```powershell
python --version
git --version
```

Tu dois voir quelque chose comme :

```text
Python 3.13.x
git version 2.x.x
```

Pour PostgreSQL, vérifie le binaire :

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

Tu dois voir :

```text
psql (PostgreSQL) 18.x
```

> Si `psql` n'est pas dans le PATH global, ce n'est pas grave. On peut toujours l'appeler via son chemin complet.

### 7.3. Cloner le dépôt

Depuis un dossier où tu veux ranger le projet :

```powershell
git clone https://github.com/senmos26/bloodlink.git
```

Ensuite entre dans le dossier :

```powershell
cd bloodlink
```

### 7.4. Se mettre sur la bonne branche

On ne développe **jamais** directement sur `main`.

- `main` = version stable
- `dev` = branche d'intégration

Pour récupérer `dev` :

```powershell
git fetch origin
git checkout dev
git pull
```

Ensuite, tu crées **ta propre branche de tâche** à partir de `dev` :

```powershell
git checkout -b feature/nom-de-ta-tache
```

### 7.5. Installer le backend

Va dans le dossier backend :

```powershell
cd backend
```

Crée un environnement virtuel Python dédié :

```powershell
python -m venv .venv
```

Active-le :

```powershell
.\.venv\Scripts\Activate.ps1
```

> Si PowerShell refuse à cause de la politique d'exécution, tu peux autoriser les scripts locaux ainsi :
>
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

Mets à jour `pip` puis installe les dépendances :

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 7.6. Configurer les variables d'environnement

Dans le dossier `backend/`, il y a un fichier `.env.example` qui contient un modèle de configuration.

Il faut créer ton propre `.env` à côté, à partir de ce modèle.

Dans PowerShell :

```powershell
Copy-Item .env.example .env
```

> Important : `cp .env.example .env` ne marche pas toujours selon la version de PowerShell. Préfère la forme `Copy-Item`.

Ensuite ouvre `.env` et remplace au minimum :

- `DATABASE_PASSWORD=change_me` par le **vrai mot de passe** du compte `postgres` que tu as défini lors de l'installation.
- `JWT_SECRET_KEY=change_me` par une **longue chaîne aléatoire** (au moins 32 caractères). Ça peut être un mot de passe généré.

Exemple plausible :

```env
DATABASE_PASSWORD=MonMotDePasseLocalSuperLong
JWT_SECRET_KEY=39c24f1a59a14c6f9b4e0b7f2a8d6b12
```

> Le fichier `.env` est **ignoré par Git**. Il ne doit **jamais** être poussé.

### 7.7. Créer la base de données PostgreSQL

Il faut maintenant créer la base `bloodlink` dans PostgreSQL.

Ouvre `psql` avec le compte administrateur :

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

Une fois à l'intérieur de `psql`, exécute :

```sql
CREATE DATABASE bloodlink;
\q
```

> Plus tard, on ajoutera l'extension PostGIS avec :
>
> ```sql
> \c bloodlink
> CREATE EXTENSION IF NOT EXISTS postgis;
> ```

### 7.8. Lancer l'API en local

Toujours dans `backend/`, avec l'environnement virtuel **activé**, lance :

```powershell
python -m uvicorn app.main:app --reload
```

Tu devrais voir quelque chose du genre :

```text
Uvicorn running on http://127.0.0.1:8000
```

Ouvre ton navigateur sur :

- **http://127.0.0.1:8000/** pour la route principale
- **http://127.0.0.1:8000/api/v1/health** pour la route de santé
- **http://127.0.0.1:8000/docs** pour la documentation Swagger auto-générée par FastAPI

### 7.9. Lancer les tests

Pour vérifier que tout fonctionne :

```powershell
python -m pytest
```

Tu dois voir quelque chose comme :

```text
2 passed in 0.7s
```

---

## 8. Commandes utiles au quotidien

### 8.1. Activer l'environnement virtuel

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
```

### 8.2. Lancer l'API

```powershell
python -m uvicorn app.main:app --reload
```

### 8.3. Lancer les tests

```powershell
python -m pytest
```

### 8.4. Formatter et nettoyer le code

```powershell
python -m ruff check .
python -m ruff format .
```

### 8.5. Mettre à jour `requirements.txt` après ajout d'une dépendance

```powershell
python -m pip freeze | Out-File -Encoding utf8 requirements.txt
```

---

## 9. Problèmes fréquents et solutions

### 9.1. `cp : Impossible de trouver le chemin d'accès`

Dans PowerShell, `cp` peut avoir un comportement différent.

Utilise :

```powershell
Copy-Item .env.example .env
```

### 9.2. PowerShell refuse de lancer `Activate.ps1`

Exécute une seule fois :

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Puis réessaie d'activer le venv.

### 9.3. `psql` non reconnu

C'est normal si PostgreSQL n'est pas ajouté au PATH. Tu peux toujours faire :

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

### 9.4. Erreur de connexion à la base

Vérifie dans `.env` que :

- `DATABASE_HOST=127.0.0.1`
- `DATABASE_PORT=5432`
- `DATABASE_USER=postgres`
- `DATABASE_PASSWORD` correspond à ton vrai mot de passe
- la base `bloodlink` existe bien

### 9.5. Conflit de dépendances Python

Supprime le venv et recommence :

```powershell
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

---

## 10. Conseils d'apprentissage

Tu n'as **pas besoin** de tout maîtriser d'un coup. L'idée est de progresser module par module.

Ordre d'apprentissage recommandé :

1. Prendre en main **Git et GitHub** (cloner, branches, PR).
2. Comprendre comment **FastAPI déclare une route**.
3. Comprendre comment **Pydantic valide une entrée**.
4. Comprendre comment **SQLAlchemy décrit une table**.
5. Comprendre comment **Alembic applique une migration**.
6. Comprendre comment fonctionne **un JWT** et le flux d'authentification.
7. Ensuite seulement, attaquer la logique métier : alertes, matching, notifications, etc.

---

## 11. Récapitulatif rapide

- Backend : **FastAPI + SQLAlchemy + Alembic + PostgreSQL**
- Auth : **JWT + bcrypt**
- Base : **PostgreSQL 18 + PostGIS**
- Front mobile et admin : **Flutter**
- Versionning : **Git + GitHub**
- Tâches : **ClickUp**
- Tout tourne **en local, sans Docker**

Cette base est volontairement simple et propre. On va l'enrichir petit à petit, ensemble.
