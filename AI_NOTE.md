# 📌 AI NOTE — ExamCompass
## Universal guide for ALL AI agents: Claude, Gemini, GPT, Cursor, Copilot, etc.
## 🚫 TOKEN SAVING: DO NOT read README.md or AGENT_SAFETY.md unless task is a major database, script, or deployment change.

---

## ⚡ QUICK DECISION — What type of task is this?

```
┌─ Small UI change? (text, colour, layout, icon, spacing)
│   → Safe. Edit the component. No extra reading needed.
│
├─ Fixing a bug in a single file you can see clearly?
│   → Read that file fully first. Then fix. Then verify with user.
│
├─ Anything touching: questions / database / scripts / deploy / API keys?
│   → STOP. Read README.md + AGENT_SAFETY.md. Then act.
│
├─ Adding a new feature / service / route / component that connects to data?
│   → Read README.md Architecture section first. Understand where data lives.
│
├─ Running any script that writes data anywhere?
│   → Show the user what the script does. Get approval. Then run.
│
└─ Confused, unsure, or the task feels bigger than expected?
    → STOP. Ask the user ONE clear question. Do NOT guess.
```

---

## 🚨 THE INCIDENT THAT CREATED THIS FILE

**June 6, 2026 — Website down for hours.**

An AI agent was asked to move questions to the database.
It did not read the architecture. It assumed: "questions = Firestore" (like most apps).
It ran a migration script. In 60 seconds: 66,000 Firestore reads consumed.
Firebase free quota (50k/day) gone. Website broken for all real users.
Recovery required waiting until midnight for quota reset.

**What went wrong:**
- Agent saw Firebase in the project → assumed all data goes to Firebase
- Did not read README.md or any architecture file
- Did not ask "where do questions actually live?"
- Guessed. Guessed wrong. Caused real damage.

**The correct answer**: Questions live in **Cloudflare D1**, not Firebase.
Firebase is only for user auth and per-user data. This is documented in README.md.

**Lesson: Read before you act. Ask before you guess. Never assume from patterns.**

---

## 🗄️ THE #1 RULE — Questions Database

```
Questions = Cloudflare D1.   ALWAYS.   NEVER Firestore.

  DB Name : examcompass-questions
  DB ID   : 63abfee4-2340-47bd-a9ad-ebc4a9c50580
  How to push: npx tsx scripts/d1-push.ts
  Dry-run first: npx tsx scripts/d1-push.ts --dry-run

  scripts/migrate-seed-to-firestore.mjs = ⛔ DISABLED
  It throws an error on purpose. Do NOT fix it. Do NOT run it.
```

**Firebase IS used for:**
- Auth (user login, Google SSO) → `src/lib/firebase.ts`
- Firestore: user progress, bookmarks, mock results, battle data
- Hosting: serves the static website

**Firebase is NOT used for:**
- Questions
- Any bulk data

---

## 🧠 HOW TO THINK FOR EVERY TYPE OF TASK

### For a UI / visual task:
1. Find the component file in `src/components/` or `src/pages/`
2. Read it fully — understand what it already does
3. Make the smallest change that solves the problem
4. Do not change imports, routing, or data sources
5. Do not add new npm packages for simple visual things

### For a data / database task:
1. Read `AGENT_SAFETY.md` — "True Database Architecture" section
2. Understand: which data goes where (D1 vs Firestore vs KV)
3. Identify the exact script or service that handles this data
4. Use `--dry-run` if available before any real write
5. Show the user the plan. Get approval. Then execute.

### For fixing a bug:
1. Read the file with the bug FULLY — all of it, not just the broken line
2. Understand what the code is supposed to do
3. Trace the bug to its root cause — do not treat symptoms
4. Fix the root cause. Do not add workarounds.
5. Check if the same bug exists in similar files

