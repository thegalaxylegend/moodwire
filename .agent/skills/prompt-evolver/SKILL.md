---
name: prompt-evolver
description: Analyzing performance data (GA4/GSC) to optimize and self-rewrite system prompts for higher rankings and better user engagement.
---

# Prompt Evolver Skill

This is the "Meta-Intelligence" skill. Use this to ensure the system is learning from real-world successes and failures.

## 📈 Learning Loop Protocol

1. **Data Ingestion:** Read traffic data from GA4 and click/keyword data from Google Search Console.
2. **Pattern Analysis:** Identify which blog structures or "hooks" are leading to higher CTR and longer dwell times.
3. **Evolution:** Update `evolved-prompt.json` with new instructions (e.g., "Add more real-world examples in Physics posts").
4. **Versioning:** Save a copy of the old prompt in `prompt-history/` for auto-revert capability.

## 🛠️ Key Scripts
- `scripts/prompt-evolution.ts`: The core logic for system self-editing.
- `scripts/analyze-traffic.ts`: Helper for data parsing.

## ⚠️ Safety Guard
- If quality scores drop after an evolution, **immediately revert** using the history folder. Never sacrifice depth for "SEO hacks."
