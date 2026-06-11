import requests
import time

def download_pollination(prompt, filename):
    url = f"https://image.pollinations.ai/prompt/{prompt.replace(' ', '%20')}?width=1024&height=576&nologo=true&seed={int(time.time())}"
    print(f"Downloading: {filename}...")
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"Success! Saved as {filename}")
    else:
        print(f"Failed: {response.status_code}")

# Generate 3 variations
download_pollination("lofi anime girl studying at a wooden desk with a cat, sunset lighting, high quality", "test_img_1.jpg")
time.sleep(2)
download_pollination("cyberpunk lofi city street at night, neon lights, rainy weather, cinematic", "test_img_2.jpg")
time.sleep(2)
download_pollination("ghibli style cozy bedroom with mountain view, peaceful atmosphere, detailed", "test_img_3.jpg")
