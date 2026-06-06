# 🛡️ AGENT SAFETY GUIDE — ExamCompass
## Complete Reference for AI Agents (Claude, Gemini, GPT, etc.)
## 🚫 TOKEN SAVING: If you are doing general chat or small UI visual edits, close this file immediately to save tokens.

> **This file is LAW. Read it entirely before touching any database, deployment, or script.**
> Violations have caused: Firebase quota exhaustion, 24-hour downtime, 66k wasted reads.

---

## ⛔ THE GOLDEN RULES (Memorise These)

```
RULE 1: Questions → Cloudflare D1 ONLY. NEVER Firestore. NEVER anywhere else.
RULE 2: Never run a script that writes bulk data without showing the user first.
RULE 3: Never run `firebase deploy` unless the user explicitly says "deploy now".
RULE 4: Never delete files from /scripts/, /src/, /public/ without asking.
RULE 5: Never edit firestore.rules without the user's explicit written approval.
RULE 6: Never add npm packages without asking — bundle size directly affects Lighthouse score.
RULE 7: seed.sql is 56 MB. Never open it fully. Never rewrite it. Use d1-push.ts to push it.
RULE 8: Never write to Firestore's engine_questions collection. It is LOCKED for a reason.
```

---

## ⏰ LONG CONVERSATION DRIFT — The Biggest Real Risk

**Small AI models forget rules after 10–20 messages. This is how the Firebase incident happened.**

If you are deep in a long conversation and about to do something that touches a database, script, or deployment — STOP and re-check these before continuing:

```
✋ PAUSE CHECKLIST (run this after every 5 actions):
   □ Questions still go to D1 (not Firestore)?
   □ Still inside the original task scope?
   □ Next action is not destructive / needs no permission?
   □ User knows what I just did?
   □ I have not opened seed.sql or any 50KB+ file unnecessarily?
```

If any box is unchecked — tell the user what you are about to do. Wait for OK.

---

## 🚨 REAL INCIDENT LOG — What Has Gone Wrong & Why

### Incident #1: Firebase Quota Exhaustion (June 6, 2026)
- **What happened**: An AI agent ran `migrate-seed-to-firestore.mjs` which tried to write 38k questions to Firebase Firestore
- **Result**: 66,000 Firestore reads consumed in ~60 seconds. Firebase free quota (50k/day) exhausted. Website went down for users.
- **Root cause**: Agent assumed questions = Firestore. They do not. Questions = Cloudflare D1.
- **Recovery time**: Had to wait until 12:30 PM IST for quota to auto-reset
- **Prevention**: `migrate-seed-to-firestore.mjs` is now a guard that throws an error. `engine_questions` collection is admin-write-only in Firestore rules.

**Key lesson: Never write to Firestore in bulk. 50k reads is nothing when you have 38k questions.**

---

## 🗄️ True Database Architecture

### EXACTLY What Goes Where

```
DATA TYPE                    → DATABASE                    REASON
─────────────────────────────────────────────────────────────────────
Questions (38k+)             → Cloudflare D1               No quota limits
  (exam, options, answers)     (examcompass-questions)
                                DB ID: 63abfee4-2340-47bd
                                       -a9ad-ebc4a9c50580

User login / signup          → Firebase Auth               Built for auth
User profile / settings      → Firestore (/profiles/)      Per-user doc
User topic stats             → Firestore (/user_topic_stats/)
Mock test results            → Firestore (/mock_results/)
Bookmarks / notes            → Firestore (/documents/)
Battle sessions              → Firestore (/battle_sessions/)
Spaced repetition cards      → Firestore (/review_cards/)
Mistake notebook             → Firestore (/mistake_notebook/)
Leaderboard                  → Firestore (/leaderboards/)
Chapter progress             → Firestore (/chapter_progress/)
Video progress               → Firestore (/video_progress/)
Blog metadata                → Firestore (/content_metadata/)  read-only for users
Static HTML / blog posts     → Firebase Hosting            CDN delivery
Load balancer state          → Cloudflare KV               Edge key-value
```

### Firestore Collections — Full List with Permissions