### For adding a new feature:
1. Read `README.md` — architecture section
2. Find similar existing features and follow the same pattern
3. Do not invent new data sources — use what already exists (D1, Firestore, KV)
4. Do not add a new npm package if existing code can do it
5. Ask the user if the feature should work offline / on mobile (Capacitor is used)

### For any script in `/scripts/`:
1. Read the script fully before running it
2. Check if it writes to a database → if yes, get user approval
3. Check if it has a `--dry-run` flag → always use it first
4. Check the `.env` for required tokens before running
5. Never run `seed.sql` directly — use `d1-push.ts`

### For anything deployment-related:
1. STOP. Write to the user: "I need to run X command. This will affect production. OK?"
2. Wait for explicit approval
3. `npm run ssg` is a build command — safe to run (no deploy)
4. `firebase deploy` is a deploy command — always ask first

---

## 🛑 ACTIONS THAT REQUIRE USER PERMISSION — always write and wait

```
firebase deploy                     → publishes to production
firebase deploy --only firestore    → updates security rules  
Editing firestore.rules             → can lock out all users
Editing d1-schema.sql               → can break 33k question records
Editing wrangler.toml               → can break question API
Deleting any file in /scripts/      → scripts are not recoverable easily
Deleting any file in /src/          → source code deletion
Adding npm packages                 → affects bundle size and performance
Running npm run q:turbo             → burns all 7 Gemini API keys at max rate
Running any bulk write script       → can exhaust database quotas
git push or git commit              → changes codebase permanently
```

---

## 🔍 HOW TO READ THIS CODEBASE WITHOUT BURNING TOKENS

**Do not open large files unless you must.**

| File | Size | Open only when... |
|---|---|---|
| `scripts/seed.sql` | 56 MB | Never open. Use `d1-push.ts` to push it. |
| `src/lib/constants.ts` | 155 KB | Only if you need syllabus/exam structure |
| `src/services/questionEngine.ts` | 101 KB | Only if fixing question fetching |
| `scripts/turbo-pipeline.ts` | 49 KB | Only if fixing question generation |
| `scripts/blog-generator.ts` | 78 KB | Only if fixing blog system |

**Small files — safe to open:**
- `src/lib/firebase.ts` — Firebase config (3KB)
- `src/lib/ai.ts` — AI routing (7KB)
- `wrangler.toml` — D1 config (13 lines)
- `firebase.json` — hosting config (4KB)

**To understand architecture without reading everything:**
1. Read `AI_NOTE.md` (this file) — 2 minutes
2. Read `README.md` Architecture section — 3 minutes
3. Read `AGENT_SAFETY.md` Golden Rules — 2 minutes
That's all you need for 90% of tasks.

---

## ⚠️ COMMON AI MISTAKES IN THIS PROJECT — avoid these

| Mistake | Why It Happens | Correct Action |
|---|---|---|
| Writing questions to Firestore | Firebase is visible, assumption made | Check README.md. Use D1. |
| Running migration scripts blindly | Script name sounds right | Read the script first. Check for --dry-run. |
| Editing `firestore.rules` to "fix access" | Firestore error in console | Rules are correct. Check what collection the code is using. |
| Removing rate limiter from AI calls | It "slows down" the AI | Rate limiter prevents API key exhaustion. Keep it. |
| Adding a library for something simple | Quicker to install | Search existing code first. Bundle size matters. |
| Opening `seed.sql` | Need to check questions | Use `npx tsx scripts/d1-push.ts --dry-run` instead. |
| Running `firebase deploy` without asking | Task seems to require it | Always ask first. It's live production. |
| Guessing which database to use | No file read | Read README.md or AGENT_SAFETY.md. Then act. |
| Editing `CLAUDE.md` or `AI_NOTE.md` | Trying to "improve" them | Only edit these if the user specifically asks. |

---

## 🧠 LONG CONVERSATION WARNING — What Small AI Models Forget Mid-Task

**This is the #1 cause of mistakes in this project.**

Small AI models (and even large ones) lose context in long conversations.
After 10–20 messages they forget rules they read at the start.
They start making assumptions again. They drift from the original task.

