---
name: syllabus-scanner
description: [UPGRADE] Proactive scanning of real-time exam trends and syllabus changes to ensure the generation queue is always ahead of the market.
---

# Syllabus Scanner Skill

Use this skill to keep the Exam Compass content strategy "Trend-Aware." Instead of waiting for users to search, we generate content based on what **will** be searched.

## 📡 Scanning Protocol

1. **Analytical Research:** Use **Perplexity** to find recent NTA (National Testing Agency) circulars or trending JEE/NEET topics on academic forums.
2. **Gap Analysis:** Compare trending topics against our current `JULES_COVERED_TOPICS.md`.
3. **Queue Injection:** Automatically add high-priority "Trend Topics" to the top of the Chapter Queue.
4. **Keyword Enrichment:** Pass the trend data to the **Strategist (ChatGPT)** to refine the blog hooks.

## 🛠️ Triggers
- Run every Sunday evening to prepare the "Daily Cycle" for the upcoming week.
