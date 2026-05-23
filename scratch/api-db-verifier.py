import sqlite3
import json
import os
import sys
import glob
import time
import requests

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
                    # Strip enclosing quotes if any
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

class APIVerifier:
    def __init__(self, env_vars):
        # Gather Cerebras keys
        self.cerebras_keys = []
        for i in range(1, 9):
            k_name = f"CEREBRAS_API_KEY" if i == 1 else f"CEREBRAS_API_KEY_{i}"
            key = env_vars.get(k_name)
            if key:
                self.cerebras_keys.append(key)
        
        # Gather Groq keys
        self.groq_keys = []
        for i in range(1, 9):
            k_name = f"VITE_GROQ_API_KEY" if i == 1 else f"VITE_GROQ_API_KEY_{i}"
            key = env_vars.get(k_name)
            if key:
                self.groq_keys.append(key)
        
        self.cerebras_idx = 0
        self.groq_idx = 0
        self.failed_cerebras_keys = set()
        self.failed_groq_keys = set()

    def get_cerebras_key(self):
        if not self.cerebras_keys:
            return None
        # Return next key that hasn't failed hard
        start_idx = self.cerebras_idx
        while True:
            key = self.cerebras_keys[self.cerebras_idx]
            self.cerebras_idx = (self.cerebras_idx + 1) % len(self.cerebras_keys)
            if key not in self.failed_cerebras_keys:
                return key
            if self.cerebras_idx == start_idx:
                break
        return None

    def get_groq_key(self):
        if not self.groq_keys:
            return None
        start_idx = self.groq_idx
        while True:
            key = self.groq_keys[self.groq_idx]
            self.groq_idx = (self.groq_idx + 1) % len(self.groq_keys)
            if key not in self.failed_groq_keys:
                return key
            if self.groq_idx == start_idx:
                break
        return None

    def call_cerebras(self, prompt):
        key = self.get_cerebras_key()
        if not key:
            raise Exception("No active Cerebras keys available")
        
        headers = {
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        data = {
            'model': 'qwen-3-235b-a22b-instruct-2507',
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.1,
            'max_completion_tokens': 3500,
            'response_format': {'type': 'json_object'}
        }
        
        try:
            res = requests.post('https://api.cerebras.ai/v1/chat/completions', headers=headers, json=data, timeout=40)
            if res.status_code == 200:
                result_json = res.json()
                content = result_json['choices'][0]['message']['content']
                return json.loads(content)
            elif res.status_code == 429:
                print(f"   [Cerebras 429 Rate Limit for key... rotating]")
                # We do not fail it permanently since 429s are usually transient/RPM limits, but let's rotate
                return None
            else:
                print(f"   [Cerebras status {res.status_code}: {res.text[:120]}]")
                return None
        except Exception as e:
            print(f"   [Cerebras request exception: {e}]")
            return None

    def call_groq(self, prompt):
        key = self.get_groq_key()
        if not key:
            raise Exception("No active Groq keys available")
        
        headers = {
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        data = {
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.1,
            'max_tokens': 3500,
            'response_format': {'type': 'json_object'}
        }
        
        try:
            res = requests.post('https://api.groq.com/openai/v1/chat/completions', headers=headers, json=data, timeout=40)
            if res.status_code == 200:
                result_json = res.json()
                content = result_json['choices'][0]['message']['content']
                return json.loads(content)
            elif res.status_code == 429:
                print(f"   [Groq 429 Rate Limit for key... rotating]")
                return None
            elif res.status_code == 403:
                # Project level blocked model or bad key
                print(f"   [Groq 403 Blocked: flagging key as failed]")
                self.failed_groq_keys.add(key)
                return None
            else:
                print(f"   [Groq status {res.status_code}: {res.text[:120]}]")
                return None
        except Exception as e:
            print(f"   [Groq request exception: {e}]")
            return None

    def verify_batch(self, batch):
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
        
        # Try Cerebras Qwen-235B first (rotate up to len(keys) times)
        for _ in range(len(self.cerebras_keys) * 2):
            result = self.call_cerebras(prompt)
            if result:
                return result, "Cerebras (Qwen-235B)"
            time.sleep(1)
            
        print("   [Cerebras keys exhausted or rate-limited. Falling back to Groq Llama-3.3-70B...]")
        for _ in range(len(self.groq_keys) * 2):
            result = self.call_groq(prompt)
            if result:
                return result, "Groq (Llama-3.3-70B)"
            time.sleep(1)
            
        return None, None

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    import argparse
    parser = argparse.ArgumentParser(description="ExamCompass API Question Quality Verifier")
    parser.add_argument("--limit", type=int, default=100, help="Number of questions to verify")
    parser.add_argument("--batch-size", type=int, default=15, help="Number of questions per batch")
    parser.add_argument("--dry-run", action="store_true", help="Don't write updates to DB")
    args = parser.parse_args()

    db_path = find_db()
    print(f"Connected to SQLite database: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()

    # Load Env Vars for Keys
    env_vars = load_env()
    verifier = APIVerifier(env_vars)
    
    print(f"Initialized API Verifier:")
    print(f"   Cerebras keys found: {len(verifier.cerebras_keys)}")
    print(f"   Groq keys found:     {len(verifier.groq_keys)}")

    # Fetch questions to verify
    # Only verify raw C-tier questions that are not verified yet
    query = """
        SELECT id, subject, exam, class, type, question_text, options, correct_answer, explanation 
        FROM questions 
        WHERE quality_tier = 'C' AND verified = 0 
        LIMIT ?
    """
    rows = cursor.execute(query, (args.limit,)).fetchall()
    
    if not rows:
        print("No questions found with quality_tier = 'C' and verified = 0.")
        conn.close()
        return

    print(f"Fetched {len(rows)} questions for verification.")
    
    # Map rows to dicts
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

    # Output log file
    log_path = os.path.join("scratch", "verification_results.jsonl")
    log_file = open(log_path, "a", encoding="utf-8")

    approved_count = 0
    quarantined_count = 0
    skipped_count = 0

    # Batch processing
    for start_idx in range(0, len(questions), args.batch_size):
        batch = questions[start_idx : start_idx + args.batch_size]
        print(f"\n🚀 Processing batch {start_idx // args.batch_size + 1} ({start_idx + 1} to {min(start_idx + args.batch_size, len(questions))} of {len(questions)})...")
        
        res_json, provider = verifier.verify_batch(batch)
        if not res_json or 'results' not in res_json:
            print("   ❌ Failed to get verification response from APIs for this batch. Skipping...")
            skipped_count += len(batch)
            continue
            
        print(f"   ✅ Got response from {provider}")
        
        # Parse results and apply updates
        results = res_json['results']
        results_map = {item['id']: item for item in results if 'id' in item}
        
        for q in batch:
            q_id = q['id']
            if q_id not in results_map:
                print(f"   ⚠️ Warning: Question ID {q_id} missing in API response.")
                skipped_count += 1
                continue
                
            item = results_map[q_id]
            verdict = item.get('verdict', 'quarantine').strip().lower()
            reason = item.get('reason', 'No reason provided.').strip()
            
            # Log to file
            log_entry = {
                'id': q_id,
                'subject': q['subject'],
                'exam': q['exam'],
                'class': q['class'],
                'verdict': verdict,
                'reason': reason
            }
            log_file.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
            log_file.flush()
            
            if verdict == 'approve':
                new_tier = 'B'
                new_verified = 1
                approved_count += 1
                status_color = "\033[92mAPPROVE\033[0m"
            else:
                new_tier = 'D'
                new_verified = -1
                quarantined_count += 1
                status_color = "\033[91mQUARANTINE\033[0m"
                
            print(f"   [{status_color}] ID {q_id}: {reason[:120]}")
            
            if not args.dry_run:
                # Update DB
                cursor.execute(
                    "UPDATE questions SET quality_tier = ?, verified = ? WHERE id = ?;",
                    (new_tier, new_verified, q_id)
                )
                
        # Commit batch
        if not args.dry_run:
            conn.commit()
            print("   💾 Committed updates to database.")

    log_file.close()
    conn.close()

    print("\n" + "="*50)
    print("VERIFICATION COMPLETED!")
    print("="*50)
    print(f"Total processed:   {len(questions)}")
    print(f"Approved (Tier B): {approved_count}")
    print(f"Quarantined (D):   {quarantined_count}")
    print(f"Skipped/Errors:    {skipped_count}")
    print(f"Detailed logs written to: {log_path}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
