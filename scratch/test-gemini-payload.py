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
key = env_vars.get("VITE_GEMINI_API_KEY")

for model in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": "Hello, respond with OK."}]}]
    }
    try:
        res = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"Model: {model} -> Status: {res.status_code}")
        if res.status_code != 200:
            print("Content:", res.text[:200])
    except Exception as e:
        print(f"Model: {model} -> Exception: {e}")
