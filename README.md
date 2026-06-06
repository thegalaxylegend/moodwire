# 🧭 ExamCompass

> **AI-Powered Exam Preparation Platform for JEE, NEET & Board Exams.**
> Built by a Class 12 student. Deployed on Cloudflare + Firebase.

---

## ⚠️ AI AGENTS — READ THIS FIRST

> 📖 **Quick Safety Entry Point: [AI_NOTE.md](AI_NOTE.md)** (Read before every task)
> 📖 **Full Safety Guide: [AGENT_SAFETY.md](AGENT_SAFETY.md)**
> Contains: real incident log, file danger ratings, API limits, permission requirements, and common AI mistakes vs senior engineer thinking.

```
╔════════════════════════════════════════════════════════════════════╗
║  GOLDEN RULES — MEMORISE BEFORE EDITING ANYTHING                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  RULE 1: Questions → Cloudflare D1 ONLY. NEVER Firestore.         ║
║    DB Name: examcompass-questions                                  ║
║    DB ID  : 63abfee4-2340-47bd-a9ad-ebc4a9c50580                  ║
║    Push   : npx tsx scripts/d1-push.ts                             ║
║                                                                    ║
║  RULE 2: Never run firebase deploy without asking the user.        ║
║  RULE 3: Never edit firestore.rules without written approval.      ║
║  RULE 4: Never delete files in /scripts/ or /src/ without asking. ║
║  RULE 5: Never write bulk data to Firestore — kills the website.  ║
║  RULE 6: scripts/migrate-seed-to-firestore.mjs is DISABLED.       ║
║          It throws an error — do NOT try to fix or re-enable it.  ║
║                                                                    ║
║  Firebase free plan = 50k reads/day. Writing 33k questions to     ║
║  Firestore = website down for 24h. This already happened once.    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🗄️ Database Architecture

### Complete Data Map

| Data | Database | Provider | Free Tier Limit |
|------|----------|----------|-----------------|
| **Questions** (38k+) | D1 (SQLite) | Cloudflare | 5M reads/day, 100k writes/day |
| **User accounts / auth** | Firebase Auth | Google | 10k auth/month (free) |
| **User progress / stats** | Firestore | Google | 50k reads/day, 20k writes/day |
| **User bookmarks / notes** | Firestore | Google | (same as above) |
| **Static HTML / blog** | Firebase Hosting | Google | 10 GB transfer/month |
| **Load balancer state** | Cloudflare KV | Cloudflare | 100k reads/day |
| **Session flags** | Cloudflare KV | Cloudflare | (same as above) |

### ⚠️ Cloudflare D1 Limits (Questions DB)

| Limit | Value |
|-------|-------|
| Max DB size | 10 GB |
| Reads per day | 5,000,000 |
| Writes per day | 100,000 |
| Rows returned per query | 10,000 |
| Max SQL statement size | 100 KB |
| Max file upload per wrangler call | 5 MB |

### ⚠️ Firebase Firestore Limits (User Data Only)

| Limit | Value | Risk |
|-------|-------|------|
| Document reads/day | **50,000** | HIGH — exhausted if questions written here |
| Document writes/day | **20,000** | HIGH — 38k questions = immediate exhaustion |
| Storage | 1 GB | Medium |
| Network egress | 10 GB/month | Low |
| **Quota reset** | **Midnight Pacific (12:30 PM IST)** | Website down until reset if exceeded |

### ⚠️ Firebase Auth Limits

| Limit | Value |
|-------|-------|
| Monthly active users | 10,000 (Spark free plan) |
| Email/password sign-ins | Unlimited |
| Google OAuth sign-ins | Unlimited |
| Phone auth | Limited on free plan |

---

## 🔑 API Keys Used — Full Inventory

```
┌─────────────────────────────────────────────────────────────┐
│  GROUP 1: AI / LLM APIs                                     │
├────────────────────────┬────────────────┬───────────────────┤
│ Key Name               │ Provider       │ Used For          │
├────────────────────────┼────────────────┼───────────────────┤
│ VITE_GROQ_API_KEY      │ Groq           │ Fast LLM (Llama)  │
│ VITE_GEMINI_API_KEY    │ Google Gemini  │ Question gen #1   │
│ VITE_GEMINI_API_KEY_2  │ Google Gemini  │ Question gen #2   │
│ VITE_GEMINI_API_KEY_3  │ Google Gemini  │ Question gen #3   │
│ VITE_GEMINI_API_KEY_4  │ Google Gemini  │ Question gen #4   │
│ VITE_GEMINI_API_KEY_5  │ Google Gemini  │ Question gen #5   │
│ VITE_GEMINI_API_KEY_6  │ Google Gemini  │ Question gen #6   │
│ VITE_GEMINI_API_KEY_7  │ Google Gemini  │ Question gen #7   │
│ VITE_OPENROUTER_API_KEY│ OpenRouter     │ Multi-model relay │
│ CEREBRAS_API_KEY       │ Cerebras       │ Fast inference    │
├────────────────────────┼────────────────┼───────────────────┤
│  GROUP 2: Cloudflare                                        │
├────────────────────────┼────────────────┼───────────────────┤
│ CLOUDFLARE_ACCOUNT_ID  │ Cloudflare     │ Account auth      │
│ CLOUDFLARE_D1_TOKEN    │ Cloudflare     │ D1 write access   │
│ CLOUDFLARE_API_TOKEN   │ Cloudflare     │ General API       │
├────────────────────────┼────────────────┼───────────────────┤
│  GROUP 3: Firebase                                          │
├────────────────────────┼────────────────┼───────────────────┤
│ VITE_FIREBASE_API_KEY  │ Google         │ Firebase client   │
│ VITE_FIREBASE_*        │ Google         │ Auth, Hosting     │
├────────────────────────┼────────────────┼───────────────────┤
│  GROUP 4: External Intelligence                             │
├────────────────────────┼────────────────┼───────────────────┤
│ VITE_EXA_API_KEY       │ Exa AI         │ Web search (AI)   │
│ VITE_WOLFRAM_APP_ID    │ Wolfram        │ Math computation  │
│ VITE_NASA_API_KEY      │ NASA           │ Science content   │
│ VITE_UNSPLASH_ACCESS_KEY│ Unsplash      │ Blog images       │
│ VITE_PIXABAY_API_KEY   │ Pixabay        │ Blog images       │
│ VITE_JINA_API_KEY      │ Jina AI        │ Web reader        │
│ NEWS_API_KEY           │ NewsAPI        │ Blog topics       │
│ SERPER_API_KEY         │ Serper         │ Google search     │
├────────────────────────┼────────────────┼───────────────────┤
│  GROUP 5: Social Media Automation                           │
├────────────────────────┼────────────────┼───────────────────┤
│ X_API_KEY              │ X (Twitter)    │ Auto-post         │
│ X_API_SECRET           │ X (Twitter)    │ Auth              │
│ X_ACCESS_TOKEN         │ X (Twitter)    │ Post tweets       │
│ X_ACCESS_SECRET        │ X (Twitter)    │ Tweet auth        │
│ THREADS_ACCESS_TOKEN   │ Threads/Meta   │ Auto-post         │
│ THREADS_USER_ID        │ Threads/Meta   │ Account ID        │
├────────────────────────┼────────────────┼───────────────────┤
│  GROUP 6: Monitoring                                        │
├────────────────────────┼────────────────┼───────────────────┤
│ VITE_DATADOG_APPLICATION_ID │ Datadog  │ RUM monitoring    │
│ VITE_DATADOG_CLIENT_TOKEN   │ Datadog  │ Browser logs      │
└────────────────────────┴────────────────┴───────────────────┘
```

**Why 7 Gemini keys?**
The `turbo-pipeline.ts` question generator rotates across 7 Gemini API keys in parallel (30 concurrent workers). Each Gemini free key has a 15 RPM (requests per minute) limit. 7 keys × 15 RPM = **105 RPM throughput** for bulk question generation — without paying anything.

---

## 🏗️ Full Architecture Diagram

```
 ┌──────────────────────────────────────────────────────────────┐
 │                        USER (Browser / App)                  │
 └─────────────────────────────┬────────────────────────────────┘
                               │
               ┌───────────────┴──────────────┐
               │                              │
               ▼                              ▼
  ┌────────────────────────┐    ┌──────────────────────────────┐
  │   Firebase Hosting     │    │     Cloudflare Workers       │
  │   (Static HTML / CDN)  │    │     (Dynamic API layer)      │
  │                        │    │                              │
  │ • Landing pages        │    │ GET /api/questions?exam=JEE  │
  │ • Topic pages (SSG)    │    │ GET /api/quiz/:id            │
  │ • Blog posts           │    │ POST /api/results            │
  │ • React SPA bundle     │    │                              │
  └───────────┬────────────┘    └──────────────┬───────────────┘
              │                                │
              │                                ▼
              │                 ┌──────────────────────────────┐
              │                 │      Cloudflare D1           │
              │                 │   (examcompass-questions)    │
              │                 │                              │
              │                 │  38,000+ quality-checked     │
              │                 │  questions for JEE/NEET/Board│
              │                 │                              │
              │                 │  Schema: scripts/d1-schema.sql│
              │                 └──────────────────────────────┘
              │
              ▼
 ┌────────────────────────────────────────────────────────────┐
 │                     Firebase Services                       │
 │                                                            │
 │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
 │  │Firebase Auth│  │  Firestore   │  │Firebase Storage  │  │
 │  │             │  │              │  │                  │  │
 │  │• User login │  │• user_topic_ │  │• User uploads   │  │
 │  │• Google SSO │  │  stats       │  │• Profile photos  │  │
 │  │• Email auth │  │• mock_results│  │                  │  │
 │  │             │  │• profiles    │  │                  │  │
 │  │             │  │• bookmarks   │  │                  │  │
 │  │             │  │• battle data │  │                  │  │
 │  │             │  │ NOT questions│  │                  │  │
 │  └─────────────┘  └──────────────┘  └──────────────────┘  │
 └────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Website Protection — How We Prevent Downtime

