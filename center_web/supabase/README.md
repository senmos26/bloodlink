# 📋 Guide d'exécution des scripts SQL - La Trouvaille

## ✅ Ordre d'exécution

Exécutez les scripts **dans cet ordre exact** dans l'éditeur SQL de Supabase :

### 1️⃣ **schema.sql** (EN PREMIER)
Crée toutes les tables, indexes, triggers, RLS et données initiales.

```sql
-- Copier-coller tout le contenu de schema.sql
```

### 2️⃣ **rpc-functions.sql** (EN DEUXIÈME)
Crée les fonctions RPC pour les requêtes optimisées.

```sql
-- Copier-coller tout le contenu de rpc-functions.sql
```

### 3️⃣ **storage.sql** (EN DERNIER)
Configure le bucket de stockage pour les uploads de fichiers.

```sql
-- Copier-coller tout le contenu de storage.sql
```

---

## 🔐 Configuration Authentification

### Créer un utilisateur admin

Après l'exécution des scripts, allez dans **Authentication > Users** dans Supabase et créez un utilisateur :

1. **Email** : admin@latrouvaille.org
2. **Mot de passe** : (choisissez un mot de passe sécurisé)
3. **Confirmer l'email** (dans le dashboard)

### Créer son profil admin

Ensuite, exécutez ce SQL pour créer son profil :

```sql
-- Remplacer USER_ID par l'UUID de l'utilisateur créé
INSERT INTO admin_profiles (id, name, role)
VALUES ('USER_ID_ICI', 'Administrateur Principal', 'admin');
```

---

## 📦 Configuration .env

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
```

### Admin (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

---

## ✅ Vérifications post-installation

### 1. Tables créées (27 tables)
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Vous devez voir :
- admin_profiles
- blog_categories
- blog_comments
- blog_likes
- blog_post_tags
- blog_posts
- contacts
- event_categories
- event_gallery
- event_highlights
- event_moderators
- event_program
- event_registrations
- event_rubriques
- event_speakers
- event_tags
- events
- objectives
- tags
- team_achievements
- team_education
- team_experience
- team_members
- testimonials
- timeline_entries

### 2. Bucket créé
Allez dans **Storage** et vérifiez que le bucket `la-trouvaille-media` existe.

### 3. RLS activé
Toutes les tables doivent avoir RLS = enabled dans Supabase.

---

## 🚀 Données de test

Les catégories et tags de base sont automatiquement créés :

**Catégories d'événements** :
- Conférence
- Workshop
- Networking
- Formation
- Webinaire

**Rubriques de webinaires** :
- Innovation
- Leadership
- Entrepreneuriat
- Santé Mentale
- Technologie

**Catégories de blog** :
- Technologie
- Entrepreneuriat
- Leadership
- Innovation
- Développement

**Tags populaires** :
- Innovation
- Leadership
- Jeunesse
- Technologie
- Afrique
- Entrepreneuriat
- Business
- Santé Mentale

---

## 🔧 En cas de problème

### Réinitialiser complètement
```sql
-- ⚠️ ATTENTION : Supprime TOUT
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Puis réexécutez les 3 scripts dans l'ordre.

---

## 📞 Support

Tout est maintenant configuré et prêt à l'emploi ! 🎉
