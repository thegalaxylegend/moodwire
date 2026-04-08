# Jules Autonomous AI Pipeline & Self-Healing Brain

The Jules system is not just a simple generator; it is a massive 26-task autonomous closed-loop AI agent. Operating via GitHub Actions (`daily-blog-automation.yml`), Jules runs daily to queue content, generate blogs, patch errors, analyze its own failures, optimize SEO, and announce updates across platforms.

Here is the comprehensive breakdown of the entire 26-step autonomous cycle.

---

## Phase 1: Content Strategy & Generation

**Task 1 – Build Queue (`chapter-queue-builder.ts`)**
Scans the current syllabus database and content gaps to intelligently select what topics need coverage next.

**Task 2 – Generate Blogs (`blog-generator.ts`)**
The heavy lifter. Connects to multiple LLMs (Groq, Gemini, HF) to draft long-form, highly technical study guides and notes based on the prompt strategy.

**Task 2.5 – Patch Generator (Self-Healing) (`patch-generator.ts`)**
First-line self-healing. Intercepts minor generation quirks right after generation and applies real-time patches to fix syntax before moving forward.

**Task 3 – Sync Firestore (`firestore-uploader.ts`)**
Uploads newly created content metadata into the Firestore database to keep the client application instantly synced.

## Phase 2: SEO & Live Question Ecosystem

**Task 4 – Regenerate SEO Manifest (`npm run seo:regen`)**
Rebuilds the sitemaps and manifest structures to ensure search engines recognize the newly generated pages.

**Task 5 – Populate Questions (Live Generation) (`populate-questions.ts`)**
Dynamically generates live interactive test questions (MCQs, traps) that correlate directly with the newly minted study guides.

**Task 6 – Repair Images (`repair-images.js`)**
Verifies that all blog cover images and diagram references are intact. Generates missing assets using visual AI via Hugging Face.

## Phase 3: Content Intelligence & Optimization

**Task 7 – Content Freshness Auto-Update (`auto-refresh-blogs.ts`)**
Scans older blogs that are slipping in rankings and injects updated content or new explanations to revive their "freshness" score.

**Task 8 – Smart Auto-Repair (`smart-repair.ts`)**
A secondary self-healing daemon. Fixes any markdown rendering, LaTeX math blocks, or Mermaid.js charts that the LLMs failed to format correctly.

**Task 9 – Generate Schema Markup (`generate-schema.ts`)**
Injects strict JSON-LD Schema markup into blogs for rich Google snippets (like FAQ schemas, Course schemas, etc.).

**Task 10 – Quality Trends Analysis (`quality-tracker.ts`)**
Evaluates the aggregate scores of generated content vs. historical data to determine if the pipeline is improving or degrading over time.

**Task 11 – Internal Linking Optimizer (`internal-linker.ts`)**
Automatically wires up contextual semantic links between the new blog and older blogs, building topic clusters without human intervention.

**Task 12 – Duplication Checker (`duplication-checker.ts`)**
Runs a similarity algorithm to ensure that the AI hasn't accidentally generated a topic identical to a pre-existing page.

## Phase 4: Autopsy & AI Evolution (The Brain)

**Task 13 – Failed Blog Autopsy (`failed-autopsy.ts`)**
If any generation step fails or scores too low, this script dissects the failure logs, maps the root cause, and flags it so the AI doesn't repeat the mistake.

**Task 14 – Content Pattern Analysis (`content-patterns.ts`)**
Extracts common behavioral patterns in the LLM outputs. Determines what linguistic phrasing performs best and what structures flop.

**Task 15 – Self-Documenting Changelog (`self-changelog.ts`)**
The AI writes its own changelog detailing what it learned and changed during the current daily run.

**Task 16 – Google Search Console Intelligence (`google-search-console.ts`)**
Pulls indexing data directly from Google to see what keywords the site is actually ranking for vs. the target keywords.

**Task 17 – Search Opportunity Optimization (`meta-optimizer.ts`)**
Uses Gemini to rewrite meta titles and descriptions for maximum CTR based on the search intelligence gathered in Task 16.

**Task 18 – Syllabus Completion Stats (`syllabus-stats.ts`)**
Updates the global dashboard metrics on how close the system is to completely covering the targeted academic syllabus.

**Task 19 – Prompt Evolution (THE BRAIN) (`prompt-evolution.ts`)**
The most critical AI component. It takes all the intelligence gathered (autopsies, trends, patterns, search stats) and rewrites its own core generation prompts (`evolved-prompt.json`). The AI literally reprograms itself daily to be smarter.

**Task 20 – Content Decay Detection (`content-decay.ts`)**
Identifies legacy posts that have stopped getting traffic and queues them up to be completely rewritten on the next run.

## Phase 5: Distribution & Quality Gates

**Task 21 – Automated Social Distribution (𝕏 & 🧵)**
Packages the best takeaways from the new blogs and automatically posts them to X (Twitter) and Threads without user interaction.

**Task 22 – Final Sanity Guard (`sanity-guard.ts`)**
The absolute final check. Scans payload structures to ensure nothing will break the React frontend build before it pushes to Git.

**Quality Gate Check (Deployment)**
A bash script evaluates the reports. If the average score is >= 90, it automatically creates a commit (`chore(jules): [Date]...`) and triggers Cloudflare and Google Indexing APIs. If < 90, the deployment is blocked.

## Phase 6: Deep System Monitoring

**Task 23 – AI Log Autopsy (Auditor) (`monitor-autopsy.ts`)**
An independent Llama-70b/Groq instance audits the entire GitHub Action `run.log`, acting as an external auditor looking for "Critical Logic Flaws" or pipeline stalls.

**Tasks 24, 25, 26 – Discord Pulse (`discord-pulse.ts`)**
Sends out separate operational pulse checks to the admin Discord server:
- `Task 24`: Updates regarding newly deployed content.
- `Task 25`: Updates regarding older content that was intelligently refreshed.
- `Task 26`: The overarching System Pulse Audit (reporting the Autopsy results, overall health, and evolution stats).