### Signs you are forgetting context — stop and re-read AI_NOTE.md if any of these apply:

```
❌ You are about to write to a database but don't remember which one
❌ You have been working for many steps and the task feels unclear
❌ You are not sure if you have user permission for the next step
❌ You just completed one sub-task and are about to start another
❌ The user sent a new message mid-workflow that changed direction
❌ You are about to run a script and you're not 100% sure what it does
❌ You forgot what the original task was
```

**When any of the above happens:**
1. Stop what you are doing
2. Re-read this file (AI_NOTE.md)
3. Confirm the next step with the user before continuing

### What small AI models specifically forget during long workflows:

| What gets forgotten | When it gets forgotten | Result |
|---|---|---|
| Questions go to D1, not Firestore | After many messages about other things | Writes questions to Firestore → site down |
| `firebase deploy` needs permission | After getting deep into a build task | Deploys to production without asking |
| `--dry-run` before real writes | When in a hurry to finish | Corrupts or duplicates database records |
| The user said "don't touch X file" | After 15+ messages | Edits the exact file the user said to avoid |
| The original task scope | When fixing a bug leads to another bug | Rewrites 5 files when 1 line was needed |
| Which files are dangerous | After a long safe-editing session | Edits firestore.rules or d1-schema.sql |
| That the rate limiter must stay | When "optimising" the AI service | Removes rate limiter → API keys burn out |
| That seed.sql is 56MB | When trying to check question format | Opens seed.sql → freezes editor |
| That migrate-seed-to-firestore.mjs is disabled | When asked to "run the migration" | Tries to fix the guard, runs it → site down |

### The Mid-Task Checkpoint Rule

**After every 5 actions, pause and ask yourself:**

```
1. What was the original task the user asked for?
2. Have I stayed inside that scope?
3. What database am I using — is it still D1 for questions?
4. Is my next action destructive? Do I have permission?
5. Does the user know what I just did? Should I report first?
```

If you cannot answer all 5 — report to the user before continuing.

### For multi-step tasks (migrations, builds, deploys):

Always announce the full plan FIRST before doing anything:
> "I am going to do: (1) X, (2) Y, (3) Z. Is that OK?"

Wait for the user to say yes. Then do step 1 only. Report. Then step 2. Report. Etc.
Never do all steps silently and report at the end — something will go wrong and you won't be able to undo it.

---

## ✅ SELF-CHECK BEFORE EVERY ACTION

Ask yourself before writing any code or running any command:

1. **Have I read the relevant file fully** (not just skimmed)?
2. **Do I know exactly which database** this data belongs in?
3. **Am I about to write to a database** — did the user approve?
4. **Is there a `--dry-run` flag** I should use first?
5. **Does this change affect production** for real users?
6. **Am I guessing** about anything? → If yes, ask the user.
7. **Have I checked** if this pattern already exists in the codebase?
8. **Am I still doing the original task** or have I drifted into something else?
9. **Have I been working for a long time?** → Re-read AI_NOTE.md now.
10. **Can this action be undone?** If no — ask user first.

If any answer is "no" or "not sure" — stop and resolve it before proceeding.

---

## 🚨 WHEN YOU SEE AN ERROR — Correct Response for Each Type

AIs often respond to errors in the wrong way. Here is the correct response for every common error:

