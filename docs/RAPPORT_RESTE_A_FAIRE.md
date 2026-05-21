# BloodLink — Rapport : Ce qui reste à faire

> **Date** : 5 mai 2026  
> **Avancement global estimé** : ~85%  
> **Réalisé** : Auth, Profils, Carte, RDV, Notifications Push, Dashboard Admin, Gestion Alertes/Dons/Centres  
> **Manquant** : QR Code, Trigger +56j, Edge Function `get-nearby-centers`, Export CSV, Build & Déploiement

---

## 🔴 CRITIQUE — Bloquant pour une démo fonctionnelle

### 1. QR Code — Validation des dons sur place (Sprint 5)

Le cahier des charges exige un QR code pour la validation des dons sur place.  
**État actuel : rien n'existe.**

| Cible | Où le créer | Description |
|-------|-------------|-------------|
| Génération QR (mobile) | `mobile_app/app/my-qr.tsx` | Écran "Mon QR" utilisant `react-native-qrcode-svg` qui génère un QR depuis l'`user.id` |
| Scan QR (admin web) | `admin_web/src/app/admin/scan-qr/page.tsx` | Page avec accès caméra + bibliothèque `jsQR` pour décoder |
| Vérification backend | `supabase/functions/verify-donation-qr/index.ts` | Edge Function qui valide le QR, crée le don et retourne le statut |

**Stack suggérée :**
- Mobile : `react-native-qrcode-svg` + encodage JSON `{donor_id, timestamp}`
- Admin web : `react-zxing` ou `html5-qrcode` pour le scan
- Backend : vérification signature/timestamp pour éviter les faux QR

---

### 2. Trigger SQL — Next donation date auto (Sprint 5)

Quand un don passe au statut `validated`, le champ `profiles.next_donation_date` doit être automatiquement mis à jour à **J+56**.

| État |
|------|
| ❌ Aucun trigger PostgreSQL dans les migrations |
| ❌ Aucune edge function alternative |

**Ce qu'il faut créer :**  
`supabase/migrations/00005_auto_next_donation_date.sql`

```sql
CREATE OR REPLACE FUNCTION update_next_donation_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
    UPDATE profiles
    SET next_donation_date = (NEW.donation_date::date + INTERVAL '56 days')::timestamptz
    WHERE id = NEW.donor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_next_donation_date
AFTER UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_next_donation_date();
```

---

### 3. Firebase — `google-services.json` pour Push Android (Sprint 4)

Le build Android échoue sans le fichier Firebase. Les notifications push fonctionnent en mode Expo Go mais pas en production.

| Manque | Localisation attendue |
|--------|----------------------|
| `google-services.json` | `mobile_app/android/app/google-services.json` |
| Plugin Firebase dans `app.json` | `mobile_app/app.json` : `"android": { "googleServicesFile": "..." }` |

**Action requise :** Générer le fichier depuis la console Firebase (projet BloodLink) et le placer dans le repo.

---

## 🟡 IMPORTANT — Fonctionnalités métier manquantes

### 4. Edge Function `get-nearby-centers` (Sprint 3)

La carte mobile affiche les centres mais **sans calcul de distance** ni tri par proximité. L'utilisateur ne voit pas "À 2.3 km".

| Existant | Manquant |
|----------|----------|
| `MapScreen.native.tsx` affiche les marqueurs | Pas de tri par distance GPS |
| Centres chargés depuis `supabase.from("centers")` | Pas de filtre par rayon (km) |

**Ce qu'il faut créer :**  
`supabase/functions/get-nearby-centers/index.ts`

```typescript
// Paramètres : lat, lng, radius_km (défaut 20)
// Retourne les centres triés par distance Haversine
// Ajoute un champ calculé : distance_km
```

**Formule Haversine (SQL) :**
```sql
SELECT *, (
  6371 * acos(
    cos(radians($1)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians($2)) +
    sin(radians($1)) * sin(radians(latitude))
  )
) AS distance_km
FROM centers
WHERE is_active = true
HAVING distance_km <= $3
ORDER BY distance_km;
```

---

### 5. Déclencheurs push automatiques (Sprint 4)

