"""
Met à jour les statuts ClickUp selon la réalité du codebase BloodLink.

Analyse du code vs ClickUp (14 mai 2025):
- Sprint 3 formulaire alerte: FAIT (center_web AlertsPage + actions + hooks)
- Sprint 4 gérer RDV admin: FAIT (admin_web AppointmentsPage + actions)
- Sprint 5 dashboard stats: FAIT (admin_web StatisticsPage + DashboardClient avec recharts)
- Sprint 5 QR code validation: FAIT (ScanDonationQR + Edge Function verify-donation-qr)
- Sprint 5 valider don + stats: FAIT (inclus dans la validation QR)
- Sprint 6 tests E2E: PAS FAIT
- Sprint 6 UI/UX polish: EN COURS
"""
import requests
import sys

TOKEN = 'pk_62609552_W0VHYV65R3DEGPFPGDKN3XIJAFHOI2DF'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

# Mapping des tâches avec leur statut réel dans le code
# Format: task_id: (nouveau_statut, commentaire)
TASK_UPDATES = {
    # Sprint 3 - Formulaire création alerte (FAIT)
    '86c9gt1hr': ('complete', '✅ FAIT: \n'
                 '- center_web: AlertsPage.tsx complet (361 lignes)\n'
                 '- Formulaire création avec CreateAlertSchema (zod)\n'
                 '- useCreateAlert, useCloseAlert, useEscalateAlert hooks\n'
                 '- Filtres par statut/groupe/urgence/recherche\n'
                 '- Actions serveur: createAlert, closeAlert, escalateAlert\n'
                 '- Stats dashboard: useAlertStats\n'
                 '- Mobile: Formulaire alerte + partage aussi fait'),
    
    # Sprint 4 - Gérer RDV côté centre admin (FAIT)
    '86c9gt1j4': ('complete', '✅ FAIT: \n'
                  '- admin_web: AppointmentsPage.tsx (314 lignes)\n'
                  '- DataTable avec colonnes date/donneur/statut/actions\n'
                  '- Transitions de statut: pending→confirmed→completed/cancelled\n'
                  '- FilterBar + Pagination + DetailsDrawer\n'
                  '- Actions: updateAppointmentStatus, createDonationFromAppointment\n'
                  '- API route /api/admin/appointments/status'),
    
    # Sprint 5 - Dashboard stats admin (FAIT)
    '86c9gt1hx': ('complete', '✅ FAIT: \n'
                  '- admin_web: StatisticsPage.tsx (196 lignes)\n'
                  '- DashboardClient.tsx (380 lignes) avec KPIs\n'
                  '- PieChart répartition groupes sanguins\n'
                  '- BarChart dons mensuels\n'
                  '- LineChart tendance des dons\n'
                  '- Alertes récentes + RDV récents\n'
                  '- getDashboardStats() avec queries parallèles'),
    
    
    # Sprint 5 - QR code validation don (FAIT)
    '86c9gt1hg': ('complete', '✅ FAIT: \n'
                  '- center_web: ScanDonationQR.tsx (457 lignes)\n'
                  '- Scanner caméra avec jsQR + overlay visuel\n'
                  '- Mode saisie manuelle (fallback)\n'
                  '- Edge Function verify-donation-qr (329 lignes)\n'
                  '- Vérifications: timestamp <10min, donneur actif, éligibilité\n'
                  '- admin_web: page /admin/scan-qr + API route'),
    
    
    # Sprint 5 - Valider don + stats donneur (FAIT - inclus dans QR)
    '86c9gt1h8': ('complete', '✅ FAIT (inclus dans la validation QR): \n'
                  '- Validation don automatique après scan QR\n'
                  '- Mise à jour next_donation_date (+56 jours)\n'
                  '- Notification envoyée au donneur\n'
                  '- center_web: page /donations/scan avec résultats\n'
                  '- admin_web: createDonationFromAppointment'),
    
    # Sprint 6 - Tests E2E (PAS FAIT)
    '86c9gt1j1': ('to do', '⏳ À FAIRE: Tests end-to-end et correction bugs'),
    
    # Sprint 6 - UI/UX Polish  
    '86c9gt1hn': ('in progress', '🔄 EN COURS: \n'
                 '- Mobile: nativewind, theming, animations OK\n'
                 '- Web: composants UI modernes (shadcn, recharts)\n'
                 '- Polish global encore nécessaire'),
}

def update_task_status(task_id, status, comment):
    """Met à jour le statut d'une tâche ClickUp"""
    url = f'https://api.clickup.com/api/v2/task/{task_id}'
    
    # D'abord mettre à jour le statut
    data = {'status': status}
    r = requests.put(url, headers=headers, json=data)
    
    if r.status_code not in [200, 201]:
        print(f"  ❌ Erreur statut {task_id}: {r.status_code}")
        print(f"     {r.text[:100]}")
        return False
    
    # Ensuite ajouter un commentaire
    comment_url = f'https://api.clickup.com/api/v2/task/{task_id}/comment'
    comment_data = {
        'comment_text': f"📊 **Mise à jour auto depuis le codebase**\n\n{comment}",
        'notify_all': False
    }
    r2 = requests.post(comment_url, headers=headers, json=comment_data)
    
    if r2.status_code in [200, 201]:
        print(f"  ✅ Task {task_id} -> {status}")
        print(f"     📝 Commentaire ajouté")
        return True
    else:
        print(f"  ⚠️  Statut OK mais commentaire échoué: {r2.status_code}")
        return True

def get_task_info(task_id):
    """Récupère les infos d'une tâche"""
    url = f'https://api.clickup.com/api/v2/task/{task_id}'
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        return r.json()
    return None

def main():
    print("=" * 70)
    print("🔄 MISE À JOUR CLICKUP SELON LA RÉALITÉ DU CODE")
    print("=" * 70)
    print()
    
    # Mode simulation par défaut
    SIMULATION = True
    
    if len(sys.argv) > 1 and sys.argv[1] == '--execute':
        SIMULATION = False
        print("⚠️  MODE EXÉCUTION - Les changements seront réels!")
    else:
        print("🔒 MODE SIMULATION (ajoutez --execute pour vraiment modifier)")
    print()
    
    success_count = 0
    error_count = 0
    
    for task_id, (new_status, comment) in TASK_UPDATES.items():
        # Récupérer infos actuelles
        task_info = get_task_info(task_id)
        if not task_info:
            print(f"❌ Task {task_id} introuvable")
            error_count += 1
            continue
        
        current_status = task_info.get('status', {}).get('status', 'unknown')
        task_name = task_info.get('name', 'Unknown')
        
        print(f"\n📋 {task_name[:50]}...")
        print(f"   ID: {task_id}")
        print(f"   Actuel: {current_status} -> Proposé: {new_status}")
        
        if SIMULATION:
            print(f"   🔒 [SIMULATION] Pas de changement réel")
            success_count += 1
        else:
            if update_task_status(task_id, new_status, comment):
                success_count += 1
            else:
                error_count += 1
    
    print()
    print("=" * 70)
    if SIMULATION:
        print(f"🔒 SIMULATION TERMINÉE: {success_count} tâches analysées")
        print()
        print("Pour exécuter réellement:")
        print("  python docs/update_clickup_status.py --execute")
    else:
        print(f"✅ EXÉCUTION TERMINÉE: {success_count} succès, {error_count} erreurs")
    print("=" * 70)

if __name__ == '__main__':
    main()