| Error you see | WRONG response | CORRECT response |
|---|---|---|
| `FirebaseError: Missing or insufficient permissions` | Edit firestore.rules | Check WHICH collection the code is reading. The rules are correct. The code is using the wrong collection. |
| `FirebaseError: Quota exceeded` | Increase quota / retry | STOP. Do not retry. Wait for quota reset at 12:30 PM IST. Tell user to wait. |
| `auth/invalid-api-key` | Edit src/lib/firebase.ts | Check .env file — VITE_FIREBASE_API_KEY is missing or wrong |
| `CLOUDFLARE 7403 unauthorized` | Change the code | Check CLOUDFLARE_D1_TOKEN in .env — it's missing or expired |
| `unrecognized token` in D1 | Edit the SQL manually | Use `npx tsx scripts/d1-push-remaining.ts` — it handles SQL encoding via wrangler |
| `TypeScript error` anywhere | Add `@ts-ignore` | Fix the actual type error. Never use @ts-ignore. |
| `Module not found` | Install the npm package | Check if it already exists under a different name. Check package.json first. |
| `RateLimitError` from AI | Remove the rate limiter | Do NOT remove the rate limiter. It protects API keys. The user has hit the daily limit — tell them to wait. |
| Build fails at `sanity-guard` | Remove or skip the guard | Read the guard's error message. Fix what it's complaining about. The guard is correct. |
| `DAILY_LIMIT_REACHED` in AI chat | Remove the limit check | Do NOT touch the limit. This is the rate limiter working correctly. |
| Firestore writes failing silently | Add more writes / retry | Quota is likely exhausted. Check Firebase console. Tell user to wait for reset. |

---

## 🚫 FILES THAT ARE AUTO-GENERATED — Never Edit Manually

These files are **overwritten automatically** by build scripts.
Editing them manually is useless — they will be reset on next build.
If you need to change their content, edit the SCRIPT that generates them.

