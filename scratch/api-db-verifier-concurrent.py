import sqlite3
import json
import os
import sys
import glob
import time
import requests
import queue
import threading
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def find_db():
    pattern = os.path.join(".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject", "*.sqlite")
    files = glob.glob(pattern)
    db_files = [f for f in files if "metadata" not in f and os.path.basename(f) != "32a102316a3ae42300939e5f4bece6497396aead63dab98cf84c74ee519c7530.sqlite"]
    if not db_files:
        db_files = [f for f in files if "metadata" not in f]
    if not db_files:
        raise FileNotFoundError("Could not locate local SQLite D1 file.")
    db_files.sort(key=lambda x: os.path.getsize(x), reverse=True)
    return db_files[0]

SYSTEM_PROMPT = """You are a Senior Academic Quality Auditor for Indian competitive exams (JEE Main, JEE Advanced, NEET, and CBSE Board). Your task is to audit a batch of questions from our database and decide whether to APPROVE them for production or QUARANTINE them.

Return a JSON object containing a "results" array. Each item in the array MUST correspond to a question in the batch and have:
- "id": The question ID string verbatim.
- "verdict": "approve" or "quarantine".
- "reason": A brief, detailed reason explaining why it was approved or quarantined.

CRITERIA FOR QUARANTINE (verdict = 'quarantine'):
1. Conceptual/Factual Errors: The question has wrong physics, math, chemistry, or biology concepts, incorrect formulas, or wrong calculations.
2. Solvability Issues: The question is unsolvable because it is missing values, constants, or contains self-contradicting parameters.
3. Answer Key Mismatch:
   - For MCQ: The correct_answer does not match any of the options (verbatim or conceptually).
   - For Multi-correct: The correct_answer does not match the actual set of correct options.
   - For Integer: The correct_answer is not a plain number or contains a LaTeX formula/expression.
4. Broken LaTeX / Syntax Corruption: Unescaped tab spaces (like "\\t" corrupted to literal tab), unclosed math delimiters ($ or $$), or double options letters (e.g. "A. A) Option").
5. Explanations containing generic placeholder texts like "Step 1: Recall the formula. Step 2: Use the given values..."
6. Leaked answers: The question text itself contains things like "[Answer: D]" or similar.

CRITERIA FOR APPROVAL (verdict = 'approve'):
- Clean LaTeX, solvable, mathematically and conceptually 100% correct, options are distinct, explanation is helpful and correct, and the correct_answer is accurate.
"""

class KeyManager:
    def __init__(self, cerebras_keys, groq_keys):
        self.cerebras_keys = cerebras_keys
        self.groq_keys = groq_keys
        self.cooldowns = {}  # (provider, key) -> cooldown_until_timestamp
        self.blocked_models = set()  # (provider, key, model)
        self.lock = threading.Lock()
        self.cerebras_idx = 0
        self.groq_idx = 0
        self.toggle = 0

    def get_next_key(self):
        with self.lock:
            now = time.time()
            total_keys = len(self.cerebras_keys) + len(self.groq_keys)
            for _ in range(total_keys * 2):
                self.toggle = (self.toggle + 1) % 2
                if self.toggle == 0 and self.cerebras_keys:
                    for _ in range(len(self.cerebras_keys)):
                        key = self.cerebras_keys[self.cerebras_idx]
                        self.cerebras_idx = (self.cerebras_idx + 1) % len(self.cerebras_keys)
                        if now >= self.cooldowns.get(('cerebras', key), 0):
                            return 'cerebras', key
                elif self.toggle == 1 and self.groq_keys:
                    for _ in range(len(self.groq_keys)):
                        key = self.groq_keys[self.groq_idx]
                        self.groq_idx = (self.groq_idx + 1) % len(self.groq_keys)
                        if now >= self.cooldowns.get(('groq', key), 0):
                            return 'groq', key
            
            # If all keys are on cooldown, dynamically wait until the earliest cooldown expires
            earliest_time = float('inf')
            earliest_key = None
            earliest_provider = None
            
            for key in self.cerebras_keys:
                c_time = self.cooldowns.get(('cerebras', key), 0)
                if c_time < earliest_time:
                    earliest_time = c_time
                    earliest_key = key
                    earliest_provider = 'cerebras'
            for key in self.groq_keys:
                c_time = self.cooldowns.get(('groq', key), 0)
                if c_time < earliest_time:
                    earliest_time = c_time
                    earliest_key = key
                    earliest_provider = 'groq'
                    
            sleep_duration = earliest_time - now
            if sleep_duration > 0:
                # Sleep until cooldown expires (+ minor buffer)
                time.sleep(min(sleep_duration + 0.5, 15.0))
            
            return earliest_provider, earliest_key

    def set_cooldown(self, provider, key, duration=25):
        with self.lock:
            self.cooldowns[(provider, key)] = time.time() + duration

    def mark_blocked(self, provider, key, model):
        with self.lock:
            self.blocked_models.add((provider, key, model))

    def is_blocked(self, provider, key, model):
        with self.lock:
            return (provider, key, model) in self.blocked_models

