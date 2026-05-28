# ExamCompass DB Scale — Quick Reference

## The 3 commands you will ever need

```powershell
# 1. First time only (import seeds, generate stubs)
.\run-db-scale.cmd setup

# 2. Scale DB (run as many times as needed until 30k hit)
.\run-db-scale.cmd run 30000 24

# 3. After scaling — verify integrity + push to GitHub
.\run-db-scale.cmd verify
.\run-db-scale.cmd push
```

Or do everything at once:
```powershell
.\run-db-scale.cmd all 30000 24
```

---

## Architecture: How it achieves maximum speed

```
run-db-scale.cmd
      │
      ├── STEP 1: distribution-manager.ts  ← gap analysis, generates stubs
      │
      └── STEP 2: turbo-pipeline.ts        ← parallel multi-provider curation
                    │
                    ├── 24 Cerebras slots  (8 keys × 3 models — ultrafast)
                    ├──  6 Gemini slots    (6 keys × 1 model  — best quality)
                    └── 16 Groq slots      (8 keys × 2 models — fast+good)
                              │
                              └── 46 parallel workers total
                                  Each worker: picks 5 stubs → AI call → writes SQL
                                  Smart routing: big context → Gemini/Cerebras
                                  Auto-rotate on 429 → next key/model instantly
```

## Speed targets

| Provider | Keys | Models | Slots | Est. RPM |
|----------|------|--------|-------|----------|
| Cerebras | 8    | 3      | 24    | ~400     |
| Gemini   | 6    | 1      | 6     | ~60      |
| Groq     | 8    | 2      | 16    | ~200     |
| **Total**|      |        | **46**| **~660** |

At 5 questions/call → **3,300 questions/min** theoretical max.
Real-world (with validation): **200-500 q/min** sustained.

## Files created/modified

| File | Purpose |
|------|---------|
| `scripts/turbo-pipeline.ts` | Main parallel curation engine |
| `run-db-scale.cmd` | Master launcher (2-3 commands) |
| `scratch/raw_questions_cache.jsonl` | Stub cache (auto-regenerated) |
| `scratch/processed_hashes.json` | Deduplication tracker |
| `scripts/seed.sql` | Master SQL output |

## Troubleshooting

**"No cache file found"** → Run setup first, or:
```
npx tsx scripts/distribution-manager.ts --stubs=5000
```

**"Low yield / nothing generated"** → API keys cooling down. Wait 2 min.

**Gemini 429 quota** → Run with NoGemini flag:
```
.\run-db-scale.cmd run 30000 16
```
(set workers=16 to use only Cerebras + Groq)

**Want faster?** Increase workers (max 46 meaningful slots):
```
.\run-db-scale.cmd run 30000 46
```
