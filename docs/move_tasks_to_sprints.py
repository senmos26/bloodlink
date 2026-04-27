"""
Déplace les tâches de BloodLink Sprints vers les Lists Sprint correspondantes
"""
import requests
import re

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

# IDs
SOURCE_LIST_ID = '901523010438'  # BloodLink Sprints
SPRINT_LISTS = {
    1: '901524651833',
    2: '901524651838', 
    3: '901524651843',
    4: '901524651848',
    5: '901524651853',
    6: '901524651858'
}

def get_tasks(list_id):
    r = requests.get(f'https://api.clickup.com/api/v2/list/{list_id}/task', headers=headers)
    if r.status_code == 200:
        return r.json().get('tasks', [])
    return []

def extract_sprint_from_description(description):
    """Extrait le numéro de Sprint depuis la description"""
    if not description:
        return 1
    # Chercher "Sprint X" ou "Semaine X"
    match = re.search(r'Sprint (\d+)', description)
    if match:
        return int(match.group(1))
    match = re.search(r'Semaine (\d+)', description)
    if match:
        return int(match.group(1))
    return 1  # Par défaut Sprint 1

def create_task_in_list(list_id, name, description, assignees, status):
    """Crée une tâche dans une liste spécifique"""
    url = f'https://api.clickup.com/api/v2/list/{list_id}/task'
    
    # Format assignees
    assignee_ids = [a['id'] for a in assignees] if assignees else []
    
    data = {
        'name': name,
        'description': description,
        'status': status,
        'assignees': assignee_ids
    }
    
    r = requests.post(url, headers=headers, json=data)
    if r.status_code in [200, 201]:
        return r.json()['id']
    return None

def delete_task(task_id):
    """Supprime une tâche"""
    r = requests.delete(f'https://api.clickup.com/api/v2/task/{task_id}', headers=headers)
    return r.status_code == 200

print("=" * 60)
print("📦 RÉPARTITION DES TÂCHES DANS LES SPRINTS")
print("=" * 60)

# Récupérer toutes les tâches de la source
tasks = get_tasks(SOURCE_LIST_ID)
print(f"\n📋 {len(tasks)} tâches à répartir\n")

# Grouper par Sprint
sprint_tasks = {i: [] for i in range(1, 7)}

for task in tasks:
    desc = task.get('description', '')
    sprint_num = extract_sprint_from_description(desc)
    sprint_tasks[sprint_num].append(task)

# Afficher le résumé
for sprint_num, task_list in sprint_tasks.items():
    print(f"Sprint {sprint_num}: {len(task_list)} tâche(s)")
    for t in task_list:
        print(f"  • {t['name'][:50]}...")

# Demander confirmation
print("\n" + "=" * 60)
print("❓ Confirmer la répartition ? (oui/non)")
print("⚠️  Cela va COPIER les tâches dans les Lists Sprint")
print("   puis SUPPRIMER les tâches originales")
print("=" * 60)

# Pour l'instant, mode simulation
print("\n🔒 MODE SIMULATION (aucune action réelle)")
print("\nPour exécuter réellement, modifiez le script")

# Si on voulait vraiment le faire:
# for sprint_num, task_list in sprint_tasks.items():
#     target_list_id = SPRINT_LISTS[sprint_num]
#     for task in task_list:
#         # Créer dans la nouvelle liste
#         new_id = create_task_in_list(...)
#         if new_id:
#             # Supprimer l'ancienne
#             delete_task(task['id'])

print("\n✅ Analyse terminée")
print("Les tâches sont prêtes à être réparties")
