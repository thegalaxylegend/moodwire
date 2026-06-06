# Contributing to ExamCompass

🚫 **TOKEN SAVING RULE:** DO NOT read any safety or architecture documents (AI_NOTE.md, AGENT_SAFETY.md, README.md) for greetings ("hi", "hello"), casual chats, or small UI visual tweaks (text edits, styling, colors, spacing).

📖 **CONDITIONAL DOCUMENT LOADING:**
1. **For small UI tweaks:** Do NOT read documentation. Edit the target component directly.
2. **For code logic changes / single-file bug fixes:** Read [AI_NOTE.md](AI_NOTE.md) only.
3. **For major changes (database, scripts, deployment, multiple files):** Read [AI_NOTE.md](AI_NOTE.md), [AGENT_SAFETY.md](AGENT_SAFETY.md), and [README.md](README.md).

**The most important architectural rule:**
Questions live in Cloudflare D1 (not Firebase). Always. See AI_NOTE.md for details.
