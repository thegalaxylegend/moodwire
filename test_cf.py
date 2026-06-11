import os
import requests
from dotenv import load_dotenv
load_dotenv(r'c:\Users\Admin\OneDrive\Desktop\lofi-automation\.env')
account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID', '')
api_token = os.getenv('CLOUDFLARE_API_TOKEN', '').replace('\"', '')

prompt = 'a cute cat'
model = '@cf/black-forest-labs/flux-1-schnell'
url = f'https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}'
response = requests.post(
    url,
    headers={
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json',
    },
    json={
        'prompt': prompt,
        'num_steps': 8,
        'width': 1024,
        'height': 576,
    }
)
print('Status:', response.status_code)
print('Content-Type:', response.headers.get('Content-Type'))
print('Length:', len(response.content))
with open('test_cf.jpg', 'wb') as f:
    f.write(response.content)
