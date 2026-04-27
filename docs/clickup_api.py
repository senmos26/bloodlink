import requests, json, sys

TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
headers = {'Authorization': TOKEN, 'Content-Type': 'application/json'}

# Get spaces
r = requests.get('https://api.clickup.com/api/v2/team/90121045864/space', headers=headers)
print('Status:', r.status_code)
if r.status_code == 200:
    data = r.json()
    for sp in data.get('spaces', []):
        print(f"  {sp['id']} : {sp['name']}")
else:
    print(r.text)