def call_cerebras_api(prompt, key, model):
    headers = {
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    data = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.1,
        'max_completion_tokens': 3500,
        'response_format': {'type': 'json_object'}
    }
    try:
        res = requests.post('https://api.cerebras.ai/v1/chat/completions', headers=headers, json=data, timeout=30)
        if res.status_code == 200:
            content = res.json()['choices'][0]['message']['content']
            try:
                return json.loads(content), 200, ""
            except Exception as je:
                return None, 200, f"JSON parse error: {je}"
        else:
            return None, res.status_code, res.text
    except Exception as e:
        return None, -1, str(e)

def call_groq_api(prompt, key, model):
    headers = {
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }
    data = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.1,
        'max_tokens': 3500,
        'response_format': {'type': 'json_object'}
    }
    try:
        res = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data, timeout=30)
        if res.status_code == 200:
            content = res.json()['choices'][0]['message']['content']
            try:
                return json.loads(content), 200, ""
            except Exception as je:
                return None, 200, f"JSON parse error: {je}"
        else:
            return None, res.status_code, res.text
    except Exception as e:
        return None, -1, str(e)

def verify_batch_worker(batch, idx, key_manager):
    q_blocks = []
    for q in batch:
        options_str = ""
        try:
            options = json.loads(q['options'])
            if isinstance(options, list):
                options_str = "\n".join(f"  {chr(65+i)}. {opt}" for i, opt in enumerate(options))
            else:
                options_str = str(options)
        except Exception:
            options_str = q['options']

        q_block = f"""---
Question ID: {q['id']}
Subject: {q['subject']}
Exam: {q['exam']}
Class: {q['class']}
Type: {q['type']}
Question Text: {q['question_text']}
Options:
{options_str}
Correct Answer: {q['correct_answer']}
Explanation: {q['explanation']}"""
        q_blocks.append(q_block)

    prompt = f"Analyze the following batch of {len(batch)} questions:\n\n" + "\n\n".join(q_blocks) + "\n\nProvide your verdicts in the requested JSON format."

    # Try up to 12 attempts across keys and models
    for attempt in range(12):
        provider, key = key_manager.get_next_key()
        
        if provider == 'cerebras':
            models = ['llama3.1-8b', 'qwen-3-235b-a22b-instruct-2507', 'llama3.3-70b']
        else:  # groq
            models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it']

        for model in models:
            if key_manager.is_blocked(provider, key, model):
                continue

            if provider == 'cerebras':
                res_data, status, err_text = call_cerebras_api(prompt, key, model)
            else:
                res_data, status, err_text = call_groq_api(prompt, key, model)

            if status == 200 and res_data:
                if isinstance(res_data, dict) and 'results' in res_data:
                    return batch, res_data, f"{provider} ({model})"
                else:
                    print(f"   [Worker {idx}] Malformed JSON structure from {provider} ({model}). Retrying...")
            elif status == 429:
                # Rate limit
                print(f"   [Worker {idx}] Rate limit (429) on {provider} ({model}). Cooling down key...")
                key_manager.set_cooldown(provider, key, 30)
                break  # Exit model loop to get a new key
            elif status == 403 or (status == 400 and ("limit" in err_text.lower() or "context" in err_text.lower() or "blocked" in err_text.lower())):
                # Blocked model/context size limit
                print(f"   [Worker {idx}] Model {model} blocked/limit error on {provider} key. Marking model blocked.")
                key_manager.mark_blocked(provider, key, model)
                # Continue loop to try next model on the same key
            else:
                print(f"   [Worker {idx}] Error {status} from {provider} ({model}): {err_text[:120]}. Retrying...")

        # Add jitter sleep to reduce hammering concurrency spikes
        time.sleep(0.5 + random.random() * 0.5)

    return batch, None, 'failed'

