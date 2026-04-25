# Plan de Travail BloodLink - 3 jours/semaine

> Ce document détaille toutes les tâches semaine par semaine pour une équipe de 5 développeurs débutants.

---

## 👥 Composition de l'Équipe

| # | Prénom | Username | Rôle Semaine 1 | Rôle Semaine 2 | Rôle Semaine 3 | Rôle Semaine 4 | Rôle Semaine 5 | Rôle Semaine 6 |
|---|--------|----------|----------------|----------------|----------------|----------------|----------------|----------------|
| 1 | **Assia** | @assia_az | Pair A | Pair A | Solo Review | Pair B | Pair B | Tous |
| 2 | **Souhaila** | @souhaila_omri | Pair A | Pair B | Pair A | Solo Review | Pair A | Tous |
| 3 | **Fatoumata** | @fatoumata_sidibe | Solo Review | Pair B | Pair B | Pair A | Pair A | Tous |
| 4 | **Béni** | @beni_ouendo | Pair B | Solo Review | Pair A | Pair B | Solo Review | Tous |
| 5 | **Nathanaël** | @nathanael_somali | Pair B | Pair A | Pair A | Pair A | Pair B | Tous |

**Légende** :
- **Pair A** = Travaille sur les tâches Pair A avec son coéquipier
- **Pair B** = Travaille sur les tâches Pair B avec son coéquipier  
- **Solo Review** = Fait les revues de code et aide les autres

---

## 🔄 Tableau de Rotation des Pairs

```
Semaine 1 (Setup + Auth)
├── Pair A: Assia 🤝 Souhaila
├── Pair B: Béni 🤝 Nathanaël
└── Review: Fatoumata

Semaine 2 (Profils)
├── Pair A: Assia 🤝 Nathanaël
├── Pair B: Souhaila 🤝 Fatoumata
└── Review: Béni

Semaine 3 (Carte & Alertes)
├── Pair A: Souhaila 🤝 Béni
├── Pair B: Fatoumata 🤝 Nathanaël
└── Review: Assia

Semaine 4 (RDV & Notifs)
├── Pair A: Nathanaël 🤝 Assia
├── Pair B: Souhaila 🤝 Fatoumata
└── Review: Béni

Semaine 5 (Dons & Validation)
├── Pair A: Fatoumata 🤝 Béni
├── Pair B: Assia 🤝 Souhaila
└── Review: Nathanaël

Semaine 6 (Tests & Deploy)
└── Tous ensemble
```

---

## 📋 Format des Tâches

Chaque tâche contient :
- **👤 Assignés** : Qui fait la tâche (noms précis)
- **🎯 Objectif** : Ce qu'on doit accomplir
- **📅 Durée** : 1 journée complète (3 jours/semaine)
- **✅ Checklist** : Étapes détaillées à cocher
- **📚 Ressources** : Liens et docs utiles
- **⚠️ Blocage** : Quand demander de l'aide

---

## Semaine 1 : Authentication & Setup

**Objectif** : Les utilisateurs peuvent s'inscrire, se connecter et voir leur profil.

### Jour 1 - Setup & Configuration

#### Tâche 1.1 : Setup Environnement (Tous ensemble)
**👤 Assignés** : **Toute l'équipe** (Assia + Souhaila + Fatoumata + Béni + Nathanaël)
**🎯 Objectif** : Tout le monde a le projet qui fonctionne sur sa machine
**Durée** : 1 journée complète
**Description** : Installer tous les outils nécessaires et configurer les projets.

**Checklist** :
- [ ] Cloner le repo GitHub (`pre-prod` branch)
- [ ] Installer Node.js 18+ sur chaque machine
- [ ] Installer Expo Go sur les téléphones
- [ ] Lancer `npm install` dans `mobile/`
- [ ] Lancer `npm install` dans `admin_web/`
- [ ] Créer `.env.local` avec les clés Supabase
- [ ] Vérifier que l'app mobile démarre (`npm start`)
- [ ] Vérifier que l'admin web démarre (`npm run dev`)

**Documentation** : Voir `docs/GUIDE_INSTALLATION.md`

---

### Jour 2 - Login & Register Mobile

#### Tâche 1.2 : Écrans Login/Register Mobile
**👤 Assignés** : **Pair A** — Assia 🤝 Souhaila
**🎯 Objectif** : Interface utilisateur pour se connecter et s'inscrire
**Description** : Créer les écrans d'authentification dans l'app mobile.

**Checklist** :
- [ ] Créer `src/app/auth/login.tsx`
  - [ ] Champ email avec validation
  - [ ] Champ mot de passe (masqué)
  - [ ] Bouton "Se connecter"
  - [ ] Lien "Créer un compte"