| Collection | Who Can Read | Who Can Write | Risk |
|---|---|---|---|
| `engine_questions` | Signed-in users (list: max 50) | **Admin only** | HIGH — was abused |
| `user_topic_stats` | Owner only | Owner only | Low |
| `mock_results` | Owner only | Owner only | Low |
| `profiles` | Owner only | Owner only | Low |
| `public_profiles` | Anyone | Owner only | Low |
| `documents` | Owner only | Owner + schema validation | Low |
| `battle_sessions` | Any signed-in | Participants only | Medium |
| `group_battles` | Any signed-in | Signed-in | Medium |
| `leaderboards` | Anyone | Owner only | Low |
| `review_cards` | Owner only | Owner only | Low |
| `mistake_notebook` | Owner only | Owner only | Low |
| `referral_codes` | Anyone | Signed-in | Low |
| `content_metadata` | Anyone | **Admin only** | Medium |
| `system_ping` | Anyone | **Nobody** | Locked |
| `audit_quarantine` | **Admin only** | **Admin only** | High |

---

## 📁 File-by-File Safety Guide

### 🔴 DANGER ZONE — Never touch without explicit user permission

| File | Risk | Why Dangerous |
|---|---|---|
| `firestore.rules` | **CRITICAL** | Wrong rules = all user data exposed OR all users locked out |
| `firestore.indexes.json` | High | Wrong indexes = Firestore queries fail, app breaks |
| `firebase.json` | High | Rewrites/headers control the whole site routing |
| `scripts/seed.sql` | **CRITICAL** | 56MB source of all questions — corruption = data loss |
| `scripts/d1-schema.sql` | High | Schema change = all existing D1 data breaks |
| `wrangler.toml` | High | Wrong D1 binding = questions API fails |
| `.env` | **CRITICAL** | Contains real API keys — never print, never log, never commit |
| `service-account.json` | **CRITICAL** | Firebase admin key — full database access |
| `src/lib/firebase.ts` | High | Changing this breaks auth for all users |
| `src/lib/ai.ts` | High | Controls all AI routing and rate limiting |
| `src/lib/rateLimiter.ts` | High | Removing rate limits = API key exhaustion |

### 🟡 CAUTION — Read carefully before editing

| File | What it does | Risk if broken |
|---|---|---|
| `src/services/questionEngine.ts` | Core question fetch/generate logic (1954 lines) | Quiz feature breaks |
| `src/lib/modelRouter.ts` | Routes AI requests to Groq/Gemini/Cerebras | All AI chat breaks |
| `src/lib/constants.ts` | 155KB — entire syllabus, exam structure | Many features break |
| `scripts/sanity-guard.ts` | Pre-build validator — runs before every deploy | Breaks build pipeline |
| `scripts/turbo-pipeline.ts` | AI question generator (49KB) | Question gen breaks |
| `scripts/blog-generator.ts` | Autonomous blog writer (78KB) | Blog system breaks |
| `public/seo-manifest.json` | All SEO routes — thousands of pages | SEO ranking crashes |

### 🟢 SAFE to edit

| File/Directory | Notes |
|---|---|
| `src/components/**` | UI components — mostly isolated |
| `src/pages/**` | Page components — visual changes only |
| `scripts/d1-push.ts` | Safe to improve — always --dry-run first |
| `README.md` | This file — improve freely |
| `AGENT_SAFETY.md` | This file — improve freely |
| `scripts/DO_NOT_USE_FIREBASE_FOR_QUESTIONS.md` | Documentation only |

---

## ⚡ API Keys — What Each One Does & Limits

### LLM Keys (Used in browser + scripts)

