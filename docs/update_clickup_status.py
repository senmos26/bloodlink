"""
Met à jour les statuts ClickUp selon la réalité du codebase BloodLink.

Analyse du code vs ClickUp:
- Sprint 4 tâche mobile RDV+Push: DONE (fait dans le code)
- Sprint 3 formulaire alerte: DONE sur mobile (pas web)
- Sprint 5,6: Met à jour les progressions
"""
import requests
import sys

TOKEN = 'pk_62609552_W0VHYV65R3DEGPFPGDKN3XIJAFHOI2DF'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

# Mapping des tâches avec leur statut réel dans le code
# Format: task_id: (nouveau_statut, commentaire)
TASK_UPDATES = {
    # Sprint 4 - Tâche mobile RDV + Push (FAIT à 100%)
    '86c9gt1hk': ('complete', '✅ FAIT: \n'
                 '- Liste RDV avec filtres (appointments.tsx)\n'
                 '- Réservation RDV (booking.tsx)\n'
                 '- Push notifications natives (push.native.ts)\n'
                 '- Edge Function send-test-push\n'
                 '- Migration 00004_push_notification_support.sql\n'
                 '- Dashboard avec prochain RDV (index.tsx)'),
    
    # Sprint 4 - Gérer RDV côté centre (web) - PAS FAIT
    '86c9gt1j4': ('to do', '⏳ À FAIRE: Interface admin web pour gérer les rendez-vous\n'
                  'Le mobile est fait mais pas l\'admin web.'),
    
    # Sprint 3 - Formulaire création alerte
    '86c9gt1hr': ('in progress', '🔄 PARTIEL: \n'
                 '✅ Mobile: Formulaire alerte complet (alerts.tsx)\n'
                 '✅ Partage d\'alertes (share-alert.tsx)\n'
                 '✅ Service alert-sharing.ts\n'
                 '❌ Web: Pas encore implémenté côté admin'),
    
    # Sprint 5 - Dashboard stats (web)
    '86c9gt1hx': ('to do', '⏳ DÉCALAGE: Dashboard stats existe sur MOBILE (index.tsx)\n'
                  'Mais PAS sur le web admin. À implémenter côté admin.'),
    
    # Sprint 5 - QR code validation
    '86c9gt1hg': ('to do', '⏳ À FAIRE: Génération et scan QR code pour validation don'),
    
    # Sprint 5 - Valider don et stats
    '86c9gt1h8': ('to do', '⏳ À FAIRE: Validation don + mise à jour stats donneur'),
    
    # Sprint 6 - Tests E2E
    '86c9gt1j1': ('to do', '⏳ À FAIRE: Tests end-to-end'),
    
    # Sprint 6 - UI/UX Polish  
    '86c9gt1hn': ('in progress', '🔄 PARTIEL: Polish UI déjà bien avancé sur mobile\n'
                 '(nativewind, theming, animations)'),
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
