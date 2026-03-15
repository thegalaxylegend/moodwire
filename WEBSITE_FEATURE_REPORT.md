# Exam Compass: Unified Feature List for Deep Research

This document provides a comprehensive, technically-grounded list of every feature and architectural component within the **Exam Compass** platform (formerly thegalaxylegend/examcompass). Use this for deep research into competitive positioning, AI feature roadmap, and performance optimization on ChatGPT.

---

## 1. Core AI & Personalized Learning
*   **AI-Adaptive Mock Generator (Groq Powered):** Generates high-fidelity exam questions on-the-fly using the Groq API (LLM-based generation) instead of static question banks.
*   **Adaptive Elo Rating System:** Tracks student "Ability Scores" using a custom Elo implementation. Questions are served based on difficulty-to-ability matching.
*   **Cognitive Fatigue Detection:** Analyzes response time patterns and accuracy dips over time during long test sessions to detect mental exhaustion and suggest breaks.
*   **Root Cause AI Insights:** Uses a Concept Graph to identify "instabilities" in prerequisite topics (e.g., if you fail on 'Torque', it analyzes if the root cause is 'Cross Products').
*   **Video Recommendations (Multi-Focus):** Sticky video learning suggestions based on weakest topic performance, subject proficiency, and category-level gaps.
*   **Interactive AI Tutor (Exa):** Built-in "Brilliant Science Tutor" capable of re-solving problems from first principles to verify official key accuracy ("Fair Play Detection").

---

## 2. Competitive & Social Mechanics (Gamification)
*   **Dynamic Leaderboards (Seasons):** Monthly resetting global rankings categorized by exam (JEE, NEET, UPSC, etc.) or overall career XP.
*   **RPG-Style XP & Leveling:** Users earn Experience Points (XP) for mock completion and correct answers, progressing through distinct ranks (Aspirant → Warrior → Elite, etc.).
*   **Aspirant Strike System (Streaks):** Multi-day study streaks with visual "Flame" indicators and elite learner badges.
*   **National Rank Predictor:** Real-time estimation of All India Rank (AIR) based on current point accumulation and competitive peer benchmarking.
*   **Daily Challenges and Missions:** Automated missions (Practice, Review, Discovery) that incentivize users to engage with specific weak topics.

---

## 3. Career & Decision Support Tools
*   **AI Decision Simulator:** A career-path comparison engine that analyzes two exams (e.g., JEE vs. NEET) and provides data-backed verdicts on ROI, acceptance rates, and pros/cons.
*   **Skill Proficiency Mapping:** Visual dashboard representing subject-level mastery (Physics, Chemistry, Math) as "Strong," "Average," or "Weak" based on historical performance.
*   **Full Spectrum Syllabus Coverage:** Detailed tracking of syllabus completion percentages across 11th, 12th, and Junior classes (6th-10th).

---

## 4. Elite Performance & Infrastructure (Growth Stack)
*   **Extreme Mobile Optimization:** Hits <0.5s Largest Contentful Paint (LCP) through layout lazy-loading, synchronous SSG pre-rendering, and aggressive deferral of secondary scripts.
*   **SEO Powerhouse Architecture:** Automated Schema injection, IndexNow pinging, Dynamic Sitemap generation, and SSG-first rendering for public routes.
*   **Unified PWA (Progressive Web App):** Cross-platform capability (Mobile/Desktop) with offline manifest and installation prompts.
*   **Zero-Friction Blog System:** Markdown-based blog engine optimized for "Quick Recall" snippets and high-intent SEO keywords.
*   **Cross-Platform Targets:** Built for Web, Electron (Desktop), and Capacitor (iOS/Android) from a single React codebase.

---

## 5. Administrative & Quality Control
*   **AI Question Reviewer:** Internal tool for admins to review and correct AI-generated questions.
*   **Bulk Syllabus Importer:** Automated tools for syncing syllabus structures into the platform's data store.
*   **Real-time Analytics Deferral:** Uses `requestIdleCallback` to send analytics (GA4, Datadog RUM/Logs) without blocking the main UI thread.

---

## 6. Technical Stack Overview
*   **Frontend:** React (v19), Vite, Tailwind CSS, Framer Motion (Animations), Lucide (Iconography).
*   **State & Logic:** Zustand (State Management), React Router v7.
*   **Backend & DB:** Firebase (Auth, Firestore, Hosting), Groq Cloud (AI Generation).
*   **Assets & Graphics:** Three.js / React Three Fiber (3D graphics), Mermaid (Diagrams), jspdf (PDF Generation).
*   **Cross-Platform:** Electron, Capacitor (Android/iOS).
