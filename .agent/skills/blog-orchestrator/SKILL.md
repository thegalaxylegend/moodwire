---
name: blog-orchestrator
description: High-level management of the autonomous blog generation pipeline, including topic queueing, generation oversight, and quality control.
---

# Blog Orchestrator Skill

Use this skill to manage the "Closed-Loop Nervous System" of the Exam Compass blog. This involves coordinating the daily content cycle to ensure steady domain growth and content freshness.

## 🔄 The Daily Cycle Protocol

1. **Queue Check:** Scan the syllabus database to identify missing chapters or topics.
2. **Strategy Alignment:** Read the latest `evolved-prompt.json` and `generation-strategy.json` to understand current best practices.
3. **Execution Oversight:** Monitor the run of `scripts/blog-generator.ts`.
4. **Freshness Maintenance:** Trigger `scripts/content-decay.ts` once a week to identify falling rankings.

## 🛠️ Key Scripts
- `scripts/self-improve.ts`: Main entry point for the daily cycle.
- `scripts/blog-generator.ts`: The heavy-lifter for content creation.
- `scripts/queue-builder.ts`: Manages which topics are next.

## 🚩 Quality Gates
- **Score < 70:** Immediate fail; trigger "Failed Autopsy."
- **Score 70-89:** Flag for "Manual Refinement."
- **Score 90+:** Automatic deployment.
