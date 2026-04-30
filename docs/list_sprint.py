"""Affiche les tâches d'un Sprint ClickUp"""
import requests, json, sys

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

SPRINT_LISTS = {
    1: '901523014219',
    2: '901523014220',
    3: '901523014221',
    4: '901523014222',
    5: '901523014223',
    6: '901523014224',
}

sprint_num = int(sys.argv[1]) if len(sys.argv) > 1 else 4
list_id = SPRINT_LISTS.get(sprint_num)

if not list_id:
    print(f"Sprint {sprint_num} introuvable")
    sys.exit(1)

r = requests.get(f'https://api.clickup.com/api/v2/list/{list_id}/task', headers=headers)
tasks = r.json().get('tasks', [])

print(f"\n📋 Sprint {sprint_num} - {len(tasks)} tâche(s):")
print("=" * 80)
for t in tasks:
    desc = (t.get('description') or '')[:60]
    print(f"  ID:    {t['id']}")
    print(f"  Nom:   {t['name']}")
    print(f"  Statut: {t['status']['status']}")
    if desc:
        print(f"  Desc:  {desc}...")
    print("-" * 80)