### 1. Firestore Security Rules (`firestore.rules`)
The `firestore.rules` file enforces at the database level:
- **`engine_questions` collection**: Only admins (2 hardcoded emails) can write
- **User data**: Users can only read/write their OWN documents (`user_id == auth.uid`)
- **Public data**: Read-only — no unauthenticated writes allowed
- **Query limits**: List operations capped at 50 documents per query

```javascript
// Only these 2 emails can ever write to sensitive collections
function isAdmin() {
  return request.auth.token.email in [
    'thegalaxylegend2007@gmail.com',
    'harshbardhanthakur2009@gmail.com'
  ];
}
```

### 2. D1 Push Script Quality Gate (`scripts/d1-push.ts`)
Before any question enters the database, it passes these checks:

| Check | Rule | Effect |
|-------|------|--------|
| Real options | Options must NOT be bare `A`, `B`, `C`, `D` | Rejected |
| Non-empty options | All 4 options must have actual text | Rejected |
| Answer validation | `correct_answer` must exactly match one option | Rejected |
| Duplicate detection | Questions already in D1 are skipped | Skipped |
| Empty text | `question_text` cannot be blank | Rejected |

### 3. Disabled Dangerous Scripts
`scripts/migrate-seed-to-firestore.mjs` — the script that caused the Firebase quota crash — is **now a guard file that throws an error immediately** if run. Any AI agent that tries to use it will see:
```
Error: ⛔ GUARD: Questions must be pushed to Cloudflare D1, not Firestore!
```

