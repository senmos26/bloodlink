import requests, json

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN}

# Get all teams
r = requests.get('https://api.clickup.com/api/v2/team', headers=headers)
if r.status_code == 200:
    teams = r.json()['teams']
    for team in teams:
        print(f"\nTeam: {team['id']} - {team['name']}")
        # Get spaces
        r2 = requests.get(f"https://api.clickup.com/api/v2/team/{team['id']}/space", headers=headers)
        if r2.status_code == 200:
            for sp in r2.json().get('spaces', []):
                print(f"  Space: {sp['id']} - {sp['name']}")
                # If this is BLOOD Link, get lists
                if 'blood' in sp['name'].lower():
                    print(f"    >>> FOUND BLOOD LINK! Space ID: {sp['id']}")
                    r3 = requests.get(f"https://api.clickup.com/api/v2/space/{sp['id']}/list", headers=headers)
                    if r3.status_code == 200:
                        for lst in r3.json().get('lists', []):
                            print(f"      List: {lst['id']} - {lst['name']}")
