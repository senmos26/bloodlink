import requests
TOKEN = 'pk_62609552_8BIJ588Z0UV5HKDRIJI2NK0E05WN8W2O'
SPACE_ID = '901510785424'
headers = {'Authorization': TOKEN}
r = requests.get(f'https://api.clickup.com/api/v2/space/{SPACE_ID}/list', headers=headers)
lists = r.json().get('lists', [])
for lst in lists:
    print(f"{lst['name']} : {lst['id']}")