| Variable | Provider | Rate Limit | Used For |
|---|---|---|---|
| `VITE_GROQ_API_KEY` | Groq | 30 RPM, 14,400/day | Fast AI chat (Llama 3.3) |
| `VITE_GEMINI_API_KEY` | Gemini | 15 RPM, 1,500/day | Question gen key #1 |
| `VITE_GEMINI_API_KEY_2` | Gemini | 15 RPM, 1,500/day | Question gen key #2 |
| `VITE_GEMINI_API_KEY_3` | Gemini | 15 RPM, 1,500/day | Question gen key #3 |
| `VITE_GEMINI_API_KEY_4` | Gemini | 15 RPM, 1,500/day | Question gen key #4 |
| `VITE_GEMINI_API_KEY_5` | Gemini | 15 RPM, 1,500/day | Question gen key #5 |
| `VITE_GEMINI_API_KEY_6` | Gemini | 15 RPM, 1,500/day | Question gen key #6 |
| `VITE_GEMINI_API_KEY_7` | Gemini | 15 RPM, 1,500/day | Question gen key #7 |
| `VITE_OPENROUTER_API_KEY` | OpenRouter | Pay-per-use | Fallback model relay |
| `CEREBRAS_API_KEY` | Cerebras | 30 RPM | Fast Llama inference |

**Why 7 Gemini keys?** `turbo-pipeline.ts` runs 30 parallel workers. Each free Gemini key allows 15 requests/minute. 7 keys = 105 RPM effective throughput. All free. Never run `q:turbo` without all 7 keys in `.env`.

**⚠️ VITE_ prefix is required** — keys without VITE_ are not accessible in the browser bundle. Only scripts running in Node.js (like turbo-pipeline.ts) can use non-VITE keys.

### Cloudflare Keys

| Variable | Purpose | Risk if missing |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Account identifier | D1 push fails |
| `CLOUDFLARE_D1_TOKEN` | Write access to D1 database | Cannot push questions |
| `CLOUDFLARE_API_TOKEN` | General API (wrangler auth) | Wrangler commands fail |

**Use `CLOUDFLARE_D1_TOKEN` for d1-push scripts.** The D1 token has write access to the questions database only. The general `CLOUDFLARE_API_TOKEN` has broader access.

### Firebase Keys

**`VITE_FIREBASE_*`** — These are the client-side keys exposed in the browser bundle. They are safe to expose (Firebase SDK uses security rules, not key secrecy). The actual security comes from `firestore.rules`.

**`service-account.json`** — This is the **admin SDK private key**. Never log it. Never send it anywhere. It bypasses all security rules.

---

## 🏗️ Architecture: How the App Actually Works

### Question Flow (The Most Important Thing)

```
User opens Quiz page
        │
        ▼
questionEngine.ts → calls Cloudflare Workers API endpoint
        │              (NOT Firestore — this is critical)
        │
        ▼
Cloudflare Worker → queries D1 database
   (wrangler.toml binding: DB → examcompass-questions)
        │
        ▼
Returns questions to browser as JSON
        │
        ▼
React renders questions with KaTeX (LaTeX rendering)
```

**The `questionEngine.ts` file ALSO imports from Firebase** (for user stats, not questions). This is correct. Do not remove the Firebase import from questionEngine.ts — it's used for tracking user performance per topic.

### AI Chat Flow

```
User asks a question
        │
        ▼
ai.ts → RateLimiter.checkLimit('ai')  ← blocks spam
        │
        ▼
detectTier(question) → T1/T2/T3/T4/T5
        │
        ▼
modelRouter.ts → waterfall:
  T1 (hardest): Gemini 2.0 Flash → Groq Llama 3.3 → Cerebras
  T2 (hard):    Gemini Flash → Groq
  T3 (medium):  Groq → Gemini Flash
  T4 (easy):    Gemini Flash → Groq
  T5 (trivial): Groq (fastest)
        │
        ▼
Response cached in localStorage (24h TTL)
```

### Build & Deploy Flow

```
Developer runs: npm run ssg
        │
        ├── sanity-guard.ts        (validates data integrity)
        ├── sync-blogs.ts          (syncs blog content)
        ├── generate-seo-manifest  (builds route map)
        ├── tsc                    (TypeScript check)
        ├── vite build             (React bundle)
        ├── vite build --ssr       (SSR bundle)
        ├── prerender-parallel.js  (generates static HTML for every route)
        ├── generate-sitemap.js    (sitemap.xml)
        ├── generate-rss.ts        (RSS feed)
        └── ping-indexnow.js       (tells Google about new pages)
                │
                ▼
        firebase deploy
        (uploads dist/ to Firebase Hosting CDN)
```

