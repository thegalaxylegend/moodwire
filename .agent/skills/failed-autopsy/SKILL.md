---
name: failed-autopsy
description: Forensic analysis of system failures and generation errors to implement permanent structural fixes.
---

# Failed Autopsy Skill

Use this skill when the pipeline crashes or when a blog fails the Quality Gate. The goal is to turn "one-time errors" into "permanent knowledge."

## 🔍 Forensic Protocol

1. **Log Ingestion:** Read `build_errors.txt`, `api_debug.log`, and the specific `error_output` from the generation script.
2. **Root Cause Identification:** Determine if the failure was:
    - **Syntax:** JSON corruption, unescaped LaTeX.
    - **API:** Rate limits, timeout, model hallucination.
    - **Logic:** Missing sections, incorrect formatting.
3. **Strategy Update:** Append new "NEVER DO" rules to `generation-strategy.json`.
4. **Repair:** Run `scripts/smart-repair.ts` to fix the specific broken file.

## 🛠️ Key Scripts
- `scripts/failed-autopsy.ts`: Standardized error analyzer.
- `scripts/smart-repair.ts`: Targeted regex and transformer-based fixer.
