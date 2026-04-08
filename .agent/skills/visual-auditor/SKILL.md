---
name: visual-auditor
description: [UPGRADE] Using visual feedback to verify UI layouts, math rendering accuracy, and design consistency across the platform.
---

# Visual Auditor Skill

This is a **Human-AI Hybrid Skill**. Use this when code-level tests (logs) are insufficient for verifying aesthetic or complex rendering (e.g., LaTeX formulas in Notes).

## 👁️ Visual Audit Protocol

1. **Screenshot Generation:** Use the `browser_subagent` to render the target page (e.g., `/dashboard/notes`).
2. **Layout Check:** Verify that math formulas are not overlapping text and that the dark/light mode transition is smooth.
3. **Ghost-Artifact Hunt:** Look for LaTeX artifacts or broken images that don't trigger console errors.
4. **Design Match:** Compare the current render against the "Premium Design" principles (glassmorphism, vibrant gradients).

## 🛠️ Verification Command
- `npm run dev` + `browser_subagent` navigation to local deployment.
