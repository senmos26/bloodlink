# Tâches à copier dans ClickUp — BLOOD Link

> Copie chaque tâche dans ClickUp BLOOD Link. Crée d'abord une List "BloodLink Sprints".

---

## Sprint 1 : Auth & Setup (Semaine 1)

### Tâche 1.1 : Setup Environnement (Tous ensemble)
- **Assignés** : Assia, Souhaila, Fatoumata, Béni, Nathanaël
- **Status** : TO DO
- **Description** : Tout le monde a le projet qui fonctionne sur sa machine
- **Checklist** :
  - [ ] Cloner le repo GitHub (`pre-prod` branch)
  - [ ] Installer Node.js 18+ sur chaque machine
  - [ ] Installer Expo Go sur les téléphones
  - [ ] Lancer `npm install` dans `mobile/`
  - [ ] Lancer `npm install` dans `admin_web/`
  - [ ] Créer `.env.local` avec les clés Supabase
  - [ ] Vérifier que l'app mobile démarre (`npm start`)
  - [ ] Vérifier que l'admin web démarre (`npm run dev`)
- **Durée** : 1 journée
- **Ressources** : Voir `docs/GUIDE_INSTALLATION.md`

### Tâche 1.2 : Écrans Login/Register Mobile
- **Assignés** : Assia, Souhaila (Pair A)
- **Status** : TO DO
- **Description** : Interface utilisateur pour se connecter et s'inscrire
- **Checklist** :
  - [ ] Créer `src/app/auth/login.tsx`
  - [ ] Créer `src/app/auth/register.tsx`
  - [ ] Champ email avec validation
  - [ ] Champ mot de passe (masqué)
  - [ ] Sélecteur groupe sanguin
  - [ ] Date de naissance
  - [ ] Ajouter la navigation entre les deux écrans
  - [ ] Tester sur Expo Go
- **Durée** : 1 journée

### Tâche 1.3 : Connecter Supabase Auth
- **Assignés** : Béni, Nathanaël (Pair B)
- **Status** : TO DO
- **Description** : Le login/register fonctionne vraiment avec Supabase
- **Checklist** :
  - [ ] Installer `@supabase/supabase-js` dans mobile
  - [ ] Créer `src/services/supabase.ts`
  - [ ] Implémenter `signUp()` dans register
  - [ ] Implémenter `signIn()` dans login
  - [ ] Créer un store Zustand pour l'état auth
- **Durée** : 1 journée

### Tâche 1.4 : Page Login Admin Web
- **Assignés** : Fatoumata Sidibé (Solo Review)
- **Status** : TO DO
- **Description** : Page de connexion pour le dashboard admin web
- **Checklist** :
  - [ ] Créer `src/app/auth/login/page.tsx`
  - [ ] Formulaire email + password
  - [ ] Connexion Supabase Auth
  - [ ] Redirection après login
  - [ ] Ajouter middleware pour protéger les routes
- **Durée** : 1 journée

---

## Sprint 2 : Profils (Semaine 2)

### Tâche 2.1 : Écran Profil Mobile
- **Assignés** : Assia, Nathanaël (Pair A)
- **Status** : TO DO
- **Description** : Permettre au donneur de voir et modifier son profil
- **Checklist** :
  - [ ] Créer `src/app/tabs/profile.tsx`
  - [ ] Afficher nom, email, téléphone, groupe sanguin
  - [ ] Afficher prochaine date de don possible
  - [ ] Créer modal/écran d'édition
  - [ ] Connecter à Supabase (select/update profiles)
- **Durée** : 1 journée

### Tâche 2.2 : Photo de Profil
- **Assignés** : Souhaila, Fatoumata (Pair B)
- **Status** : TO DO
- **Description** : Permettre l'upload d'une photo de profil
- **Checklist** :
  - [ ] Configurer Storage Supabase (bucket `avatars`)
  - [ ] Installer `expo-image-picker`
  - [ ] Implémenter sélection photo
  - [ ] Uploader vers Supabase Storage
  - [ ] Afficher la photo dans le profil
