"""
Vérifie les listes et tâches existantes dans BLOOD Link - version complète
"""
import requests

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
SPACE_ID = '901510785424'
headers = {'Authorization': TOKEN}

print("📋 BLOOD LINK - CONTENU ACTUEL")
print("=" * 60)

# Get all lists in the space
r = requests.get(f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list', headers=headers)
if r.status_code == 200:
    lists = r.json().get('lists', [])
    print(f"Nombre de listes: {len(lists)}\n")
    
    for lst in lists:
        print(f"\n{'='*60}")
        print(f"🗂️  LISTE: {lst['name']}")
        print(f"{'='*60}")
        
        # Get tasks in this list
        r2 = requests.get(f"https://api.clickup.com/api/v2/list/{lst['id']}/task", headers=headers)
        if r2.status_code == 200:
            tasks = r2.json().get('tasks', [])
            print(f"Nombre de tâches: {len(tasks)}\n")
            
            for i, task in enumerate(tasks, 1):
                status = task.get('status', {}).get('status', 'NO STATUS')
                assignees = task.get('assignees', [])
                assignee_names = ', '.join([a.get('username', 'Unknown') for a in assignees]) if assignees else 'Non assigné'
                
                print(f"{i}. [{status.upper()}] {task['name']}")
                print(f"   Assignés: {assignee_names}")
                if task.get('description'):
                    desc = task['description'][:100].replace('\n', ' ')
                    print(f"   Description: {desc}...")
                print()
else:
    print(f"Erreur: {r.status_code}")
    print(r.text)
