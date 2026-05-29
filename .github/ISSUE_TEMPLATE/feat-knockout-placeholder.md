---
name: 'Knockout Phase — Placeholder for unresolved matches'
about: 'Show "Choose winner of previous match" in downstream rounds until the previous winner is selected'
title: '⏳ Mostrar placeholder en rondas avanzadas hasta elegir ganador de ronda anterior'
labels: ['enhancement', 'phase-4']
assignees: ''
---

## 🎯 Goal

In R16, QF, SF, and Final rounds, show an empty/unresolved state with a message like *"Choose winner of previous match"* instead of the current fallback label. Once the previous round's winner is selected, the slot fills automatically.

---

## 🧠 Current State

When a downstream match (e.g. R16 or QF) doesn't have its teams resolved yet (because the parent match hasn't been played/picked), the match card currently shows a fallback label like `"Ganador #89"` in the team slot.

---

## 📐 Requirements

1. For any match slot that depends on a previous round's winner:
   - If the previous match has **no winner selected**, show a **muted placeholder** with the message *"Choose winner of previous match"* in both team slots
   - The slot should be visually dimmed and disabled
2. Once the previous round's winner **is selected**, the team name appears normally
3. For R32 matches (which don't depend on previous picks), always show the team name or group position label as today

---

## ✅ Acceptance Criteria

1. R16 match slots show *"Choose winner of previous match"* before R32 winners are picked
2. QF match slots show the message before R16 winners are picked
3. SF, Final, and Third-place match slots show the message before their respective upstream matches are resolved
4. As soon as the upstream winner is selected, the team name replaces the placeholder
5. Build compiles with zero errors

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/components/predictions/bracket-match-card.tsx` | Change `homeLabel`/`awayLabel` rendering to show placeholder when no team is resolved |

---

## 📝 Notes

- The placeholder message in Spanish: *"Elige ganador de ronda anterior"*
- The "Cambiar" link should not appear when the slot has only a placeholder
- Already resolved matches (from upstream picks) should display normally
