import urllib.request, json, sys

token = sys.argv[1]
url = "https://run.googleapis.com/v1/projects/ais-europe-west2-b40dfde866ee4/locations/europe-west2/services"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for item in data.get('items', []):
            print(f"Name: {item['metadata']['name']}")
            print(f"URL: {item.get('status', {}).get('url')}")
            print(f"Service Account: {item.get('spec', {}).get('template', {}).get('spec', {}).get('serviceAccountName')}")
            volumes = item.get('spec', {}).get('template', {}).get('spec', {}).get('volumes', [])
            cloudsql = [v for v in volumes if 'cloudSqlInstance' in v]
            if cloudsql:
                 print(f"Cloud SQL Bindings: {json.dumps(cloudsql)}")
            env = item.get('spec', {}).get('template', {}).get('spec', {}).get('containers', [{}])[0].get('env', [])
            db_url = [e for e in env if e.get('name') == 'DATABASE_URL']
            if db_url:
                 print(f"DATABASE_URL Env: {json.dumps(db_url)}")
            print("---")
except Exception as e:
    print(f"Error: {e}")
