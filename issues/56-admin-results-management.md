---
title: "Official Tournament Results Management"
labels: admin, enhancement
---

## Summary
Admin can now enter official tournament results across all stages: group standings (drag-and-drop), best third-placed teams (select 8), knockout winners (auto-advance bracket). Results stored as draft/published.

## Changes
- `scripts/schema.sql`: New `official_results` table (results_json JSON, status draft|published)
- `src/app/api/admin/results/route.ts`: GET returns latest results; PUT saves/full-replaces results as draft
- `src/app/api/admin/results/publish/route.ts`: PUT validates completeness then publishes
- `src/components/admin/results-panel.tsx`: Complete rewrite with 3 tabs:
  - **Groups tab**: @dnd-kit drag-and-drop per group (4 teams, rank badges)
  - **Third-Placed tab**: 12 candidates, select exactly 8 with checkboxes
  - **Knockout tab**: Column layout (R32→R16→QF→SF→Final), click to select winner, auto-advance, downstream clear
  - Status banner (draft/published), save/publish buttons

## Files
- `scripts/schema.sql`
- `src/app/api/admin/results/route.ts`
- `src/app/api/admin/results/publish/route.ts`
- `src/components/admin/results-panel.tsx`
- `src/app/admin/results/page.tsx`