---

## 🚫 Actions That Require User Permission First

Before doing ANY of these, write to the user: "I need to do X. Is that OK?"

| Action | Why Permission Needed |
|---|---|
| `firebase deploy` | Publishes to production — affects real users |
| `firebase deploy --only firestore` | Updates security rules — can lock out users |
| Editing `firestore.rules` | Security rules — one mistake exposes all data |
| Editing `d1-schema.sql` | Schema migration breaks existing 33k questions |
| Deleting any file in `/scripts/` | Scripts are shared — deletion is permanent |
| Deleting any file in `/src/` | Source code — cannot be recovered without git |
| Adding new npm packages | Increases bundle size — impacts performance score |
| Running `npm run q:turbo` | Consumes all 7 Gemini API keys at max rate |
| Running any script that writes to Firestore | Can exhaust quota and take website down |
| Running any script that writes to D1 in bulk | Could corrupt questions database |
| `git push` / `git commit` | Commits code to repo — irreversible without force push |

---

## 🛡️ Protection Mechanisms Already in Place

### 1. Firestore Security Rules (`firestore.rules`)
- Every collection has explicit read/write rules
- Users can only access THEIR OWN documents
- `engine_questions`: write blocked for all non-admins
- List queries limited to 50 documents maximum

### 2. Rate Limiter (`src/lib/rateLimiter.ts`)
- Built-in client-side rate limiter for AI calls
- Prevents abuse / runaway AI loops in browser
- Fires `spam_shield_trigger` event when limit hit

### 3. AI Model Waterfall (`src/lib/modelRouter.ts`)
- If one AI model fails → automatically tries next
- Prevents single-model failure from breaking chat
- Groq → Gemini → Cerebras → OpenAI (last resort)

### 4. D1 Push Quality Gate (`scripts/d1-push.ts`)
- No A/B/C/D placeholder options
- All 4 options must be non-empty real text
- `correct_answer` must exactly match one option
- Questions already in D1 are skipped (no duplicates)

### 5. Sanity Guard (`scripts/sanity-guard.ts`)
- Runs before every `npm run build`
- Validates SEO manifest integrity
- Checks blog post references
- Blocks deploy if critical checks fail

### 6. Disabled Migration Script (`scripts/migrate-seed-to-firestore.mjs`)
- Replaced with a guard that throws an error
- Any agent that tries to run it will see an error immediately

### 7. Content Security Policy (`firebase.json` headers)
- Strict CSP blocks XSS attacks
- Only whitelisted domains can load scripts/styles
- camera/payment access blocked in Permissions-Policy

---

## 📊 Free Tier Limits — Know Before You Break Them

### Cloudflare (D1 + KV + Workers)
| Resource | Limit | Used for |
|---|---|---|
| D1 reads/day | 5,000,000 | Questions served to users |
| D1 writes/day | 100,000 | Question pushes from scripts |
| D1 max DB size | 10 GB | Questions database |
| KV reads/day | 100,000 | Load balancer state |
| Workers requests/day | 100,000 | API endpoints |

### Firebase (free Spark plan — CANNOT be billed)
| Resource | **Daily Limit** | **What exhausts it** |
|---|---|---|
| Firestore reads | **50,000** | Bulk writing questions (read-before-write) |
| Firestore writes | **20,000** | Bulk writing 38k questions |
| Storage | 1 GB total | User uploads |
| Hosting transfer | 10 GB/month | Website traffic |
| Auth (MAU) | 10,000/month | User signups |

**⚠️ When Firestore quota runs out:**
- Website auth still works (auth is separate quota)
- User data reads/writes FAIL silently or throw errors
- Quiz doesn't break (uses D1, not Firestore)
- Dashboard features (history, stats) fail to load
- **Quota resets at 00:00 Pacific Time = 12:30 PM IST**
- You CANNOT be billed on Spark plan — operations are just blocked