- **Durée** : 1 journée

### Tâche 2.3 : Dashboard Centre Web
- **Assignés** : Assia, Nathanaël + Béni (review)
- **Status** : TO DO
- **Description** : Page d'accueil pour les admin de centre
- **Checklist** :
  - [ ] Créer `src/app/(dashboard)/center/page.tsx`
  - [ ] Afficher infos du centre connecté
  - [ ] Statistiques : total dons, dons ce mois
  - [ ] Liste des 5 derniers dons
  - [ ] Sidebar navigation + Header
- **Durée** : 1 journée

---

## Sprint 3 : Carte & Alertes (Semaine 3)

### Tâche 3.1 : Intégration Carte Mobile
- **Assignés** : Souhaila, Béni (Pair A)
- **Status** : TO DO
- **Description** : Afficher une carte avec les centres de transfusion
- **Checklist** :
  - [ ] Installer `react-native-maps`
  - [ ] Configurer clé API Google Maps
  - [ ] Créer `src/app/tabs/map.tsx`
  - [ ] Afficher carte centrée sur position actuelle
  - [ ] Récupérer position GPS (expo-location)
- **Durée** : 1 journée

### Tâche 3.2 : Afficher Centres sur Carte
- **Assignés** : Fatoumata, Nathanaël (Pair B)
- **Status** : TO DO
- **Description** : Récupérer et afficher les centres comme marqueurs
- **Checklist** :
  - [ ] Créer Edge Function `get-nearby-centers`
  - [ ] Appeler depuis la carte
  - [ ] Afficher marqueurs personnalisés (icône goutte de sang)
  - [ ] Popup au clic : nom, adresse, bouton "Voir"
- **Durée** : 1 journée

### Tâche 3.3 : Formulaire Création Alerte
- **Assignés** : Souhaila, Béni + Assia (review)
- **Status** : TO DO
- **Description** : Permettre aux centres de créer des alertes de pénurie
- **Checklist** :
  - [ ] Créer `src/app/(dashboard)/alerts/new/page.tsx`
  - [ ] Sélecteur groupe sanguin, urgence, rayon
  - [ ] Date d'expiration, message
  - [ ] Validation formulaire
  - [ ] Insertion Supabase
- **Durée** : 1 journée

---

## Sprint 4 : Rendez-vous & Notifications (Semaine 4)

### Tâche 4.1 : Écran Prise RDV Mobile
- **Assignés** : Nathanaël, Assia (Pair A)
- **Status** : TO DO
- **Description** : Permettre à un donneur de prendre rendez-vous
- **Checklist** :
  - [ ] Créer `src/app/appointment/new.tsx`
  - [ ] Sélecteur centre (liste ou carte)
  - [ ] Calendrier date picker + créneaux
  - [ ] Vérifier éligibilité (next_donation_date)
  - [ ] Insertion Supabase (status `pending`)
- **Durée** : 1 journée

### Tâche 4.2 : Liste RDV & Notifications Push
- **Assignés** : Souhaila, Fatoumata (Pair B)
- **Status** : TO DO
- **Description** : Voir ses RDV et recevoir des notifications
- **Checklist** :
  - [ ] Créer `src/app/tabs/appointments.tsx`
  - [ ] Liste des RDV avec statuts colorés
  - [ ] Configurer FCM (Firebase Cloud Messaging)
  - [ ] Installer `expo-notifications`
  - [ ] Créer Edge Function `send-push`
- **Durée** : 1 journée

