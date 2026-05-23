import os
import requests
import json

def load_env(env_path=".env"):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split("=", 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    val = parts[1].strip()
                    if "#" in val:
                        val = val.split("#", 1)[0].strip()
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    env_vars[key] = val
    return env_vars

env_vars = load_env()

gemini_keys = []
for i in range(1, 7):
    k_name = "VITE_GEMINI_API_KEY" if i == 1 else f"VITE_GEMINI_API_KEY_{i}"
    key = env_vars.get(k_name)
    if key:
        gemini_keys.append(key)

print(f"Loaded {len(gemini_keys)} Gemini keys.")

for idx, key in enumerate(gemini_keys):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": "Hello, respond with only the word OK."}]}]
    }
    try:
        res = requests.post(url, headers=headers, json=data, timeout=10)
        if res.status_code == 200:
            print(f"Key {idx + 1}: SUCCESS")
        else:
            print(f"Key {idx + 1}: FAILED (Status: {res.status_code}, Res: {res.text[:100]})")
    except Exception as e:
        print(f"Key {idx + 1}: EXCEPTION: {e}")
