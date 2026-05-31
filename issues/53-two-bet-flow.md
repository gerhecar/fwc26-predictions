---
title: "Allow Each User to Create Up to Two Complete Predictions"
labels: enhancement
---

## Summary
Users can now create up to 2 bets, each with a custom name. The backend enforces max 2 per user and unique bet names.

## Changes
- `scripts/schema.sql`: Added `bet_name` column + unique constraint `uk_user_bet_name (user_id, bet_name)`
- `src/app/api/predictions/save/route.ts`: POST accepts `betName`, validates max 2 (COUNT), unique name per user; GET returns user's bets
- `src/lib/predictions/json-export.ts`: Added `betName` field to `PredictionExport`
- `src/lib/email/send-prediction.ts`: Subject + filename include bet name
- `src/components/predictions/knockout-view.tsx`: Bet name modal before saving, fetches existing bets on mount, shows existing bet tags, blocks at limit 2

## Files
- `scripts/schema.sql`
- `src/app/api/predictions/save/route.ts`
- `src/lib/predictions/json-export.ts`
- `src/lib/email/send-prediction.ts`
- `src/components/predictions/knockout-view.tsx`