### Tâche 4.3 : Gestion RDV Centre (Admin)
- **Assignés** : Nathanaël, Assia + Béni (review)
- **Status** : TO DO
- **Description** : Permettre aux centres de confirmer/annuler les RDV
- **Checklist** :
  - [ ] Créer `src/app/(dashboard)/appointments/page.tsx`
  - [ ] Liste tous les RDV du centre avec filtres
  - [ ] Card RDV détaillée (donneur, groupe, téléphone)
  - [ ] Boutons : Confirmer, Annuler, Marquer présent
  - [ ] Créer entrée `donations` si présent
- **Durée** : 1 journée

---

## Sprint 5 : Dons & Validation (Semaine 5)

### Tâche 5.1 : Génération QR Code
- **Assignés** : Fatoumata, Béni (Pair A)
- **Status** : TO DO
- **Description** : Générer un QR code pour valider le don sur place
- **Checklist** :
  - [ ] Installer `react-native-qrcode-svg`
  - [ ] Créer écran QR dans le profil (refresh 30s)
  - [ ] Créer page scan admin (interface caméra)
  - [ ] Décoder user_id, vérifier RDV confirmé
  - [ ] Créer entrée `donations` (status `pending`)
- **Durée** : 1 journée

### Tâche 5.2 : Validation Don & Stats
- **Assignés** : Assia, Souhaila (Pair B)
- **Status** : TO DO
- **Description** : Valider le don et voir les statistiques
- **Checklist** :
  - [ ] Page validation admin (dons en attente)
  - [ ] Bouton "Valider le don" + notes
  - [ ] Mise à jour Supabase (status `validated`)
  - [ ] Trigger MAJ `next_donation_date` (+56 jours)
  - [ ] Stats donneur (total dons, badge "Héros")
- **Durée** : 1 journée

### Tâche 5.3 : Dashboard Stats Admin
- **Assignés** : Fatoumata, Béni + Nathanaël (review)
- **Status** : TO DO
- **Description** : Dashboard complet pour les super admins
- **Checklist** :
  - [ ] Créer `src/app/(dashboard)/stats/page.tsx`
  - [ ] KPIs : total donneurs, dons ce mois, centres actifs
  - [ ] Graphique dons par mois (recharts)
  - [ ] Edge Function `admin-stats`
  - [ ] Export CSV
- **Durée** : 1 journée

---

## Sprint 6 : Tests, Polish & Déploiement (Semaine 6)

### Tâche 6.1 : Tests End-to-End
- **Assignés** : Toute l'équipe
- **Status** : TO DO
- **Description** : Tester tout le flux et corriger les bugs
- **Checklist** :
  - [ ] Scénario : Inscription → Login → Voir profil
  - [ ] Scénario : Prendre RDV → Confirmer → Valider don
  - [ ] Scénario : Créer alerte → Recevoir notif → Réserver
  - [ ] Tester sur vrais téléphones (Android + iOS)
  - [ ] Tester admin web (Chrome, Firefox, Safari)
  - [ ] Liste des bugs + priorités
- **Durée** : 1 journée

### Tâche 6.2 : Polish UI/UX
- **Assignés** : Toute l'équipe
- **Status** : TO DO
- **Description** : Rendre l'app belle et fluide
- **Checklist** :
  - [ ] Animations transitions entre écrans
  - [ ] Loading skeletons + Pull to refresh
  - [ ] Design System (couleurs, typo, espacements)
  - [ ] Messages d'erreur utilisateurs (pas "Error 500")
  - [ ] Écrans vides avec illustrations
- **Durée** : 1 journée

### Tâche 6.3 : Mise en Production
- **Assignés** : Toute l'équipe
- **Status** : TO DO
- **Description** : Déployer l'app pour les utilisateurs réels
- **Checklist** :
  - [ ] Build Android APK (`eas build`)
  - [ ] Screenshots Play Store
  - [ ] Build Next.js + déployer Vercel
  - [ ] Vérifier production (login, pages)
  - [ ] Mettre à jour README.md
  - [ ] Créer guide utilisateur donneur
- **Durée** : 1 journée

---

*Total : 18 tâches sur 6 semaines (3 jours/semaine)*
