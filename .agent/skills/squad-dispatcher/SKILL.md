---
name: squad-dispatcher
description: Expertise in multi-LLM orchestration, dispatching tasks to specialized models (Claude, DeepSeek, ChatGPT, Perplexity) and synthesizing their outputs into production-ready code.
---

# Squad Dispatcher Skill

This skill allows the agent to act as a "Commander" for a specialized AI squad. Use this skill when a task requires deep reasoning, mathematical accuracy, or strategic SEO that a single model cannot handle at peak performance.

## 🤝 The Squad Members

| Role | Specialist | Trigger / Usage |
| :--- | :--- | :--- |
| **The Architect** | Claude | Use for complex directory restructuring, structural refactoring, and deep reasoning about system architecture. |
| **Logician** | DeepSeek | Use for mathematical derivations, complex logic problems, and verifying algorithmic correctness. |
| **Strategist** | ChatGPT | Use for SEO keyword research, narrative building, and general blog strategy. |
| **Analyst** | Perplexity | Use for real-time web research, finding trending topics, and checking current events. |

## 🛠️ Execution Protocol

1. **Deconstruct:** Break the user's goal into specific sub-tasks for each specialist.
2. **Dispatch:** Use the appropriate internal bridge (e.g., `.agent_squad/squad_hub.js`) to send the sub-task to the specialist.
3. **Synthesis:** Take the specialized output and integrate it into the codebase. 
4. **Verification:** Test the integrated output to ensure it matches the user's high-level goal.

## ⚠️ Contraindications
- Do NOT dispatch simple coding tasks that can be handled locally by the Lead Engineer.
- Keep context windows clean; don't send irrelevant code to the specialists.
