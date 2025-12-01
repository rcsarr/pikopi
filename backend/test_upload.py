import requests

# URL endpoint
url = 'http://localhost:5010/api/payments/upload'

# File yang mau di-upload
files = {'file': open('photo.jpg', 'rb')}
data = {'payment_id': 'PAY-001'}

# Send request
response = requests.post(url, files=files, data=data)

# Print hasil
print("Status Code:", response.status_code)
print("Response:", response.json())
