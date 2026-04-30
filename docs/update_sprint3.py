"""
Liste et met à jour les tâches Sprint 3 BloodLink dans ClickUp
"""
import requests
import json

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

# Sprint 3 list ID
SPRINT3_LIST_ID = '901523014221'

def get_tasks(list_id):
    r = requests.get(f'https://api.clickup.com/api/v2/list/{list_id}/task', headers=headers)
    if r.status_code == 200:
        return r.json().get('tasks', [])
    print(f"Erreur: {r.status_code} - {r.text}")
    return []

def update_task_status(task_id, status):
    url = f'https://api.clickup.com/api/v2/task/{task_id}'
    data = {'status': status}
    r = requests.put(url, headers=headers, json=data)
    return r.status_code in [200, 201, 204]

# Récupérer les tâches Sprint 3
tasks = get_tasks(SPRINT3_LIST_ID)
print(f"\n📋 Sprint 3 - {len(tasks)} tâche(s):")
print("=" * 80)
for t in tasks:
    print(f"  ID: {t['id']}")
    print(f"  Nom: {t['name']}")
    print(f"  Statut: {t['status']['status']}")
    print("-" * 80)

# Tâches à mettre à jour suite au travail effectué sur la map
# Carte mobile + seed data + intégration Supabase
UPDATES = {
    # Tâches liées à la carte mobile - passer en "in progress" ou "done"
}

# Chercher les tâches qui correspondent au travail fait
map_keywords = ['carte', 'map', 'marqueur', 'marker', 'alerte', 'centre', 'localisation', 'géoloc']
for t in tasks:
    name_lower = t['name'].lower()
    desc_lower = (t.get('description') or '').lower()
    current_status = t['status']['status']
    
    is_map_related = any(kw in name_lower or kw in desc_lower for kw in map_keywords)
    
    if is_map_related:
        print(f"\n🎯 Tâche map trouvée: {t['name']}")
        print(f"   Statut actuel: {current_status}")
        
        # Déterminer le nouveau statut
        if current_status not in ['done', 'closed']:
            if any(kw in name_lower for kw in ['carte', 'map', 'intégration']):
                new_status = 'in progress'
                if 'seed' in name_lower or 'donnée' in name_lower:
                    new_status = 'done'
                print(f"   → Nouveau statut: {new_status}")
                UPDATES[t['id']] = new_status
            elif any(kw in name_lower for kw in ['marqueur', 'marker', 'alerte']):
                new_status = 'in progress'
                print(f"   → Nouveau statut: {new_status}")
                UPDATES[t['id']] = new_status

print(f"\n📋 Résumé des mises à jour prévues: {len(UPDATES)}")
for task_id, status in UPDATES.items():
    task_name = next((t['name'] for t in tasks if t['id'] == task_id), '???')
    print(f"  {task_name[:50]} → {status}")

# Exécuter les mises à jour
if UPDATES:
    print(f"\n🔄 Application des mises à jour...")
    for task_id, new_status in UPDATES.items():
        task_name = next((t['name'] for t in tasks if t['id'] == task_id), '???')
        success = update_task_status(task_id, new_status)
        if success:
            print(f"  ✅ {task_name[:50]} → {new_status}")
        else:
            print(f"  ❌ Échec: {task_name[:50]}")
else:
    print("\n⚠️ Aucune mise à jour automatique détectée.")
    print("Affichez les tâches ci-dessus pour mise à jour manuelle.")