- [ ] Créer `src/app/auth/register.tsx`
  - [ ] Champ nom complet
  - [ ] Champ email
  - [ ] Champ téléphone
  - [ ] Champ mot de passe
  - [ ] Sélecteur groupe sanguin
  - [ ] Date de naissance
  - [ ] Bouton "S'inscrire"
- [ ] Ajouter la navigation entre les deux écrans
- [ ] Tester sur Expo Go

**Ressources** :
- React Native TextInput : https://reactnative.dev/docs/textinput
- Supabase Auth : Voir `supabase/README.md` section Auth

---

### Jour 3 - Auth Logique & Supabase

#### Tâche 1.3 : Connecter Supabase Auth
**👤 Assignés** : **Pair B** — Béni 🤝 Nathanaël
**🎯 Objectif** : Le login/register fonctionne vraiment avec Supabase
**Description** : Connecter les écrans à Supabase pour l'authentification réelle.

**Checklist** :
- [ ] Installer `@supabase/supabase-js` dans mobile
- [ ] Créer `src/services/supabase.ts`
  - [ ] Initialiser le client Supabase
  - [ ] Exporter `supabase` pour utilisation
- [ ] Implémenter `signUp()` dans register
  - [ ] Appel `supabase.auth.signUp()`
  - [ ] Gérer les erreurs (email déjà utilisé, etc.)
  - [ ] Rediriger vers login après succès
- [ ] Implémenter `signIn()` dans login
  - [ ] Appel `supabase.auth.signInWithPassword()`
  - [ ] Stocker la session
  - [ ] Rediriger vers l'accueil
- [ ] Créer un store Zustand pour l'état auth
  - [ ] `user`, `isLoggedIn`, `login()`, `logout()`

**Tâche 1.4 : Page Login Admin Web**
**👤 Assignée** : **Solo Review** — Fatoumata Sidibé
**🎯 Objectif** : Page de connexion pour le dashboard admin web
**Description** : Créer la page de connexion pour le dashboard admin.

**Checklist** :
- [ ] Créer `src/app/auth/login/page.tsx`
  - [ ] Formulaire email + password
  - [ ] Connexion Supabase Auth
  - [ ] Redirection après login
- [ ] Ajouter middleware pour protéger les routes
- [ ] Tester la connexion admin

**Review** : La 5ème personne review les PRs

---

## Semaine 2 : Profils & Navigation

### Jour 1 - Profil Donneur Mobile

#### Tâche 2.1 : Écran Profil Mobile
**👤 Assignés** : **Pair A** — Assia 🤝 Nathanaël
**🎯 Objectif** : Permettre au donneur de voir et modifier son profil

**Checklist** :
- [ ] Créer `src/app/tabs/profile.tsx`
  - [ ] Afficher nom, email, téléphone
  - [ ] Afficher groupe sanguin
  - [ ] Afficher prochaine date de don possible
  - [ ] Bouton "Modifier profil"
- [ ] Créer modal/écran d'édition
  - [ ] Formulaire pré-rempli
  - [ ] Bouton "Enregistrer"
- [ ] Connecter à Supabase
  - [ ] `supabase.from('profiles').select()`
  - [ ] `supabase.from('profiles').update()`
- [ ] Gérer le refresh après modification

---

### Jour 2 - Upload Photo & Storage

#### Tâche 2.2 : Photo de Profil
**👤 Assignés** : **Pair B** — Souhaila 🤝 Fatoumata
**🎯 Objectif** : Permettre l'upload d'une photo de profil

**Checklist** :
- [ ] Configurer Storage Supabase
  - [ ] Créer bucket `avatars` (public)
  - [ ] Définir policies RLS
- [ ] Installer `expo-image-picker`
- [ ] Implémenter sélection photo
  - [ ] Ouvrir galerie/appareil photo
  - [ ] Redimensionner l'image (max 500x500)
- [ ] Uploader vers Supabase Storage
  - [ ] Générer nom unique : `user_id_timestamp.jpg`
  - [ ] Récupérer l'URL publique
  - [ ] Stocker l'URL dans `profiles.avatar_url`
- [ ] Afficher la photo dans le profil

---

### Jour 3 - Dashboard Centre (Admin)

#### Tâche 2.3 : Dashboard Centre Web
**👤 Assignés** : **Pair A + Solo Review** — Assia, Nathanaël & Béni (review)
**🎯 Objectif** : Page d'accueil pour les admin de centre

