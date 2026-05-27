import os, json, sys, traceback
from pathlib import Path
from dotenv import load_dotenv

# Load env file containing all keys
ENV_PATH = r"C:\Users\Admin\Downloads\Desktop\.env"
load_dotenv(ENV_PATH)

# Import the caller functions from 3-enrich-elo.py
import importlib
sys.path.append(str(Path("pipeline").absolute()))
enrich_elo = importlib.import_module("3-enrich-elo")
call_cerebras = enrich_elo.call_cerebras
call_groq = enrich_elo.call_groq
call_gemini = enrich_elo.call_gemini
build_enrich_prompt = enrich_elo.build_enrich_prompt

# Read first question
IN_FILE = Path("pipeline/output/raw_questions.jsonl")
if not IN_FILE.exists():
    print("raw_questions.jsonl not found!")
    sys.exit(1)

with open(IN_FILE, "r", encoding="utf-8") as f:
    q = json.loads(f.readline())

prompt = build_enrich_prompt(q)
print("=== Target Question ===")
print(json.dumps(q, indent=2))
print("\n=== Testing Cerebras API ===")
cb_key = os.environ.get("CEREBRAS_API_KEY")
print(f"Cerebras Key: {cb_key[:12] if cb_key else 'None'}...")
if cb_key:
    try:
        res = call_cerebras(cb_key, prompt)
        print("Cerebras Response:", res)
    except Exception as e:
        print("Cerebras Error:")
        traceback.print_exc()

print("\n=== Testing Groq API ===")
groq_key = os.environ.get("VITE_GROQ_API_KEY")
print(f"Groq Key: {groq_key[:12] if groq_key else 'None'}...")
if groq_key:
    try:
        res = call_groq(groq_key, "llama-3.3-70b-versatile", prompt)
        print("Groq Response:", res)
    except Exception as e:
        print("Groq Error:")
        traceback.print_exc()

print("\n=== Testing Gemini API ===")
gemini_key = os.environ.get("VITE_GEMINI_API_KEY")
print(f"Gemini Key: {gemini_key[:12] if gemini_key else 'None'}...")
if gemini_key:
    try:
        res = call_gemini(gemini_key, "gemini-3.5-flash", prompt)
        print("Gemini Response:", res)
    except Exception as e:
        print("Gemini Error:")
        traceback.print_exc()