### 4. Sanity Guard (`scripts/sanity-guard.ts`)
Runs automatically before every production build (`npm run build`). Checks:
- SEO manifest is valid
- No broken blog post references
- Critical files exist
- Data integrity

### 5. API Key Rotation (No Single Point of Failure)
7 Gemini API keys are rotated round-robin. If one key hits its rate limit:
- The pipeline automatically switches to the next key
- No interruption to question generation
- If all keys are exhausted, pipeline pauses and retries

### 6. How to Recover if Firebase Quota Is Exceeded

**Symptoms:** Website shows loading spinner, auth fails, user data not saving.

**Cause:** Too many Firestore reads/writes in 24 hours.

**Fix:**
```
Wait until 12:30 PM IST (midnight Pacific Time) — quota auto-resets.
No action needed. Nothing is broken permanently.
```

**Prevention:** Never run bulk write scripts that target Firestore. All bulk data → D1.

---

## 💻 All Commands Reference

### Development
```bash
npm run dev              # Start Vite dev server with HMR
npm run preview          # Preview production build locally
```

### Production Build & Deploy
```bash
npm run ssg              # Full production build (SSG + prerender)
firebase deploy          # Deploy to Firebase Hosting
npm run deploy:rules     # Deploy Firestore security rules only
```

### What `npm run ssg` does (in order):
1. `sanity-guard.ts` — validates data integrity
2. `sync-blogs.ts` — syncs blog posts
3. `generate-seo-manifest.js` — builds SEO route map
4. `tsc` — TypeScript compile check
5. `vite build` — builds React client bundle
6. `vite build --ssr` — builds SSR bundle
7. `prerender-parallel.js` — renders every route to static HTML
8. `generate-sitemap.js` — builds sitemap.xml
9. `generate-rss.ts` — builds RSS feed
10. `ping-indexnow.js` — pings search engines about new content

