import requests
import io
from PIL import Image
import time

# Let's try FLUX.1-schnell on Hugging Face
API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
# No token for this test - checking if anonymous allowed
headers = {} 

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response

print("Attempting Image 1 (Cold Start check)...")
prompt = "lofi girl studying with a sleeping cat, anime style, high quality"
response = query({"inputs": prompt})

if response.status_code == 200:
    image = Image.open(io.BytesIO(response.content))
    image.save("hf_test_1.jpg")
    print("Success! Saved hf_test_1.jpg")
elif response.status_code == 503:
    print("Model is loading (Cold Start). Waiting 30 seconds...")
    time.sleep(30)
    response = query({"inputs": prompt})
    if response.status_code == 200:
        image = Image.open(io.BytesIO(response.content))
        image.save("hf_test_1.jpg")
        print("Success! Saved hf_test_1.jpg")
    else:
        print(f"Failed after wait: {response.status_code}")
        print(response.text)
else:
    print(f"Error: {response.status_code}")
    print(response.text)