**Checklist** :
- [ ] Créer `src/app/(dashboard)/center/page.tsx`
  - [ ] Afficher infos du centre connecté
  - [ ] Statistiques : total dons, dons ce mois
  - [ ] Liste des 5 derniers dons
  - [ ] Bouton "Créer une alerte"
  - [ ] Bouton "Voir les RDV"
- [ ] Créer layout dashboard
  - [ ] Sidebar navigation
  - [ ] Header avec nom du centre + logout
- [ ] Fetch données depuis Supabase
  - [ ] Jointure `centers` + `donations`

---

## Semaine 3 : Carte & Alertes

### Jour 1 - Google Maps Mobile

#### Tâche 3.1 : Intégration Carte
**👤 Assignés** : **Pair A** — Souhaila 🤝 Béni
**🎯 Objectif** : Afficher une carte avec les centres de transfusion

**Checklist** :
- [ ] Installer `react-native-maps`
- [ ] Configurer clé API Google Maps
  - [ ] Créer projet Google Cloud
  - [ ] Activer Maps SDK (Android + iOS)
  - [ ] Ajouter clé dans `app.json`
- [ ] Créer `src/app/tabs/map.tsx`
  - [ ] Afficher carte centrée sur position actuelle
  - [ ] Bouton "Ma position"
- [ ] Récupérer position GPS
  - [ ] Demander permission location
  - [ ] Utiliser `expo-location`

---

### Jour 2 - Marqueurs & Centres

#### Tâche 3.2 : Afficher Centres sur Carte
**👤 Assignés** : **Pair B** — Fatoumata 🤝 Nathanaël
**Description** : Récupérer et afficher les centres comme marqueurs.

**Checklist** :
- [ ] Créer Edge Function `get-nearby-centers`
  - [ ] Recevoir latitude, longitude, rayon_km
  - [ ] Retourner centres triés par distance
- [ ] Appeler depuis la carte
  - [ ] `supabase.functions.invoke('get-nearby-centers')`
  - [ ] Passer position actuelle
- [ ] Afficher marqueurs personnalisés
  - [ ] Icône goutte de sang
  - [ ] Popup au clic : nom, adresse, bouton "Voir"
- [ ] Calculer distance affichée
  - [ ] "À 2.5 km de vous"

---

### Jour 3 - Création Alertes (Admin)

#### Tâche 3.3 : Formulaire Création Alerte
**👤 Assignés** : **Pair A + Solo Review** — Souhaila, Béni & Assia (review)
**🎯 Objectif** : Permettre aux centres de créer des alertes de pénurie

**Checklist** :
- [ ] Créer `src/app/(dashboard)/alerts/new/page.tsx`
  - [ ] Sélecteur groupe sanguin requis
  - [ ] Sélecteur niveau urgence (low/medium/high/critical)
  - [ ] Champ rayon en km
  - [ ] Champ message optionnel
  - [ ] Date d'expiration
  - [ ] Bouton "Publier l'alerte"
- [ ] Validation formulaire
  - [ ] Tous les champs requis
  - [ ] Date expiration > aujourd'hui
- [ ] Insertion Supabase
  - [ ] `supabase.from('alerts').insert()`
  - [ ] `center_id` = centre connecté
- [ ] Redirection liste des alertes

---

## Semaine 4 : Rendez-vous & Notifications

### Jour 1 - Prise de RDV Mobile

#### Tâche 4.1 : Écran Prise RDV
**👤 Assignés** : **Pair A** — Nathanaël 🤝 Assia
**🎯 Objectif** : Permettre à un donneur de prendre rendez-vous

**Checklist** :
- [ ] Créer `src/app/appointment/new.tsx`
  - [ ] Sélecteur centre (liste ou carte)
  - [ ] Calendrier date picker
  - [ ] Sélecteur heure (créneaux)
  - [ ] Affichage motif (si depuis alerte)
  - [ ] Bouton "Confirmer RDV"
- [ ] Validation
  - [ ] Date future uniquement
  - [ ] Vérifier éligibilité (next_donation_date passée)
- [ ] Insertion Supabase
  - [ ] `appointments` table
  - [ ] Status `pending`
- [ ] Confirmation à l'utilisateur

---

### Jour 2 - Liste RDV & Notifications Push

#### Tâche 4.2 : Liste RDV & Notifs
**👤 Assignés** : **Pair B** — Souhaila 🤝 Fatoumata
**🎯 Objectif** : Voir ses RDV et recevoir des notifications

**Checklist partie 1 - Liste RDV** :
- [ ] Créer `src/app/tabs/appointments.tsx`
  - [ ] Liste des RDV du donneur connecté
  - [ ] Card avec : date, heure, centre, statut
  - [ ] Statut coloré (pending=yellow, confirmed=green, cancelled=red)
  - [ ] Bouton annuler (si pending)
