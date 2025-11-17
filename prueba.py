import requests

url = "https://dniruc.apisunat.com/dni/74143981"

headers = { "origin": "https://apisunat.com" }

response = requests.get(url, headers=headers)

print("Status:", response.status_code)
print("Body:", response.text)