### Google Gemini (per key, free tier)
| Limit | Value |
|---|---|
| Requests per minute | 15 RPM |
| Requests per day | 1,500 |
| Tokens per minute | 1,000,000 |
| Context window | 1M tokens |

### Groq (free tier)
| Limit | Value |
|---|---|
| Requests per minute | 30 RPM |
| Requests per day | 14,400 |
| Tokens per minute | 6,000 |

---

## 🔧 Correct Commands Reference

```bash
# ══ SAFE COMMANDS (can run anytime) ══
npm run dev                          # Start local dev server
npx tsx scripts/d1-push.ts --dry-run # Preview what would push to D1 (no writes)
npm run sanity:check                 # Validate project integrity
npm run q:check-keys                 # Check which Gemini keys have quota left
npm run seo:check                    # Validate SEO metadata

# ══ WRITE COMMANDS (run with care) ══
npx tsx scripts/d1-push.ts           # Push questions to D1 (safe — skips duplicates)
npm run ssg                          # Build static site (no deployment)

# ══ DEPLOYMENT COMMANDS (ask user first) ══
firebase deploy                      # DEPLOY TO PRODUCTION — ask user first
firebase deploy --only firestore     # Updates security rules — ask user first

# ══ CLEANUP COMMANDS (only when needed) ══
node scripts/delete-firestore-questions.mjs  # Delete engine_questions from Firestore

# ══ DANGEROUS COMMANDS (never run without asking) ══
npm run q:turbo                      # Consumes ALL Gemini API quota — ask first
node scripts/migrate-seed-to-firestore.mjs  # ⛔ DISABLED — throws error
```

---

## 🏥 How to Recover from Common Failures

### Firebase quota exhausted (website partially down)
```
DO NOTHING. Wait until 12:30 PM IST. Quota resets automatically.
If questions ended up in Firestore: node scripts/delete-firestore-questions.mjs
```

### D1 question push fails with "unrecognized token"
```
Questions have unescaped SQL single quotes (often in math/LaTeX content).
Use the wrangler-based script: npx tsx scripts/d1-push-remaining.ts
It writes SQL to temp files and passes them via --file (handles encoding correctly).
```

### Build fails at sanity-guard
```
Run: npm run sanity:check
Read the error — usually a missing blog image or broken SEO manifest entry.
Fix the specific issue the guard reports, do NOT remove the guard.
```

### Gemini API key hits quota
```
Run: npm run q:check-keys
Switch to a key that still has quota. All 7 keys rotate automatically in turbo-pipeline.ts.
```

### TypeScript build errors
```
Run: npx tsc --noEmit
Fix the error. Never use @ts-ignore as a shortcut — it hides real bugs.
```

---

## 📦 Project Tech Stack (Actual)

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2 |
| Build tool | Vite | 7.x |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 3.4 |
| Routing | React Router | v7 |
| State | Zustand | 5.x |
| Animation | Framer Motion | 12.x |
| Math rendering | KaTeX + react-latex-next | - |
| 3D | Three.js + React Three Fiber | - |
| Voice | Sherpa-ONNX | 1.13 |
| OCR | Tesseract.js | 7.x |
| PDF | jsPDF + html2pdf | - |
| Mobile | Capacitor | 8.x |
| Desktop | Electron | 40.x |
| Questions DB | Cloudflare D1 (SQLite) | - |
| KV store | Cloudflare KV | - |
| Auth | Firebase Auth | 12.x |
| User data | Firestore | 12.x |
| Hosting | Firebase Hosting | - |
| AI (chat) | Groq + Gemini + Cerebras | - |
| AI (question gen) | Gemini Flash (7 keys) | - |
| Monitoring | Datadog RUM + Browser Logs | 6.x |

---

## 🔑 Environment Variable Rules

1. **`VITE_` prefix = available in browser** (safe to expose via Vite)
2. **No prefix = server/script only** (must NEVER be bundled into browser)
3. Never log any API key to console
4. Never commit `.env` to git
5. `service-account.json` = Firebase admin key — treat like a password

---

*Last updated: June 6, 2026*
*This file must be updated whenever a new incident occurs or architecture changes.*