- [ ] Tri par date (plus proche en premier)

**Checklist partie 2 - Push Notifications** :
- [ ] Configurer FCM (Firebase Cloud Messaging)
  - [ ] Créer projet Firebase
  - [ ] Ajouter config dans mobile
- [ ] Installer `expo-notifications`
- [ ] Demander permission notifications
- [ ] Stocker FCM token dans `profiles.fcm_token`
- [ ] Créer Edge Function `send-push`
  - [ ] Recevoir user_id, title, body
  - [ ] Envoyer via FCM API
- [ ] Déclencher sur événements
  - [ ] Nouvelle alerte compatible
  - [ ] Rappel RDV (J-1)

---

### Jour 3 - Validation RDV (Admin)

#### Tâche 4.3 : Gestion RDV Centre
**👤 Assignés** : **Pair A + Solo Review** — Nathanaël, Assia & Béni (review)
**🎯 Objectif** : Permettre aux centres de confirmer/annuler les RDV

**Checklist** :
- [ ] Créer `src/app/(dashboard)/appointments/page.tsx`
  - [ ] Liste tous les RDV du centre
  - [ ] Filtres : aujourd'hui, cette semaine, tous
  - [ ] Filtre : pending, confirmed, cancelled
- [ ] Card RDV détaillée
  - [ ] Nom donneur, groupe sanguin, téléphone
  - [ ] Date, heure
  - [ ] Boutons : Confirmer, Annuler, Marquer présent
- [ ] Actions
  - [ ] Confirmer → status `confirmed`
  - [ ] Annuler → status `cancelled` + notif donneur
  - [ ] Présent → créer entrée dans `donations`

---

## Semaine 5 : Dons & Validation

### Jour 1 - QR Code & Scan

#### Tâche 5.1 : Génération QR Code
**👤 Assignés** : **Pair A** — Fatoumata 🤝 Béni
**🎯 Objectif** : Générer un QR code pour valider le don sur place

**Checklist** :
- [ ] Installer `react-native-qrcode-svg`
- [ ] Créer écran QR dans le profil
  - [ ] "Montrer ce QR au centre"
  - [ ] Encoded : user_id + timestamp
  - [ ] Refresh toutes les 30 secondes
- [ ] Créer page scan admin
  - [ ] `src/app/(dashboard)/scan/page.tsx`
  - [ ] Interface caméra (qr-scanner)
  - [ ] Détection QR code
- [ ] Validation
  - [ ] Décoder user_id
  - [ ] Vérifier RDV confirmé aujourd'hui
  - [ ] Créer entrée `donations` avec status `pending`

---

### Jour 2 - Validation Don & Stats

#### Tâche 5.2 : Validation & Dashboard
**👤 Assignés** : **Pair B** — Assia 🤝 Souhaila
**🎯 Objectif** : Valider le don et voir les statistiques

**Checklist partie 1 - Validation** :
- [ ] Page validation admin
  - [ ] Liste des dons en attente
  - [ ] Card : donneur, date, volume
  - [ ] Bouton "Valider le don"
  - [ ] Champ notes optionnel
- [ ] Mise à jour Supabase
  - [ ] Status `validated`
  - [ ] `validated_by`, `validated_at`
  - [ ] Trigger MAJ `next_donation_date` (+56 jours)
- [ ] Notification donneur
  - [ ] "Votre don a été validé, merci !"

**Checklist partie 2 - Stats Donneur** :
- [ ] Page stats dans profil mobile
  - [ ] Total dons effectués
  - [ ] Dates des derniers dons
  - [ ] Prochaine date possible
  - [ ] Badge "Héros du sang" (si 5+ dons)

---

### Jour 3 - Admin Dashboard & Rapports

#### Tâche 5.3 : Dashboard Stats Admin
**👤 Assignés** : **Pair A + Solo Review** — Fatoumata, Béni & Nathanaël (review)
**🎯 Objectif** : Dashboard complet pour les super admins

**Checklist** :
- [ ] Créer `src/app/(dashboard)/stats/page.tsx`
  - [ ] KPIs : total donneurs, dons ce mois, centres actifs
  - [ ] Graphique dons par mois (recharts)
  - [ ] Top 5 centres par nombre de dons
  - [ ] Répartition groupes sanguins (pie chart)
- [ ] Edge Function `admin-stats`
  - [ ] Agréger données sur période
  - [ ] Retourner pour graphiques
- [ ] Export données
  - [ ] Bouton "Exporter CSV"
  - [ ] Liste des dons filtrable par date

---

## Semaine 6 : Tests, Polish & Déploiement

