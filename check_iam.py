import urllib.request, json, sys
token = sys.argv[1]
url = "https://cloudresourcemanager.googleapis.com/v1/projects/ais-europe-west2-b40dfde866ee4:getIamPolicy"
req = urllib.request.Request(url, data=b"{}", headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except Exception as e:
    print(f"Error: {e}")
