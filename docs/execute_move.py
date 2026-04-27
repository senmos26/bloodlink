"""
EXÉCUTION RÉELLE: Déplace les tâches vers les Lists Sprint
"""
import requests
import re
import time

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

SOURCE_LIST_ID = '901523010438'  # BloodLink Sprints
SPRINT_LISTS = {
    1: '901523014219',
    2: '901523014220', 
    3: '901523014221',
    4: '901523014222',
    5: '901523014223',
    6: '901523014224'
}

def get_tasks(list_id):
    r = requests.get(f'https://api.clickup.com/api/v2/list/{list_id}/task', headers=headers)
    if r.status_code == 200:
        return r.json().get('tasks', [])
    return []

def extract_sprint_from_description(description):
    if not description:
        return 1
    match = re.search(r'Sprint (\d+)', description)
    if match:
        return int(match.group(1))
    match = re.search(r'Semaine (\d+)', description)
    if match:
        return int(match.group(1))
    return 1

def create_task_in_list(list_id, name, description, assignees, status):
    url = f'https://api.clickup.com/api/v2/list/{list_id}/task'
    assignee_ids = [a['id'] for a in assignees] if assignees else []
    
    data = {
        'name': name,
        'description': description or '',
        'status': status,
        'assignees': assignee_ids
    }
    
    r = requests.post(url, headers=headers, json=data)
    if r.status_code in [200, 201]:
        return r.json()['id']
    print(f"   ❌ Erreur création: {r.status_code}")
    return None

def delete_task(task_id):
    r = requests.delete(f'https://api.clickup.com/api/v2/task/{task_id}', headers=headers)
    return r.status_code == 200

print("=" * 60)
print("🚀 EXÉCUTION: RÉPARTITION DES TÂCHES")
print("=" * 60)

tasks = get_tasks(SOURCE_LIST_ID)
print(f"\n📋 {len(tasks)} tâches à traiter\n")

total_created = 0
total_deleted = 0
total_errors = 0

for task in tasks:
    name = task['name']
    desc = task.get('description', '')
    sprint_num = extract_sprint_from_description(desc)
    target_list_id = SPRINT_LISTS.get(sprint_num)
    
    if not target_list_id:
        print(f"❌ Pas de liste pour Sprint {sprint_num}")
        total_errors += 1
        continue
    
    print(f"\n📌 {name[:50]}...")
    print(f"   → Sprint {sprint_num}")
    
    # Créer dans la nouvelle liste
    new_id = create_task_in_list(
        target_list_id,
        name,
        desc,
        task.get('assignees', []),
        task.get('status', {}).get('status', 'TO DO')
    )
    
    if new_id:
        print(f"   ✅ Créée (ID: {new_id})")
        total_created += 1
        
        # Supprimer l'ancienne
        if delete_task(task['id']):
            print(f"   🗑️  Ancienne supprimée")
            total_deleted += 1
        else:
            print(f"   ⚠️  Impossible de supprimer l'ancienne")
        
        time.sleep(0.5)  # Rate limiting
    else:
        print(f"   ❌ Échec création")
        total_errors += 1

print("\n" + "=" * 60)
print("✅ TERMINÉ")
print("=" * 60)
print(f"Tâches créées: {total_created}")
print(f"Tâches supprimées: {total_deleted}")
print(f"Erreurs: {total_errors}")
