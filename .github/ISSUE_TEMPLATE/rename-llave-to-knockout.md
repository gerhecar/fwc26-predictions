---
name: 'Replace "Llave" text with "Knockout stage"'
about: 'Rename all Spanish "Llave/Llave final" references to "Knockout stage" in the UI'
title: '🔤 Reemplazar "Llave" por "Knockout stage" en toda la UI'
labels: ['enhancement']
assignees: ''
---

## 🎯 Goal

Rename all visible text references from "Llave"/"Llave final"/"Llave del Mundial" to "Knockout stage" across the UI for consistency with the English tournament terminology.

---

## 📍 Occurrences

| File | Line | Current Text |
|------|------|-------------|
| `src/app/dashboard/page.tsx` | 56 | `Llave Final` |
| `src/components/layout/app-shell.tsx` | 10 | `Llave` |
| `src/app/bracket/page.tsx` | 41 | `Llave del Mundial` |

---

## ✅ Acceptance Criteria

1. `src/app/dashboard/page.tsx` shows **"Knockout stage"** in the card heading
2. `src/components/layout/app-shell.tsx` nav item shows **"Knockout"** label
3. `src/app/bracket/page.tsx` `<h1>` shows **"Knockout stage"**
4. No other "Llave" references remain in UI-facing strings
5. Build compiles with zero errors
