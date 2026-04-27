"""
Vérifie les listes et tâches existantes dans BLOOD Link
"""
import requests

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
SPACE_ID = '901510785424'
headers = {'Authorization': TOKEN}

print("📋 LISTES DANS BLOOD LINK:")
print("=" * 50)

# Get all lists in the space
r = requests.get(f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list', headers=headers)
if r.status_code == 200:
    lists = r.json().get('lists', [])
    if not lists:
        print("Aucune liste trouvée.")
    for lst in lists:
        print(f"\n🗂️  {lst['name']} (ID: {lst['id']})")
        print("-" * 40)
        
        # Get tasks in this list
        r2 = requests.get(f"https://api.clickup.com/api/v2/list/{lst['id']}/task", headers=headers)
        if r2.status_code == 200:
            tasks = r2.json().get('tasks', [])
            if not tasks:
                print("   (aucune tâche)")
            for task in tasks:
                status = task.get('status', {}).get('status', 'NO STATUS')
                print(f"   • [{status}] {task['name']}")
else:
    print(f"Erreur: {r.status_code}")
    print(r.text)