### Question Database (Cloudflare D1)
```bash
npx tsx scripts/d1-push.ts          # Push questions from seed.sql to D1
npx tsx scripts/d1-push.ts --dry-run # Preview what would be pushed (safe)
```

### Question Generation (AI Pipeline)
```bash
npm run q:turbo              # Generate questions (30 workers, all exams)
npm run q:turbo-jee          # JEE Mains questions only
npm run q:turbo-neet         # NEET questions only
npm run q:turbo-board        # Board exam questions only
npm run q:turbo-dry          # Dry run (no writes, preview only)
npm run q:check-keys         # Check which Gemini keys still have quota
```

### SEO & Content
```bash
npm run seo:regen            # Regenerate SEO manifest
npm run seo:check            # Validate all SEO metadata
npm run seo:indexing         # Submit URLs to Google Indexing API
npm run seo:gsc              # Google Search Console report
npm run seo:ga4              # Google Analytics 4 report
npm run ai:optimize-seo      # AI meta title/description optimizer
npm run ai:repair            # Self-healing: fix broken content
npm run ai:links             # Internal link optimizer
npm run ai:duplicates        # Detect and remove duplicate content
```

### Social Media Automation
```bash
npm run social:threads       # Auto-post recent blogs to Threads
npm run social:shorts        # Generate YouTube Shorts scripts
```

### Monitoring & Cleanup
```bash
node scripts/delete-firestore-questions.mjs   # Clean up wrongly added Firestore questions
npm run sanity:check                          # Run sanity guard manually
npm run doctor                                # React component health check
```

---

## 📂 Project Structure

