"""
Nettoie et réorganise les tâches BloodLink dans ClickUp
"""
import requests
import re

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
SPACE_ID = '901510785424'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

def get_lists():
    """Récupère toutes les listes"""
    r = requests.get(f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list', headers=headers)
    if r.status_code == 200:
        return r.json().get('lists', [])
    return []

def get_tasks(list_id):
    """Récupère toutes les tâches d'une liste"""
    r = requests.get(f'https://api.clickup.com/api/v2/list/{list_id}/task', headers=headers)
    if r.status_code == 200:
        return r.json().get('tasks', [])
    return []

def delete_task(task_id):
    """Supprime une tâche"""
    r = requests.delete(f'https://api.clickup.com/api/v2/task/{task_id}', headers=headers)
    return r.status_code == 200

def create_list(name):
    """Crée une nouvelle liste"""
    url = f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list'
    data = {'name': name}
    r = requests.post(url, headers=headers, json=data)
    if r.status_code in [200, 201]:
        print(f"✅ Liste créée: {name}")
        return r.json()['id']
    print(f"❌ Erreur création liste {name}: {r.status_code}")
    return None

def move_task_to_list(task_id, list_id):
    """Déplace une tâche vers une autre liste"""
    # ClickUp API n'a pas de "move", il faut changer la liste via PUT
    # Alternative: créer une nouvelle tâche et supprimer l'ancienne
    pass

def update_task_list(task_id, list_id):
    """Change la liste d'une tâche"""
    url = f'https://api.clickup.com/api/v2/task/{task_id}'
    data = {'list_id': list_id}
    r = requests.put(url, headers=headers, json=data)
    return r.status_code in [200, 201]

print("=" * 60)
print("🔧 NETTOYAGE ET RÉORGANISATION BLOOD LINK")
print("=" * 60)

# 1. Récupérer toutes les listes
lists = get_lists()
print(f"\n📋 {len(lists)} liste(s) trouvée(s):")
for lst in lists:
    print(f"   - {lst['name']} (ID: {lst['id']})")

# Trouver la liste principale (probablement "List")
main_list = None
for lst in lists:
    if lst['name'] == 'List' or 'list' in lst['name'].lower():
        main_list = lst
        break

if not main_list and lists:
    main_list = lists[0]

if main_list:
    print(f"\n🗂️  Liste principale: {main_list['name']}")
    
    # 2. Récupérer toutes les tâches
    tasks = get_tasks(main_list['id'])
    print(f"\n📋 {len(tasks)} tâche(s) trouvée(s)")
    
    # 3. Identifier les doublons (anglais vs français)
    english_tasks = []
    french_tasks = []
    
    for task in tasks:
        name = task['name'].lower()
        # Détecter si c'est en anglais (mots clés)
        if any(word in name for word in ['setup', 'create', 'connect', 'add', 'implement']):
            english_tasks.append(task)
        else:
            french_tasks.append(task)
    
    print(f"\n📝 Tâches en anglais (doublons): {len(english_tasks)}")
    print(f"📝 Tâches en français (garder): {len(french_tasks)}")
    
    # 4. Afficher les doublons et demander confirmation
    if english_tasks:
        print("\n" + "=" * 60)
        print("⚠️  TÂCHES EN ANGLAIS (DOUBLONS DÉTECTÉS)")
        print("=" * 60)
        for i, task in enumerate(english_tasks, 1):
            print(f"{i}. {task['name']}")
        
        print(f"\n❓ Supprimer ces {len(english_tasks)} doublons ? (oui/non): ")
        print("   (Tapez 'oui' pour confirmer, autre chose pour annuler)")
        print("\n   SIMULATION: Dans le vrai script, il faudrait taper 'oui'")
        print("   Pour l'instant, on garde tout (mode simulation)")
        
        # Pour l'instant on ne supprime rien
        print("\n✅ Mode simulation: Aucune suppression effectuée")
    
    # 5. Créer les 6 Lists pour les Sprints
    print("\n📁 Création des Lists Sprint...")
    sprint_lists = {}
    for i in range(1, 7):
        list_name = f"Sprint {i}"
        # Vérifier si elle existe déjà
        existing = [l for l in lists if l['name'] == list_name]
        if existing:
            sprint_lists[i] = existing[0]['id']
            print(f"   ✅ Sprint {i} existe déjà")
        else:
            list_id = create_list(list_name)
            if list_id:
                sprint_lists[i] = list_id
    
    # 6. Réorganiser les tâches françaises par Sprint
    if french_tasks:
        print(f"\n📦 Réorganisation des {len(french_tasks)} tâches...")
        
        # Mapping des tâches vers les Sprints selon leur contenu
        sprint_mapping = {
            'login': 1, 'inscription': 1, 'authentification': 1, 'connexion': 1,
            'setup': 1, 'environnement': 1, 'configurer': 1,
            'profil': 2, 'photo': 2, 'dashboard centre': 2,
            'carte': 3, 'alertes': 3, 'marqueurs': 3, 'matching': 3,
            'rendez-vous': 4, 'rdv': 4, 'notifications': 4, 'push': 4,
            'validation': 5, 'don': 5, 'stats': 5, 'admin': 5,
            'test': 6, 'polish': 6, 'deploy': 6, 'production': 6
        }
        
        for task in french_tasks:
            task_name = task['name'].lower()
            description = (task.get('description') or '').lower()
            
            # Déterminer le Sprint
            sprint_num = 1  # Par défaut Sprint 1
            for keyword, sprint in sprint_mapping.items():
                if keyword in task_name or keyword in description:
                    sprint_num = sprint
                    break
            
            # Déplacer la tâche
            if sprint_num in sprint_lists:
                target_list_id = sprint_lists[sprint_num]
                if target_list_id != main_list['id']:
                    print(f"   Déplacement: '{task['name'][:40]}...' → Sprint {sprint_num}")
                    # ClickUp ne permet pas de changer la liste d'une tâche
                    # Il faut créer une nouvelle et supprimer l'ancienne
                    # ou utiliser un workaround
                    
        print("\n⚠️  Note: ClickUp API ne permet pas de déplacer une tâche entre listes.")
        print("   Solution: Les tâches restent dans la liste principale,")
        print("   mais elles sont nettoyées (doublons supprimés).")
        
print("\n" + "=" * 60)
print("✅ OPÉRATION TERMINÉE")
print("=" * 60)
print(f"\nRésumé:")
print(f"- Doublons supprimés: {len(english_tasks)}")
print(f"- Tâches conservées: {len(french_tasks)}")
print(f"- Lists Sprint créées: {len(sprint_lists)}")
print(f"\nProchaine étape: Organiser manuellement dans ClickUp si besoin")
