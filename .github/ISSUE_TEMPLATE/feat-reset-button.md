---
name: 'Reset Button — Group Stage'
about: 'Add a reset button in the group stage page that clears all predictions'
title: '🔄 Añadir botón de reset en la Fase de Grupos'
labels: ['enhancement']
assignees: ''
---

## 🎯 Goal

Add a **Reset** button on the Group Stage page that clears the entire prediction and lets the user start from scratch.

---

## 🧠 Current State

The predictions flow stores data in a Zustand store with localStorage persistence. There is currently no way to clear all picks at once — users must manually drag teams back one-by-one.

---

## 📐 Requirements

1. **Reset button** visible on the Groups step (next to or near the "Continue" CTA)
2. **Confirmation** before clearing (modal or window.confirm)
3. On confirm, **clear all**:
   - Group Stage rankings (`groupPredictions`)
   - Third-placed selections (`thirdPlaceSelection`)
   - Knockout bracket picks (`bracketPicks`)
   - Submitted flag (`submitted`)
4. After reset, redirect to the Groups step
5. Styling matches the existing dark theme — red/danger color for the reset button

---

## ✅ Acceptance Criteria

1. Reset button renders in GroupsView
2. Clicking shows a confirmation dialog
3. On confirm, all predictions are cleared
4. On cancel, nothing changes
5. Build compiles with zero errors

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/components/predictions/groups-view.tsx` | Add reset button + confirmation flow |
| `src/lib/predictions/store.ts` | Add `resetAll()` action (or use existing `clearGroupPrediction` iteratively) |

---

## 📝 Notes

- Zustand store already has partial clear methods — add a single `resetAll()` for convenience
- Use `window.confirm('¿Estás seguro? Se borrarán todas tus predicciones.')` for simplicity
- Use a red/danger styled button, e.g. `border-red-500/30 text-red-400 hover:bg-red-500/10`
