# ⛔ QUESTIONS DATABASE = CLOUDFLARE D1 ONLY

## DO NOT use Firebase / Firestore for questions — ever.

### Where questions live
| What | Where |
|------|-------|
| Question DB | **Cloudflare D1** — `examcompass-questions` |
| DB ID | `63abfee4-2340-47bd-a9ad-ebc4a9c50580` |
| Push script | `npx tsx scripts/d1-push.ts` |

### What Firebase IS used for
- Firebase Auth (user login/signup)  
- Firebase Hosting (website deployment)

### What Firebase is NOT used for
- ❌ Questions
- ❌ Any exam content

### How to add questions to the database
```bash
npx tsx scripts/d1-push.ts
```
This script:
- Reads from `scripts/seed.sql`
- Skips duplicates already in D1
- Runs quality checks (no A/B/C/D placeholders, no empty options, answer must match options)
- Pushes only clean, valid questions to Cloudflare D1
