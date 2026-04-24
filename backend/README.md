# Backend

Ce dossier accueillera l'API FastAPI de BloodLink.

## Prévu dans ce projet

- configuration FastAPI
- connexion PostgreSQL / PostGIS en local
- modèles SQLAlchemy
- migrations Alembic
- endpoints d'authentification et métier

## État actuel

- environnement virtuel Python créé dans `.venv`
- dépendances backend installées
- structure initiale `app/` créée
- route de santé disponible dans `/api/v1/health`
- tests de base ajoutés

## Structure actuelle

```text
backend/
├─ .venv/
├─ app/
│  ├─ api/
│  ├─ core/
│  ├─ models/
│  └─ schemas/
├─ tests/
├─ .env.example
├─ requirements.txt
└─ README.md
```

## Installation réalisée

- Python 3.13 détecté
- PostgreSQL installé localement
- dépendances FastAPI installées via `pip`

## Commandes utiles

### Activer le venv

```powershell
.\.venv\Scripts\Activate.ps1
```

### Lancer l'API

```powershell
.\.venv\Scripts\python -m uvicorn app.main:app --reload
```

### Lancer les tests

```powershell
.\.venv\Scripts\python -m pytest
```

## Étapes suivantes

- copier `.env.example` vers `.env`
- créer la base `bloodlink` dans PostgreSQL
- configurer la connexion locale
- ajouter les premiers modèles métier
- initialiser Alembic
