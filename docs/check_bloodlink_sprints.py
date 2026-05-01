"""
Vérifie les tâches dans BloodLink Sprints
"""
import requests

TOKEN = 'pk_62609552_W0VHYV65R3DEGPFPGDKN3XIJAFHOI2DF'
LIST_ID = '901523010438'
headers = {'Authorization': TOKEN}

r = requests.get(f'https://api.clickup.com/api/v2/list/{LIST_ID}/task', headers=headers)
if r.status_code == 200:
    tasks = r.json().get('tasks', [])
    print(f"📋 {len(tasks)} tâche(s) dans 'BloodLink Sprints':\n")
    
    for i, task in enumerate(tasks, 1):
        status = task.get('status', {}).get('status', 'NO STATUS')
        assignees = task.get('assignees', [])
        names = ', '.join([a.get('username', '?') for a in assignees]) if assignees else 'Non assigné'
        
        print(f"{i}. [{status}] {task['name']}")
        print(f"   Assignés: {names}")
        
        # Extraire le sprint depuis la description
        desc = task.get('description', '')
        if 'Sprint' in desc:
            sprint_match = __import__('re').search(r'Sprint \d+', desc)
            if sprint_match:
                print(f"   📍 {sprint_match.group()}")
        print()
else:
    print(f"Erreur: {r.status_code}")
