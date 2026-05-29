---
name: 'Redesign Knockout Bracket — Clean Left-to-Right Column Layout'
about: 'Replace the current bracket grid with vertical round columns for a clear R32→R16→QF→SF→Final progression'
title: '🏗️ Rediseñar la llave knockout con columnas verticales por ronda (izquierda a derecha)'
labels: ['enhancement', 'phase-4']
assignees: ''
---

## 🎯 Goal

Redesign the Knockout Stage bracket from the current grid-based layout to a **clean column-based left-to-right structure**, where each tournament round occupies its own vertical column. This eliminates crowding and makes progression instantly readable.

---

## 🧠 Current State

`bracket-layout.tsx` uses a CSS grid with a left-side/right-side/final-center approach. Matches are positioned with `gridRow` spanning, which causes:

- Cards feel cramped and stacked
- Progression is visually confusing
- Poor spacing between matches
- Hard to scan rounds at a glance

---

## 📐 Desired Layout

```
Column 1    Column 2    Column 3    Column 4    Column 5    Column 6
  R32         R16          QF          SF        FINAL      3RD PLACE
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ 73     │  │ 89     │  │ 97     │  │ 101    │  │ 104    │  ┌────────┐
│ vs     │→ │ vs     │→ │ vs     │→ │ vs     │→ │ FINAL  │  │ 103    │
│ 75     │  │ 90     │  │ 99     │  │ 102    │  │        │  │ 3RD    │
└────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
┌────────┐
│ 74     │
│ vs     │
│ 77     │
└────────┘
... etc
```

### Column Architecture

| Column | Round | Matches | Layout |
|--------|-------|---------|--------|
| 1 | Round of 32 | 73–88 (16 matches) | Vertical stack, 16 cards |
| 2 | Round of 16 | 89–96 (8 matches) | Vertical stack, 8 cards |
| 3 | Quarter Finals | 97–100 (4 matches) | Vertical stack, 4 cards |
| 4 | Semi Finals | 101–102 (2 matches) | Vertical stack, 2 cards |
| 5 | Final | 104 | Single card, centered |
| 6 | Third Place | 103 | Single card, below final |

### Key Changes from Current

- Remove the left/right branch split — all matches in a single vertical column per round
- Each column has a clear round header (R32, R16, QF, SF, FINAL, 3RD PLACE)
- Horizontal connector lines between columns (CSS pseudo-elements or SVG)
- Winners flow naturally from left to right
- Generous vertical spacing: `gap-3` or `gap-4` between cards

---

## 🎨 Visual Requirements

- **Background**: Dark navy (`#0a0e1a`) — existing
- **Column headers**: Bebas Neue, gold accent (`text-accent-gold`), tracking-wide
- **Match cards**: `bg-white/[0.04] border-white/10 rounded-xl p-3` with hover glow
- **Selected winner**: `border-accent-green/50 bg-accent-green/[0.06]` with green top glow
- **Connectors**: Thin horizontal gradient lines between columns showing progression flow
- **Spacious**: Minimum 16px gap between cards, 24px between columns
- **Scrolling**: `overflow-x-auto` container for responsive support

---

## ✅ Acceptance Criteria

1. Bracket renders as 6 vertical columns (R32, R16, QF, SF, Final, Third Place)
2. Each column has a clear round title header
3. Match cards are evenly spaced with no visual stacking
4. Winner selection flows naturally left-to-right
5. `BracketMatchCard` reuse — same premium card component
6. Bracket is horizontally scrollable on small screens
7. Build compiles with zero errors

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/components/predictions/bracket-layout.tsx` | Full rewrite — replace grid with column-based layout |
| `src/components/predictions/bracket-match-card.tsx` | Minor adjustments if needed for column fit |

---

## 📝 Notes

- Use plain flexbox, not CSS grid — each column is a `flex flex-col gap-3`
- Columns wrapped in a horizontal flex row: `flex gap-6 overflow-x-auto`
- No SVG connector lines needed initially — simple arrow characters (`→`) between columns suffice
- The `BracketMatchCard` component stays unchanged
