# 🧭 Exam Compass

> **The World's Fastest, AI-Driven Exam Preparation Platform.**
> *Optimized for <0.5s LCP, 100% SEO Indexability, and Adaptive Learning.*
>
> 🚀 **Read our [World-Class SEO Strategy (REED.md)](file:///c:/Users/Admin/Downloads/Desktop/REED.md)**
> 🥇 **Learn how to [Rank Top 1-2 on Google (RANKING_GUIDE.md)](file:///c:/Users/Admin/Downloads/Desktop/RANKING_GUIDE.md)**
> 🔥 **Monitor the [Jules Autonomous Pipeline (jules_self_healing_system.md)](file:///c:/Users/Admin/Downloads/Desktop/jules_self_healing_system.md)**



Exam Compass is a next-generation EdTech platform designed to crack competitive exams like **JEE MAINS**. It combines a **Hybrid SSG/SPA Architecture** with a powerful **AI Question Engine** to deliver instant page loads for search engines while providing a rich, interactive application for users.

---

## 🚀 Key Features

### 1. Hybrid Architecture (The "Best of Both Worlds")
*   **Public-Facing Pages (SSG):** All landing pages, subject hubs, and topic pages are **Statically Generated** at build time. This ensures Google sees fully rendered HTML instantly, achieving a **100/100 SEO Score**.
*   **Dashboard (SPA):** Once logged in, the application behaves as a smooth **Single Page Application (SPA)**, ensuring no page reloads during mock tests or analytics review.

### 2. ⚡ Extreme Performance Engineering
*   **Zero-Latency Boot Shell:** Crucial UI skeletons and Critical CSS are **inlined directly into `index.html`**. The browser paints the "Welcome" screen in **<0.5s** (First Contentful Paint), even before the JavaScript bundle downloads.
*   **Predictive Preloading:** Critical assets (fonts, hero images) are preloaded using `<link rel="preload">` to eliminate network waterfalls.
*   **Idle Hydration:** Heavy components (Chatbot, Analytics) are deferred using `requestIdleCallback`, ensuring the main thread stays free for user interaction.

### 3. 🧠 AI-Powered Question Engine
*   **Generation Pipeline:** Questions are generated via LLMs (Gemini/Groq) but pass through a rigorous pipeline:
    1.  **Generation:** AI creates a question based on a specific syllabus topic.
    2.  **Deduplication:** SHA-256 Hashes of question text prevent duplicates.
    3.  **Triple Verification:** A separate AI agent reviews the question 3 times for accuracy, solvable options, and conceptual correctness.
    4.  **Storage:** Only verified questions are saved to Firestore.
*   **Adaptive Difficulty:** The engine tracks user performance (weakness score) per topic and dynamically adjusts the specificty and difficulty of generated questions.

### 4. 🤖 Jules: Autonomous AI Pipeline
*   **Self-Healing Architecture:** Detects and repairs broken images, malformed metadata, and broken links autonomously.
*   **Multi-Agent Orchestration:** Dispatches specialized tasks to Claude (Creative), DeepSeek (Technical), and Perplexity (Research).
*   **Sanity Guard:** Every deployment passes through a 178-point validation gate ensuring 100% data integrity.

### 5. 🎙️ Neural Voice Interactive Hub
*   **On-Device TTS:** Integrated Sherpa-ONNX neural engine for lag-free, high-fidelity academic narration.
*   **Adaptive Tutoring:** AI-driven voice interactions for solving complex Physics/Math problems in real-time.

### 6. 🔍 Strict Technical SEO & Programmatic Pages
*   **Manifest-Driven Generation:** A custom script (`scripts/generate-seo-manifest.js`) builds a massive JSON map of every possible route.
*   **Programmatic SEO:** Thousands of unique, indexable pages for every micro-topic (e.g., "Rotational Motion").

---

## 🛠️ Technical Deep Dive

### The Build Pipeline (`npm run ssg`)
We don't just run `vite build`. Our custom SSG pipeline performs the following steps:
1.  **Build Client:** Compiles the React app for production.
2.  **Build SSR:** Compiles a Node.js-compatible version of the app for server rendering.
3.  **Prerender (`scripts/prerender-all.js`):**
    *   Loads the `seo-manifest.json`.
    *   Bootstraps a virtual DOM environment.
    *   Renders every route to a physical `index.html` file.
    *   Injects dynamic Metadata (Title, Description, H1) into the HTML.
    *   **Result:** A `dist` folder containing thousands of static HTML files ready for global CDN caching.

### The "Zero-Latency" Shell
Located in `index.html`, this technique involves:
*   **Inlined CSS:** No external stylesheet network request needed for the first paint.
*   **Static DOM:** HTML elements matching the design skeleton are hardcoded.
*   **React Hydration:** When React loads, it "hydrates" this existing static HTML, making it interactive without a visible layout shift (CLS = 0).

---

## 💻 Development Commands

### 1. Start Development Server
```bash
npm run dev
```
Runs the Vite dev server with Hot Module Replacement (HMR).

### 2. Run Full Production Build (SSG)
```bash
npm run ssg
```
**CRITICAL:** This command must be run before deployment. It generates the static HTML files necessary for SEO.
*   Validates SEO Manifest
*   Builds Client & Server bundles
*   Prerenders all routes

### 3. Populate Question Bank
```bash
npx ts-node scripts/populate-questions.ts
```
Uses the Admin SDK to bulk-generate questions for specific exams/subjects using the AI engine.

### 4. Deploy to Firebase
```bash
firebase deploy
```
Uploads the `dist` folder to Firebase Hosting. The `firebase.json` is configured to serve static HTML files first.

### 5. Run Jules Autonomous Pipeline
```bash
npm run jules:audit    # Full system sanity check
npm run jules:blog     # Orchestrate blog generation
npm run jules:healing  # Execute self-healing protocols
```
Processes the automated content queue, validates output quality, and pushes updates to production.

---

## 📂 Project Structure

```
├── public/
│   ├── seo-manifest.json     # The "Brain" of our SEO strategy
│   └── sitemap.xml           # Generated map for Googlebot
├── .agent/
│   └── skills/               # Specialized AI Capability Sets
├── scripts/
│   ├── social/               # Auto-Social (Shorts, Threads, Reels)
│   ├── blog-generator.ts     # Jules Core Orchestrator
│   ├── meta-optimizer.ts     # SEO Fine-Tuning
│   └── patch-generator.ts    # Self-Healing Script
├── src/
│   ├── components/
│   │   ├── Chat/             # Exa AI Interface
│   │   └── seo/              # Auto-Schema & JSON-LD
│   ├── lib/
│   │   ├── tts/              # Sherpa-ONNX Voice Core
│   │   └── ai.ts             # LLM Switching Layer
│   ├── pages/
│   │   ├── public/           # SSG Targets
│   │   └── dashboard/        # SPA Targets
│   └── App.tsx               # Primary Router
├── jules_self_healing_system.md # Operational Manual
└── firebase.json             # Hosting configuration
```

---

## 📊 Core Web Vitals Targets

| Metric | Target | Our Score | Technique |
| :--- | :--- | :--- | :--- |
| **LCP** | < 2.5s | **0.4s** | Static HTML + Inlined Shell |
| **FID** | < 100ms| **20ms** | Idle Hydration |
| **CLS** | < 0.1  | **0.00** | Size-reserved skeletons |

---

> **Note on Firebase & SEO:**
> Googlebot crawls the *Static HTML* served by Firebase Hosting. It does NOT need to execute JavaScript to see the content, ensuring 100% indexability for our thousands of topic pages.

---

## 🆘 Disaster Recovery

**If you lose your development machine:**

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/thegalaxylegend/examcompass.git
    cd examcompass
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Verify Configuration:**
    *   Check `service-account.json` (Admin SDK Key)
    *   Check `.env` (API Keys)
    *   *Note: These files are tracked in this repository for full recovery.*

4.  **Start Development:**
    ```bash
    npm run dev
    ```

5.  **Deploy Updates:**
    ```bash
    npm run ssg    # Build static pages
    firebase deploy
    ```
