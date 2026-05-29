---
name: 'Remove Third-Place Match + Save Bet with DB Persistence'
about: 'Remove third-place prediction, add Save Bet button that persists to DB under authenticated user, generates JSON, and emails organizers.'
title: 'Remover tercer lugar + guardar apuesta en BD con envio por email'
labels: ['enhancement', 'phase-4']
assignees: ''
---

## Goal

Remove third-place match from knockout bracket and add a Save Bet flow: DB persistence under authenticated user, JSON generation, email to organizers.

## Changes

- Third-place match (#103) removed from bracket columns, baseMatches, stageChildMap
- New `bet_submissions` table (id, user_id, prediction_json, champion_name, email_sent)
- `/api/predictions/save` endpoint: auth, DB insert, generate JSON, send email
- Save Bet button calls new endpoint; shows predictionId on success
- Prediction JSON now includes `user.id`, `predictionId`; no more `thirdPlaceWinner`

## Acceptance Criteria

- [x] Third-place match not displayed
- [x] Save Bet disabled until Final winner selected
- [x] Prediction saved in DB under authenticated user
- [x] JSON generated with complete prediction
- [x] Email sent to german.herrero@bull.com with JSON attached
- [x] Prediction locked after save
- [x] Build compiles with zero errors