| File | Generated by | Edit this instead |
|---|---|---|
| `public/seo-manifest.json` | `scripts/generate-seo-manifest.js` | The generate script |
| `public/sitemap.xml` | `scripts/generate-sitemap.js` | The generate script |
| `public/robots.txt` | Build pipeline | Only edit if user asks explicitly |
| `dist/**` (entire folder) | `npm run ssg` | **Never touch dist/. Always edit src/** |
| `dist/server/**` | Vite SSR build | Never touch |
| `public/rss.xml` | `scripts/generate-rss.ts` | The generate script |

---

## 📱 MOBILE + SSR CONTEXT — This App Runs in 3 Environments

**This is critical. Code that works on web can silently break on mobile or during build.**

| Environment | When | What breaks |
|---|---|---|
| Browser (web) | Normal website use | Most things work fine here |
| Capacitor (Android/iOS) | Mobile app | `window.open()`, direct URLs, some Web APIs |
| Node.js (SSR/build) | During `npm run ssg` | `window`, `document`, `localStorage`, all browser APIs |

**Rules:**
1. Any code that uses `window`, `document`, `localStorage` MUST have a `typeof window !== 'undefined'` guard — this already exists in critical files. Do NOT remove these guards.
2. For links that open in browser on mobile → use `@capacitor/browser`, not `window.open()`
3. Do NOT use `localStorage` in services that run during SSR — use memory fallback
4. The `src/lib/firebase.ts` already handles this correctly — do not change it

---

## ✔️ VERIFICATION BEFORE SAYING "DONE"

**Never tell the user "done" without verifying. This is how bugs get shipped to production.**

Before marking any task complete:

```
For code changes:
  □ Does the TypeScript compile? (npx tsc --noEmit)
  □ Did you remove all console.log / debug code you added?
  □ Did you check if similar files need the same change?
  □ Does the change work for both logged-in and logged-out users?

For database changes:
  □ Did you run --dry-run first and check the output?
  □ Is the count of records correct after the operation?
  □ Did you verify with a SELECT query?

For script runs:
  □ Did the script exit without errors?
  □ Did you check the output/log for warnings?
  □ Did you verify the result (not just assume it worked)?

For deploy:
  □ Did npm run ssg complete without errors?
  □ Did you check the deployed site actually loads?
```

If you skipped any box — do not say "done". Finish the check first.

---

## 🐛 WHEN USER REPORTS A BUG — How to Think

**Most AI mistakes when fixing bugs: they rewrite too much.**

```
Step 1: Read the error message FULLY. All of it. Every word.
Step 2: Find the ONE file that contains the bug — read it fully.
Step 3: Trace the bug to its ROOT CAUSE.
Step 4: Make the SMALLEST possible change that fixes the root cause.
Step 5: Check if any other files depend on what you changed.
Step 6: Verify the fix. Tell the user exactly what you changed and why.
```

**Do NOT:**
- Rewrite the whole component to fix a one-line bug
- Add try-catch to hide the error without fixing it
- Add `|| null` or `?.` everywhere to suppress the crash
- Install a new library to fix something the existing code can do
- Change unrelated code "while you're in there"

---

## 🧹 CODE QUALITY RULES

These are non-negotiable. Do not break them even "temporarily":

```
❌ Never use @ts-ignore  — fix the actual type error
❌ Never use any as a type  — unless absolutely unavoidable and commented why
❌ Never leave console.log in production code  — remove before saying done
❌ Never use window.alert() or window.confirm()  — breaks in SSR and mobile
❌ Never hardcode API keys in code  — always use import.meta.env.VITE_*
❌ Never commit .env or service-account.json  — already in .gitignore
❌ Never edit files in dist/  — they are overwritten on next build
❌ Never use require() in TypeScript files  — this is an ESM project
❌ Never skip the sanity-guard to force a build to pass  — fix what it reports
```

---

## 📁 KEY FILES REFERENCE

| File | What it is | Risk |
|---|---|---|
| `README.md` | Full architecture, tech stack, commands | Read-only |
| `AGENT_SAFETY.md` | Safety rules, incident log, file danger ratings | Read-only |
| `AI_NOTE.md` | This file — entry point for all AIs | Read-only |
| `scripts/d1-push.ts` | Push questions to D1 (correct method) | Safe with --dry-run |
| `scripts/migrate-seed-to-firestore.mjs` | ⛔ Disabled guard — do not touch | DANGER |
| `firestore.rules` | Firestore security rules | Needs permission |
| `d1-schema.sql` | D1 table definition | Needs permission |
| `.env` | API keys — never log, never commit | CRITICAL |
| `service-account.json` | Firebase admin key — never expose | CRITICAL |

---

## 30-Second Project Overview

```
ExamCompass = JEE / NEET exam prep for Indian students.

Built 100% by AI. Owner is a Class 12 student. Zero budget — all free tiers.

Stack:  React 19 + TypeScript + Vite
        Cloudflare D1 (questions) + Cloudflare Workers (API)
        Firebase Auth (users) + Firestore (user data) + Firebase Hosting

Quotas to protect:
  Firestore: 50k reads/day — exhausted = website partially down
  Gemini keys: 1,500 req/day each × 7 keys = 10,500/day total
  D1: 5M reads/day — very safe for questions

The website is live. Real students use it. Mistakes have real consequences.
```

---

## 🧠 HOW A SENIOR ENGINEER THINKS vs HOW AI BEHAVES

This is the most important section for avoiding mistakes on a live production website.
A world-class senior engineer at a top startup would **never** make these mistakes.
AIs make them constantly. Read this every time you start a task.

---

### MISTAKE 1 — AI Guesses the Architecture. Engineer Reads It.

**AI does this:**
> Sees Firebase in the codebase → assumes all data goes to Firebase → migrates questions to Firestore → website down.

**Senior engineer does this:**
> Opens README.md. Reads the architecture section. Understands where each type of data lives. Then acts with certainty.

**Rule for this project:** If you don't know where data lives → read README.md first. Never assume.

---

### MISTAKE 2 — AI Treats Symptoms. Engineer Finds the Root Cause.

**AI does this:**
> Gets `TypeError: Cannot read property 'map' of undefined` → adds `?.` everywhere → error stops → says "fixed" → the data is still missing, now just silently.

**Senior engineer does this:**
> Asks: "Why is this undefined? Where does this data come from? Is it a timing issue, a missing fetch, or a wrong data path?" Fixes the actual cause.

**Rule:** Never suppress an error with `?.`, `|| []`, or `try-catch` without understanding WHY the data is missing.

---

### MISTAKE 3 — AI Installs Libraries. Engineer Uses Existing Code.

**AI does this:**
> Needs to format a date → installs `dayjs` → bundle size increases → Lighthouse score drops.

**Senior engineer does this:**
> Searches the existing codebase for date formatting. Checks if `Intl.DateTimeFormat` (built-in browser API) can do it. Only installs if truly needed.

**Rule:** Before `npm install anything` → search the existing code. Check if a browser API works. Ask the user.

---

### MISTAKE 4 — AI Starts Writing. Engineer Reads First.

**AI does this:**
> Gets asked to "add a video progress tracker" → immediately starts writing code → creates a new service → doesn't notice `src/services/videoProgressService.ts` already exists with exactly this feature.

**Senior engineer does this:**
> Before writing any code, searches for: "does this already exist?" Runs a text search, looks at the services folder, checks the existing patterns.

**Rule:** Before writing new code → search the codebase for similar patterns. 9 out of 10 times it already exists.

---

### MISTAKE 5 — AI Makes Big Changes. Engineer Makes the Smallest Change.

**AI does this:**
> Asked to fix a button label → refactors the entire component → renames props → changes the state management → "improves" 8 other things → introduces 3 new bugs.

**Senior engineer does this:**
> Changes the one line. Nothing else. Ships it.

**Rule:** Make the minimum change that solves the exact problem. Touch nothing else. "While I'm in there" is how bugs are born.

---

### MISTAKE 6 — AI Ignores the Business Reality. Engineer Always Knows the Stakes.

**AI does this:**
> Treats a Firestore quota error as a technical problem → tries to retry → makes it worse → doesn't understand that 1,000 students cannot study right now.

**Senior engineer does this:**
> Immediately thinks: "How many users are affected? Is the site completely down or partially? What's the fastest safe fix?" Communicates to the user first, then fixes.

**Rule for this project:** This is a live exam prep website. Students are studying for JEE/NEET — India's most competitive exams. Every minute of downtime = students cannot practice. Every data corruption = wrong answers shown. This is not a toy project.

---

### MISTAKE 7 — AI Doesn't Think About Rollback. Engineer Always Plans the Exit.

**AI does this:**
> Runs `firebase deploy` → there is a bug → can't easily undo → all users affected.

**Senior engineer does this:**
> Before any irreversible action: "What's my rollback plan? What if this goes wrong?" For firebase deploy: knows that the previous version can be restored via Firebase console. For database writes: always uses INSERT OR IGNORE, never DELETE without a backup.

**Rule:** Before any irreversible action, think: "How do I undo this in 60 seconds if it breaks?" If you don't have an answer → ask the user.

---

### MISTAKE 8 — AI Assumes It Worked. Engineer Verifies.

**AI does this:**
> Runs a database script → sees "Process exited with code 0" → says "Done! All questions pushed." → 40% of questions actually failed silently.

**Senior engineer does this:**
> After every operation, **verifies the actual result**. Runs a COUNT query. Checks the logs. Looks for warnings. Never trusts "no error = success."

**Rule:** Always verify with evidence: run a SELECT COUNT(*), check the logs, reload the page. "Seems to have worked" is not verification.

---

### MISTAKE 9 — AI Deletes "Unused" Code. Engineer Investigates First.

**AI does this:**
> Sees `migrate-seed-to-firestore.mjs` and thinks "this is old migration code, I'll clean it up" → deletes the guard that was protecting the database → next AI runs the migration → site breaks.

**Senior engineer does this:**
> Never deletes code without understanding WHY it's there. Reads it. Looks at git history. Asks if it's needed.

**Rule:** The disabled scripts in this project (`migrate-seed-to-firestore.mjs`) are INTENTIONALLY broken. The disable is the protection. Do not "fix" or delete them.

---

### MISTAKE 10 — AI Pattern-Matches Without Reading. Engineer Understands Before Acting.

**AI does this:**
> Sees `import { db } from '../lib/firebase'` in questionEngine.ts → assumes questions are in Firebase → tries to add a question to Firebase collection → wrong.

**Senior engineer does this:**
> Reads how `db` is actually used in that file. Sees it's used for user stats (topic_stats, profiles) — not for questions. Questions are fetched from a different API endpoint.

**Rule:** A single import at the top of a file does NOT tell you where all data lives. Read how the import is actually used.

---

### MISTAKE 11 — AI Optimises Prematurely. Engineer Ships a Working Solution First.

**AI does this:**
> Asked to add a simple loading spinner → spends 20 messages implementing a perfect skeleton loader with animation system, CSS variables, custom hooks, and Framer Motion integration → still hasn't fixed the original bug.

**Senior engineer does this:**
> Ships the simple `<div>Loading...</div>` version that works. Then improves if needed.

**Rule:** Make it work first. Make it good second. Make it perfect if the user asks.

---

### MISTAKE 12 — AI Does Not Think About Other Users' Data. Engineer Always Thinks Multi-Tenant.

**AI does this:**
> Writes a Firestore query without a `where('user_id', '==', userId)` filter → query returns ALL users' data → privacy violation.

**Senior engineer does this:**
> Immediately asks: "Is this data per-user or shared?" Never fetches a collection without scoping it to the current user unless it's genuinely public data.

**Rule:** Every Firestore read/write must be scoped to the authenticated user unless it's explicitly public data (like leaderboards). Check `firestore.rules` to understand what is public.

---

### MISTAKE 13 — AI Uses `console.log` and Forgets. Engineer Never Ships Debug Code.

**AI does this:**
> Adds 15 `console.log` statements while debugging → says "fixed" → logs remain in production → users' data is printed to browser console → performance hit.

**Senior engineer does this:**
> Uses the debugger or a proper logging tool. Before marking done, removes ALL debug code added during investigation.

**Rule:** Before saying "done" — search the file for `console.log` statements you added. Remove them. All of them.

---

### MISTAKE 14 — AI Writes Comments That State the Obvious. Engineer Writes WHY.

**AI does this:**
```typescript
// Increment count by 1
count = count + 1;
```

**Senior engineer does this:**
```typescript
// ELO system requires minimum 1 attempt before calculating accuracy
count = count + 1;
```

**Rule:** Comments should explain WHY, not WHAT. The code already shows what it does.

---

### MISTAKE 15 — AI Doesn't Think About Quota/Cost. Engineer Always Does.

**AI does this:**
> Makes 7 separate Firestore reads to get a user's full profile → on a page with 1000 users viewing per day = 7,000 Firestore reads/day → quota gone in 7 days.

**Senior engineer does this:**
> Fetches one document with all the data. Or batches the reads. Always thinks: "If 1000 users do this, what's the cost?"

**Rule for this project:** Free tier only. Firestore = 50k reads/day. Every query matters. Batch reads when possible. Never query in a loop.

---

### THE SENIOR ENGINEER MINDSET — 7 Questions Before Every Action

```
1. "Do I fully understand what this code does before I change it?"
   → If no: read it. Don't touch it until you do.

2. "What is the smallest change that solves this correctly?"
   → Don't change what doesn't need changing.

3. "What breaks if this goes wrong? How many users are affected?"
   → This is a live site with real exam students. Treat it that way.

4. "How do I roll this back in 60 seconds if it fails?"
   → If you can't answer: tell the user before proceeding.

5. "Am I reading actual data/code, or am I assuming?"
   → Verify with evidence. Always.

6. "Does something like this already exist in the codebase?"
   → Search before building.

7. "When this is done, will I be able to prove it works?"
   → Not "I think it works." Prove it.
```

---

**Final rule: When in doubt — stop, read, ask. This project cannot afford guesses.**

*All three docs: AI_NOTE.md (this) + README.md + AGENT_SAFETY.md*

