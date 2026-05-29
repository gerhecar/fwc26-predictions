---
name: 'Progressive Knockout Bracket — Future Rounds Empty Until Previous Is Complete'
about: 'Future rounds must remain empty and disabled until winners from the previous round are selected. Bracket builds step by step like a real tournament.'
title: '⏳ Población progresiva de la llave — rondas futuras vacías hasta completar la anterior'
labels: ['enhancement', 'phase-4']
assignees: ''
---

## 🎯 Goal

Implement **progressive bracket population**: future rounds (R16, QF, SF, Final, 3rd Place) remain **empty and disabled** until the user selects winners from the previous round. The bracket must feel like a **step-by-step tournament builder**, not a pre-generated list.

---

## 🧠 Current State

The bracket layout (`bracket-layout.tsx`) renders all 6 columns (R32 → R16 → QF → SF → Final → 3rd) at once. Although my recent `isPlaceholder` fix shows *"Elige ganador de ronda anterior"* for unresolved slots, the downstream columns still appear active, and winners propagate prematurely from upstream picks.

The `resolveMatch` in `knockout-view.tsx` eagerly resolves teams from `bracketPicks`, so as soon as a single R32 match has a winner, that team appears in the corresponding R16 slot — before the user has completed the round.

---

## 📐 Desired Behavior

### R32 → R16
- R16 column exists but all match cards show **"Waiting for R32 winners"** (placeholder, disabled, dimmed)
- No team names appear in R16 until ALL 16 R32 matches have winners

### R16 → QF
- QF remains completely empty/disabled until ALL 8 R16 matches have winners
- Once all R16 are done, QF populates dynamically

### QF → SF
- SF stays empty until all 4 QF matches have winners

### SF → Final + 3rd Place
- Final and 3rd Place remain empty until both SF matches have winners
- On SF completion: winners → Final, losers → 3rd Place (auto-populated)

---

## 🎨 Visual States

| State | Card Treatment |
|-------|---------------|
| **Locked** (previous round incomplete) | `opacity-25`, `.cursor-not-allowed`, dark glass bg, no team text, lock icon, text: *"Esperando ronda anterior"* |
| **Ready** (previous round complete, no pick yet) | Normal interactive state, teams visible |
| **Selected** | Green glow, checkmark |
| **Downstream changed** | Cascade reset animation |

---

## 🔄 Locking Rules

| Column | Unlocks when |
|--------|-------------|
| R32 | Always unlocked |
| R16 | All 16 R32 matches have winners |
| QF | All 8 R16 matches have winners |
| SF | All 4 QF matches have winners |
| Final | Both SF matches have winners |
| 3rd Place | Both SF matches have winners (auto-filled with losers) |

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/components/predictions/bracket-layout.tsx` | Add `locked` prop per column based on previous round completion |
| `src/components/predictions/bracket-match-card.tsx` | Enhance placeholder state with lock icon and improved messaging |
| `src/components/predictions/knockout-view.tsx` | Compute per-round lock state, pass to BracketLayout |

---

## ✅ Acceptance Criteria

1. All R16 slots show "Waiting" until all 16 R32 matches have winners
2. QF slots show "Waiting" until all 8 R16 matches have winners
3. SF slots show "Waiting" until all 4 QF matches have winners
4. Final and 3rd Place show "Waiting" until both SF matches have winners
5. Once unlocked, teams populate dynamically from upstream winners
6. Changing an upstream winner resets all downstream matches
7. Lock icon visible in locked state
8. Build compiles with zero errors
