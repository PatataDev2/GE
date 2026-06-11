import json, requests
url = 'http://localhost:8000'

r = requests.post(url + '/users/api/v1/login/', json={'username':'marianalista','password':'patata18'})
print('LOGIN:', r.status_code)
token = r.json()['access']
print('  Bearer token:', token[:20]+'...')

headers = {'Authorization': 'Bearer ' + token}

r = requests.get(url + '/users/api/v1/', headers=headers)
print('USERS:', r.status_code)
if r.status_code == 200:
    data = r.json()
    items = data.get('results', data if isinstance(data, list) else [])
    for u in items:
        print('  ' + u['username'] + ' rol=' + u['rol'] + ' active=' + str(u['is_active']))

r = requests.get(url + '/api/departments/', headers=headers)
print('DEPTS:', r.status_code)
if r.status_code == 200:
    for d in r.json():
        print('  ' + d['name'])

r = requests.get(url + '/api/document-types/', headers=headers)
print('DOCTYPES:', r.status_code)
if r.status_code == 200:
    print('  count:', len(r.json()))
