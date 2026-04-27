"""
Affiche toutes les listes et leurs tâches
"""
import requests

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
SPACE_ID = '901510785424'
headers = {'Authorization': TOKEN}

r = requests.get(f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list', headers=headers)
lists = r.json().get('lists', [])

for lst in lists:
    print(f"\n{'='*60}")
    print(f"LISTE: {lst['name']}")
    print('='*60)
    
    r2 = requests.get(f"https://api.clickup.com/api/v2/list/{lst['id']}/task", headers=headers)
    if r2.status_code == 200:
        tasks = r2.json().get('tasks', [])
        print(f"Nombre de tâches: {len(tasks)}\n")
        
        for i, task in enumerate(tasks, 1):
            name = task['name']
            status = task.get('status', {}).get('status', 'NO STATUS')
            print(f"{i}. [{status}] {name}")