def db_writer_thread(db_path, db_queue, log_path):
    print("Database Writer Thread: Active.")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    
    log_file = open(log_path, "a", encoding="utf-8")
    batch_updates = []
    last_commit = time.time()
    
    while True:
        try:
            item = db_queue.get(timeout=1.0)
            if item is None:
                # Sentinel shutdown
                if batch_updates:
                    cursor.executemany("UPDATE questions SET quality_tier = ?, verified = ? WHERE id = ?;", batch_updates)
                    conn.commit()
                db_queue.task_done()
                break

            q_id, verdict, reason, q_subject, q_exam, q_class = item
            
            # Log results
            log_entry = {
                'id': q_id,
                'subject': q_subject,
                'exam': q_exam,
                'class': q_class,
                'verdict': verdict,
                'reason': reason
            }
            log_file.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
            log_file.flush()
            
            new_tier = 'B' if verdict == 'approve' else 'D'
            new_verified = 1 if verdict == 'approve' else -1
            
            batch_updates.append((new_tier, new_verified, q_id))
            
            if len(batch_updates) >= 50 or (time.time() - last_commit > 5.0 and batch_updates):
                cursor.executemany("UPDATE questions SET quality_tier = ?, verified = ? WHERE id = ?;", batch_updates)
                conn.commit()
                batch_updates.clear()
                last_commit = time.time()
                
            db_queue.task_done()
            
        except queue.Empty:
            if batch_updates:
                cursor.executemany("UPDATE questions SET quality_tier = ?, verified = ? WHERE id = ?;", batch_updates)
                conn.commit()
                batch_updates.clear()
                last_commit = time.time()
        except Exception as e:
            print(f"❌ Database Writer Error: {e}")
            
    log_file.close()
    conn.close()
    print("Database Writer Thread: Terminated.")

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    import argparse
    parser = argparse.ArgumentParser(description="Concurrent Resilient ExamCompass Question Quality Verifier")
    parser.add_argument("--limit", type=int, default=15000, help="Number of questions to verify")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of questions per batch")
    parser.add_argument("--threads", type=int, default=12, help="Number of concurrent worker threads")
    args = parser.parse_args()

    db_path = find_db()
    print(f"Connected to SQLite database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    env_vars = load_env()
    
    # Load Cerebras keys
    cerebras_keys = []
    for i in range(1, 9):
        k_name = "CEREBRAS_API_KEY" if i == 1 else f"CEREBRAS_API_KEY_{i}"
        key = env_vars.get(k_name)
        if key:
            cerebras_keys.append(key)
            
    # Load Groq keys
    groq_keys = []
    for i in range(1, 9):
        k_name = "VITE_GROQ_API_KEY" if i == 1 else f"VITE_GROQ_API_KEY_{i}"
        key = env_vars.get(k_name)
        if key:
            groq_keys.append(key)

    if not cerebras_keys and not groq_keys:
        print("❌ No API keys found in .env!")
        conn.close()
        return

    print(f"Loaded active API keys: Cerebras ({len(cerebras_keys)}), Groq ({len(groq_keys)}).")
    key_manager = KeyManager(cerebras_keys, groq_keys)

    # Fetch unverified Tier C questions
    query = """
        SELECT id, subject, exam, class, type, question_text, options, correct_answer, explanation 
        FROM questions 
        WHERE quality_tier = 'C' AND verified = 0 
        LIMIT ?
    """
    rows = cursor.execute(query, (args.limit,)).fetchall()
    conn.close() # Close main thread connection; db_writer handles DB writes
    
    if not rows:
        print("No questions found with quality_tier = 'C' and verified = 0.")
        return

    print(f"Fetched {len(rows)} questions for verification.")
    
    questions = []
    for row in rows:
        questions.append({
            'id': row[0],
            'subject': row[1],
            'exam': row[2],
            'class': row[3],
            'type': row[4],
            'question_text': row[5],
            'options': row[6],
            'correct_answer': row[7],
            'explanation': row[8]
        })

    # Prepare batches
    batches = []
    for start_idx in range(0, len(questions), args.batch_size):
        batches.append(questions[start_idx : start_idx + args.batch_size])

    # Initialize queue and DB writer thread
    db_queue = queue.Queue()
    log_path = os.path.join("scratch", "verification_results.jsonl")
    writer = threading.Thread(target=db_writer_thread, args=(db_path, db_queue, log_path))
    writer.daemon = True
    writer.start()

    approved_count = 0
    quarantined_count = 0
    skipped_count = 0
    completed_batches = 0
    total_batches = len(batches)

    startTime = time.time()
    
    print(f"Starting execution with {args.threads} worker threads...")
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {executor.submit(verify_batch_worker, b, idx, key_manager): b for idx, b in enumerate(batches)}
        
        for future in as_completed(futures):
            batch, res_json, provider = future.result()
            completed_batches += 1
            
            elapsed = time.time() - startTime
            rate = (completed_batches * args.batch_size) / elapsed
            eta = (len(questions) - (completed_batches * args.batch_size)) / rate if rate > 0 else 0
            
            if not res_json or 'results' not in res_json:
                print(f"   [Batch {completed_batches}/{total_batches}] ❌ API response failed from {provider}. Skipping batch...")
                skipped_count += len(batch)
                continue
                
            results = res_json['results']
            results_map = {item['id']: item for item in results if 'id' in item}
            
            for q in batch:
                q_id = q['id']
                if q_id not in results_map:
                    skipped_count += 1
                    continue
                    
                item = results_map[q_id]
                verdict = item.get('verdict', 'quarantine').strip().lower()
                reason = item.get('reason', 'No reason provided.').strip()
                
                if verdict == 'approve':
                    approved_count += 1
                else:
                    quarantined_count += 1
                    
                # Put verified result in writing queue
                db_queue.put((q_id, verdict, reason, q['subject'], q['exam'], q['class']))
                
            print(f"   [Batch {completed_batches}/{total_batches}] Verified {completed_batches*args.batch_size}/{len(questions)} | Rate: {rate:.1f} q/s | ETA: {eta/60:.1f} min | Latest response from {provider}")

    # Signal DB writer thread to shut down
    print("All batches processed. Shutting down database writer...")
    db_queue.put(None)
    writer.join()

    print("\n" + "="*50)
    print("CONCURRENT RESILIENT VERIFICATION COMPLETED!")
    print("="*50)
    print(f"Total processed:   {len(questions)}")
    print(f"Approved (Tier B): {approved_count}")
    print(f"Quarantined (D):   {quarantined_count}")
    print(f"Skipped/Errors:    {skipped_count}")
    print(f"Time elapsed:      {(time.time() - startTime)/60:.2f} minutes")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
