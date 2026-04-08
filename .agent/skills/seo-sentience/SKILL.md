---
name: seo-sentience
description: Deep monitoring of search engine visibility, keyword density, and content freshness to ensure 100% indexing and traffic growth.
---

# SEO Sentience Skill

Use this skill to maintain the "Freshness" of the Exam Compass platform. This ensures no content stays "thin" or "stale" in Google's index.

## 🛰️ Monitoring Protocol

1. **Decay Detection:** Monitor GSC for >25% traffic dips on core slugs.
2. **Freshness Check:** Identify posts with "2024" or outdated exam patterns.
3. **Internal Link Audit:** Ensure every new post has at least 3 inbound and 3 outbound links to existing high-authority pages.
4. **Indexing Push:** Use the Google Indexing API to notify Google of updates.

## 🛠️ Key Scripts
- `scripts/content-decay.ts`: Identifies "rotting" content.
- `scripts/internal-linker.ts`: Automatically maps the internal "link-web."
- `scripts/index-manager.ts`: Handles Pings to Search Engines.