```
examcompass/
│
├── src/
│   ├── components/
│   │   ├── Chat/              # Exa AI chatbot interface
│   │   ├── seo/               # Auto Schema.org / JSON-LD injection
│   │   └── ui/                # Shared UI components
│   ├── pages/
│   │   ├── public/            # SSG pages (fully rendered for SEO)
│   │   │   ├── LandingPage.tsx
│   │   │   ├── TopicPage.tsx
│   │   │   └── BlogPost.tsx
│   │   └── dashboard/         # SPA pages (post-login, interactive)
│   │       ├── MockTest.tsx
│   │       ├── Analytics.tsx
│   │       └── QuestionBank.tsx
│   ├── services/
│   │   ├── questionService.ts # Reads from Cloudflare D1 via API
│   │   ├── authService.ts     # Firebase Auth wrapper
│   │   └── videoService.ts    # YouTube / video lecture service
│   ├── lib/
│   │   ├── ai.ts              # LLM switching layer (Gemini/Groq/Cerebras)
│   │   └── tts/               # Sherpa-ONNX neural voice engine
│   └── App.tsx                # Root router
│
├── scripts/
│   ├── d1-push.ts             # ✅ Push questions → Cloudflare D1
│   ├── d1-push-remaining.ts   # ✅ Push remaining (via wrangler --file)
│   ├── d1-schema.sql          # D1 table definition
│   ├── seed.sql               # Source of all 38k+ questions
│   ├── turbo-pipeline.ts      # AI question generation (30 workers)
│   ├── bulk-scraper.ts        # Scrape JEE/NEET PYQs
│   ├── sanity-guard.ts        # Pre-build integrity validator
│   ├── blog-generator.ts      # Autonomous blog orchestrator
│   ├── sync-blogs.ts          # Blog sync to public folder
│   ├── prerender-parallel.js  # Parallel SSG renderer
│   ├── generate-seo-manifest.js  # SEO route map builder
│   ├── generate-sitemap.js    # sitemap.xml generator
│   ├── meta-optimizer.ts      # AI SEO optimizer
│   ├── internal-linker.ts     # Internal link optimizer
│   ├── smart-repair.ts        # Self-healing content repair
│   ├── delete-firestore-questions.mjs  # Cleanup Firestore mistake
│   └── migrate-seed-to-firestore.mjs  # ⛔ DISABLED GUARD — do not run
│
├── public/
│   └── seo-manifest.json      # SEO brain: all routes, metadata
│
├── wrangler.toml              # Cloudflare D1 + KV bindings
├── firebase.json              # Firebase Hosting config + rewrites
├── firestore.rules            # Firestore security rules (deployed)
├── .env                       # All API keys (never commit to GitHub)
└── .env.example               # Template showing required keys
```

---

## 📊 Performance Targets

| Metric | Target | Technique |
|--------|--------|-----------|
| LCP (Largest Contentful Paint) | < 0.5s | Inlined CSS shell in index.html |
| CLS (Cumulative Layout Shift) | 0.00 | Size-reserved skeleton elements |
| FID (First Input Delay) | < 20ms | Idle hydration for heavy components |
| SEO Score | 100/100 | Pre-rendered static HTML for all routes |
| Time-to-Interactive | < 1.5s | Code splitting + lazy loading |

---

## 🤖 AI Question Generation Pipeline

```
  TRIGGER: npm run q:turbo (30 parallel workers)
       │
       ▼
  Topic selector → picks under-represented topic from syllabus
       │
       ▼
  LLM (Gemini key #1–7, round-robin rotation)
  Prompt: "Generate 1 MCQ for JEEMains, topic: Rotational Motion,
           difficulty ELO 2050–2250. Return JSON."
       │
       ▼
  ┌── Quality Gate ──────────────────────────────────┐
  │  ✅ Has 4 options?                               │
  │  ✅ Options are NOT bare A/B/C/D?                │
  │  ✅ correct_answer matches one option exactly?   │
  │  ✅ SHA-256 hash is unique (no duplicates)?      │
  │  ✅ explanation present?                         │
  └─────────────────────────────────────────────────┘
       │
       ▼ (pass only)
  Append to scripts/seed.sql
       │
       ▼
  npx tsx scripts/d1-push.ts → Cloudflare D1
```

**Difficulty bands (ELO scale):**