### Jour 1 - Tests & Corrections

#### Tâche 6.1 : Tests End-to-End
**👤 Assignés** : **Toute l'équipe** — Assia + Souhaila + Fatoumata + Béni + Nathanaël
**🎯 Objectif** : Tester tout le flux et corriger les bugs

**Checklist** :
- [ ] Créer scénarios de test
  - [ ] Inscription → Login → Voir profil
  - [ ] Prendre RDV → Confirmer → Valider don
  - [ ] Créer alerte → Recevoir notif → Réserver
- [ ] Tester sur vrais téléphones
  - [ ] Android
  - [ ] iOS (si possible)
- [ ] Tester l'admin web
  - [ ] Sur Chrome, Firefox, Safari
  - [ ] Responsive (mobile, tablette, desktop)
- [ ] Liste des bugs
  - [ ] Prioriser : bloquant, majeur, mineur
  - [ ] Assigner les corrections

---

### Jour 2 - Polish UI/UX

#### Tâche 6.2 : Améliorations Interface
**👤 Assignés** : **Toute l'équipe** — Pair A + Pair B ensemble
**🎯 Objectif** : Rendre l'app belle et fluide

**Checklist** :
- [ ] Animations
  - [ ] Transition entre écrans
  - [ ] Loading skeletons
  - [ ] Pull to refresh
- [ ] Design System
  - [ ] Couleurs cohérentes partout
  - [ ] Typographie harmonieuse
  - [ ] Espacements réguliers
- [ ] Messages d'erreur utilisateurs
  - [ ] Pas de "Error 500"
  - [ ] "Impossible de se connecter, vérifiez internet"
- [ ] Écrans vides
  - [ ] "Aucun RDV à venir" avec illustration
  - [ ] "Aucune alerte active"

---

### Jour 3 - Déploiement

#### Tâche 6.3 : Mise en Production
**👤 Assignés** : **Toute l'équipe** — Assia + Souhaila + Fatoumata + Béni + Nathanaël
**🎯 Objectif** : Déployer l'app pour les utilisateurs réels

**Checklist Mobile** :
- [ ] Build production
  - [ ] `eas build --platform android`
  - [ ] Tester APK sur plusieurs téléphones
- [ ] Préparer store
  - [ ] Screenshots pour Play Store
  - [ ] Description app
  - [ ] Icône haute résolution
- [ ] Soumettre (si compte dev prêt)

**Checklist Admin Web** :
- [ ] Build Next.js
  - [ ] `next build`
- [ ] Déployer Vercel
  - [ ] Connecter repo GitHub
  - [ ] Variables d'environnement
- [ ] Vérifier production
  - [ ] Login fonctionne
  - [ ] Toutes les pages chargent

**Documentation finale** :
- [ ] Mettre à jour README.md
- [ ] Documenter le flux pour les centres
- [ ] Créer guide utilisateur donneur

---

## Règles de Travail

### Daily Standup (15 min)
Chaque jour de travail, répondre à :
1. Qu'est-ce que j'ai fait hier ?
2. Qu'est-ce que je fais aujourd'hui ?
3. Est-ce que j'ai un blocage ?

### Pair Programming
- 2 personnes sur la même tâche
- Un "driver" (code), un "navigator" (guide)
- Changer toutes les 30 minutes
- Partager un écran (Discord, Teams, etc.)

### Revue de Code
- Avant de merger, une 3ème personne review
- Vérifier : fonctionne, propre, compréhensible
- Utiliser le template de PR dans `GUIDE_BONNES_PRATIQUES.md`

### Git Workflow
```
pre-prod (branch principale)
  └── feature/login-mobile (branche temporaire)
        └── PR → merge dans pre-prod
```

---

## Annexes

### Outils de Communication Recommandés
- **Discord/Slack** : Chat rapide, partage d'écran
- **Google Meet/Zoom** : Calls pair programming
- **Loom** : Enregistrer des vidéos explicatives
- **Figma** : Maquettes UI (si besoin)

### Quand demander de l'aide ?
- Bloqué depuis plus de 30 minutes ? → Demander à ton pair
- Pair aussi bloqué ? → Demander à une 3ème personne
- Toujours bloqué ? → Recherche Google + Stack Overflow
- Demander au prof ? → En dernier recours, avec questions précises

### Checklist Avant de Committer
- [ ] Le code fonctionne sur ma machine
- [ ] J'ai testé manuellement la feature
- [ ] Pas de `console.log` oubliés
- [ ] Code commenté si complexe
- [ ] Nom de commit explicite : "Add login screen with email validation"

---

*Dernière mise à jour : Avril 2026*
