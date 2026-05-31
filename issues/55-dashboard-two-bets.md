---
title: "Update Dashboard for Two-Bet Flow and Prediction Review"
labels: enhancement
---

## Summary
Dashboard redesigned with two bet slots (Create/View), standalone Knockout Phase card removed, read-only bet detail page added.

## Changes
- `src/app/dashboard/page.tsx`: Simplified to server wrapper, delegates to `DashboardClient`
- `src/components/dashboard/dashboard-client.tsx`: Two bet slots with Create Bet (resets store, navigates to `/predictions`) and View Bet (navigates to `/predictions/bet/[id]`)
- `src/app/api/predictions/bet/[id]/route.ts`: GET returns full prediction JSON with ownership check
- `src/app/predictions/bet/[id]/page.tsx`: Read-only bet detail page
- `src/components/predictions/bet-detail.tsx`: Displays Group Stage (all 12 groups), Best Third-Placed, Knockout (R32→R16→QF→SF→Final), Champion

## Files
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/dashboard-client.tsx`
- `src/app/api/predictions/bet/[id]/route.ts`
- `src/app/predictions/bet/[id]/page.tsx`
- `src/components/predictions/bet-detail.tsx`