| Band | ELO Range | Description |
|------|-----------|-------------|
| CLASS_8_RECALL | 700–900 | Basic recall, single concept |
| BOARD_EASY | 1100–1400 | Class 10 standard |
| NEET_EASY | 1700–1900 | Single-concept NEET |
| JEE_MAINS_MEDIUM | 2050–2250 | 2-concept chain |
| JEE_ADV_HARD | 2800–3000 | 3–4 chapter synthesis |
| JEE_ADV_EXPERT | 3000–3200 | First-principles derivation |

---

## 🆘 Disaster Recovery

```bash
# 1. Clone repo
git clone https://github.com/thegalaxylegend/examcompass.git
cd examcompass

# 2. Install dependencies
npm install

# 3. Add your API keys to .env (copy from .env.example)

# 4. Start development
npm run dev

# 5. If questions are missing from D1, re-push (safe — skips existing)
npx tsx scripts/d1-push.ts

# 6. Deploy
npm run ssg
firebase deploy
```

### If Firebase quota is exceeded (website down)
```
Wait for 12:30 PM IST — quota resets automatically. No action needed.
You are on Spark (free) plan — you CANNOT be billed. Operations are just blocked.
```

### If Firestore questions were accidentally written
```bash
node scripts/delete-firestore-questions.mjs
# Deletes the engine_questions collection entirely. Safe to run.
```

---

## 🔐 Environment Variables — Complete List

```bash
# === AI / LLM ===
VITE_GROQ_API_KEY=           # Groq (Llama 3) — fast inference
VITE_GEMINI_API_KEY=         # Google Gemini key #1
VITE_GEMINI_API_KEY_2=       # Google Gemini key #2 (rotation)
VITE_GEMINI_API_KEY_3=       # Google Gemini key #3
VITE_GEMINI_API_KEY_4=       # Google Gemini key #4
VITE_GEMINI_API_KEY_5=       # Google Gemini key #5
VITE_GEMINI_API_KEY_6=       # Google Gemini key #6
VITE_GEMINI_API_KEY_7=       # Google Gemini key #7
VITE_OPENROUTER_API_KEY=     # OpenRouter (multi-model relay)
CEREBRAS_API_KEY=            # Cerebras (fast Llama inference)

# === Cloudflare ===
CLOUDFLARE_ACCOUNT_ID=       # Your Cloudflare account ID
CLOUDFLARE_D1_TOKEN=         # D1-specific API token (write access)
CLOUDFLARE_API_TOKEN=        # General Cloudflare API token

# === Firebase ===
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# === External Intelligence ===
VITE_EXA_API_KEY=            # Exa AI web search
VITE_WOLFRAM_APP_ID=         # Wolfram Alpha math
VITE_SEMANTIC_SCHOLAR_KEY=   # Research papers
VITE_NASA_API_KEY=           # NASA (science content)
VITE_UNSPLASH_ACCESS_KEY=    # Blog images
VITE_PIXABAY_API_KEY=        # Blog images (fallback)
VITE_JINA_API_KEY=           # Jina web reader
NEWS_API_KEY=                # NewsAPI (blog topics)
SERPER_API_KEY=              # Serper Google search

# === Social Media ===
X_API_KEY=                   # X (Twitter) app key
X_API_SECRET=                # X app secret
X_ACCESS_TOKEN=              # X account token
X_ACCESS_SECRET=             # X account secret
THREADS_ACCESS_TOKEN=        # Threads (Meta) API token
THREADS_USER_ID=             # Threads account user ID

# === Monitoring ===
VITE_DATADOG_APPLICATION_ID= # Datadog RUM app ID
VITE_DATADOG_CLIENT_TOKEN=   # Datadog client token
VITE_DATADOG_SITE=datadoghq.com
VITE_DATADOG_SERVICE=exam-compass
VITE_DATADOG_ENV=production
```

---

*Built with ❤️ by a Class 12 student preparing for JEE.*
*Platform: React 19 + TypeScript + Vite + Cloudflare D1 + Firebase*