**État actuel : Partiellement fait (Déclencheur d'alertes OK, Rappel J-1 à faire).**

| Existant | Manquant |
|----------|----------|
| ✅ Webhook trigger SQL + Edge Function `send-push` pour les nouvelles alertes | ❌ Rappel J-1 automatique avant un RDV |
| ✅ Notifications locales système + WebSocket Realtime en premier plan | ❌ Planification Cron quotidienne (pg_cron) |

**Détail de l'automatisation réalisée :**
- **Nouvelle alerte** : Un trigger SQL `AFTER INSERT` sur `alerts` exécute la fonction `handle_alert_insert_webhook` qui appelle l'Edge Function Deno `send-push` de manière asynchrone via l'extension `pg_net`.
- **Matching & Filtrage** : L'Edge Function utilise le RPC `get_compatible_donors_for_alert` pour trouver les donneurs actifs, compatibles (selon la matrice ABO/Rh), éligibles (délai de carence respecté) et situés dans le rayon de l'alerte (formule géodésique de Haversine).
- **Notification multicanale** : Elle crée en bloc (Bulk Insert) des notifications in-app dans `public.notifications` et transmet les notifications push par lots de 100 à l'API Expo Push.

---

### 6. Badge "Héros du sang" (Sprint 5)

Le profil affiche le nombre de dons mais **aucun badge visuel** si le donneur a 5+ dons validés.

| Existant | Manquant |
|----------|----------|
| `profile.tsx` affiche "X dons validés" | Pas de badge/spécial visuel si >= 5 dons |

**Suggestion :** Ajouter dans le dashboard mobile :
- Badge doré "Héros du sang" si `donation_count >= 5`
- Autres paliers : "Premier pas" (1), "Régulier" (3), "Héros" (5), "Légende" (10)

---

### 7. Export CSV (Sprint 5)

L'admin web affiche toutes les données mais **aucun bouton d'export** n'existe.

| Pages concernées | Manque |
|-----------------|--------|
| `/admin/donations` | Pas d'export CSV des dons |
| `/admin/appointments` | Pas d'export CSV des RDV |
| `/admin/profiles` | Pas d'export CSV des donneurs |

**Implémentation simple côté client :**
```typescript
const csvContent = convertToCSV(data);
const blob = new Blob([csvContent], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'dons_2026-05-05.csv';
a.click();
```

---

### 8. Store global Zustand (Sprint 1) — Optionnel

L'app mobile utilise un hook React (`hooks/useAuth.ts`) au lieu de Zustand comme prévu dans le cahier des charges.

| Existant | Manquant |
|----------|----------|
| `useAuth.ts` — hook simple avec `useState` | Pas de store global réactif avec Zustand |

**Impact :** Limité. Le hook fonctionne. La migration vers Zustand serait un refactor de polish, pas bloquant.

---

## 🟢 POLISH & DÉPLOIEMENT (Sprint 6)

### 9. Tests End-to-End

| Type | État |
|------|------|
| Tests unitaires | ❌ Aucun |
| Tests E2E (Playwright/Cypress) | ❌ Aucun |
| Tests sur vrai téléphone Android | ❌ Non fait |
| Tests sur iOS | ❌ Non fait |

**Scénarios E2E critiques à tester :**
1. Inscription → Email OTP → Compléter profil → Carte → Prise RDV → Recevoir push
2. Admin : Login → Créer alerte → Voir RDV → Valider don → Stats mises à jour
3. QR Code : Mobile génère QR → Admin scanne → Don validé automatiquement

---

### 10. Build & Déploiement

| Cible | État |
|-------|------|
| Build Android (`eas build`) | ❌ Bloqué par Firebase |
| Build iOS (`eas build`) | ❌ Non tenté |
| Play Store | ❌ Pas de compte/accès |
| Admin web sur Vercel | ❌ Non déployé |
| Variables d'environnement prod | ❌ Non configurées |

**Variables à configurer pour prod :**
```
# mobile_app
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# admin_web
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 📊 RÉCAPITULATIF PAR PROJET

| Projet | % Fait | % Reste | Tâches clés restantes |
|--------|--------|---------|----------------------|
| **Mobile App** | ~93% | 7% | QR Code, distance centres, badge 5+, build Android |
| **Admin & Center Web** | ~87% | 13% | Scan QR, export CSV, déploiement Vercel |
| **Supabase Backend** | ~95% | 5% | Trigger +56j, edge function `get-nearby-centers`, cron push (rappel J-1) |
| **Global** | **~91%** | **9%** | **QR Code = seul vrai bloquant restant** |

---

## 🎯 Ordre de priorité recommandé

Pour une **démo complète et fonctionnelle** :

| Priorité | Tâche | Temps estimé | Impact |
|----------|-------|--------------|--------|
| 1 | **QR Code** (génération + scan + vérification) | 2-3h | 🔴 Bloquant |
| 2 | **Trigger SQL +56 jours** | 30 min | 🟡 Important |
| 3 | **Edge Function `get-nearby-centers`** | 1h | 🟡 Important |
| 4 | **Firebase config Android** | 30 min | 🔴 Bloquant build |
| 5 | **Export CSV (admin)** | 1h | 🟡 Fonctionnel |
| 6 | **Rappels push auto (cron J-1)** | 1h30 | 🟡 UX |
| 7 | **Badge "Héros du sang"** | 30 min | 🟢 Polish |
| 8 | **Tests E2E** | 4h+ | 🟢 Qualité |
| 9 | **Build & Déploiement** | 2h | 🟢 Livraison |

---

## ✅ CE QUI EST DÉJÀ FAIT (Pour mémoire)

### Mobile App (React Native + Expo)
- ✅ Auth (login, register, OTP)
- ✅ Double flux d'authentification : OTP + Google Sign-In avec gestion de callback personnalisée (PKCE & Implicit Flow)
- ✅ Typographie Outfit intégrée de manière experte via injection dynamique sur les composants de texte natifs
- ✅ Profil complet avec photo (image-picker + Storage)
- ✅ Carte Google Maps optimisée avec liste de chips de filtres horizontaux et feedback haptique
- ✅ Prise de RDV (calendrier + créneaux)
- ✅ Liste et détail des RDV
- ✅ Notifications push et notifications locales système via `expo-notifications` (fonctionnelles sans dépendance obligatoire aux clés FCM lors des tests Expo Go)
- ✅ Synchronisation en temps réel (Supabase Realtime) avec gestion automatique de la reconnexion du WebSocket lors du retour de l'application au premier plan (AppState)
- ✅ Résolution définitive des boucles de redirection infinie sur les notifications
- ✅ Écran alertes (création, liste)
- ✅ Dashboard avec stats donneur
- ✅ Deep links et gestion de redirection au clic sur push notification (app lancée ou fermée)

### Admin & Center Web (Next.js 15/16)
- ✅ Login avec rôles (super_admin, center_admin)
- ✅ Sécurisation du portail Centre (`center_web`) : Accès restreint strictement aux comptes `center_admin`. Middleware robuste de déconnexion automatique (`supabase.auth.signOut()`) et de redirection propre via middleware pour tout autre rôle (super_admin, donneur).
- ✅ Résolution des erreurs de compilation ESLint et de linting sur `middleware.ts`.
- ✅ Dashboard avec KPIs + graphiques (barres, camembert)
- ✅ Gestion des alertes (CRUD + filtres)
- ✅ Gestion des RDV (changement de statut)
- ✅ Gestion des dons (création depuis RDV + validation)
- ✅ Gestion des centres (CRUD)
- ✅ Liste des donneurs / profils
- ✅ Notifications (liste + marquer comme lu)
- ✅ Statistiques avancées
- ✅ Sidebar responsive + Protected routes

### Supabase Backend
- ✅ Schema initial (profiles, centers, appointments, donations, alerts, notifications)
- ✅ Seed : 6 centres Rabat + centres réels
- ✅ Table sécurisée `public.app_settings` (RLS activé) pour conserver le secret de webhook
- ✅ Automatisation asynchrone : Déclencheur SQL `trg_alert_insert_webhook` après insertion d'une alerte, appelant l'Edge Function Deno `send-push` via `pg_net`
- ✅ Fonctions de calcul géodésique `calculate_distance` (Haversine) et de compatibilité des groupes sanguins `check_blood_compatibility` en SQL
- ✅ RPC `get_compatible_donors_for_alert` optimisé pour la sélection géographique et biologique des donneurs
- ✅ Edge Function `send-push` : Traitement, bulk insert des notifications in-app et envoi groupé par lots de 100 à l'API Expo Push
- ✅ Configuration de la réplication de base de données `REPLICA IDENTITY FULL` sur la table `notifications` pour Supabase Realtime
- ✅ Edge Function `send-test-push`
- ✅ Edge Function `create-center-account`
- ✅ Vue `alerts_with_center`

---

*Document généré automatiquement à partir de l'analyse complète de la codebase.*
