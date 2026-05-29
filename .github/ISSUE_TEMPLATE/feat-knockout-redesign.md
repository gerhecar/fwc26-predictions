---
name: 'Redesign Knockout Stage — FIFA-Style Bracket + Final Submission'
about: 'Premium FIFA-inspired bracket layout, interactive match selection, and final prediction locking with JSON email delivery'
title: '🏆 [FEAT][UI/UX] Rediseño de la Llave de Eliminación con estilo FIFA y envío final'
labels: ['enhancement', 'phase-4']
assignees: ''
---

## 🎯 Goal

Redesign the Knockout Stage to visually resemble a professional FIFA tournament bracket with premium look & feel, interactive match progression, and a final "Lock & Submit" flow that persists predictions and emails a JSON export to the organizers.

---

## 🧠 Current State

The knockout view (`src/components/predictions/knockout-view.tsx`) exists with:

- R32 → R16 → QF → SF → 3rd → Final match generation via Annex C
- Basic `MatchCard` component with click-to-select winner
- Progressive stage locking (complete previous round to unlock next)
- Manual per-match clearing with downstream cascade
- Simple submit button that sets a local `submitted` flag (zustand only, no persistence)
- No email delivery
- No JSON generation
- Flat card layout (not a visual bracket)

---

## 📐 Requirements

### 1. FIFA-Style Bracket Layout

Replace the flat horizontal stage list with a true bracket visualization:

- **Visual bracket** with left/right halves converging toward the Final
- Match cards connected by SVG/CSS lines showing progression
- R32 → R16 → QF → SF → 3rd → Final in a single panoramic view
- **Horizontal scroll** on smaller screens
- **Final match** centered at the bottom/end
- **Third-place match** clearly offset from the Final

Suggested layout:
```
Left Branch  ── R32 ── R16 ── QF ── SF ──┐
                                         Final
Right Branch ── R32 ── R16 ── QF ── SF ──┘
                                         Third
```

### 2. Premium FIFA-Inspired Look & Feel

| Element | Treatment |
|---------|-----------|
| Match cards | Dark glass (`bg-white/5 backdrop-blur-md`), elevated border, hover glow |
| Selected winner | Neon green border + glow + checkmark |
| Non-selected team | Muted, dimmed |
| Locked dependency | Grayed out, disabled cursor |
| Round headers | Bebas Neue, gold accent, tracking-wide |
| Connecting lines | Gradient from team slot to parent match |
| Background | Stadium atmosphere (existing Unsplash) |
| Champion banner | Gold gradient with trophy icon |

### 3. Interactive Match Selection

- Click on a team name to select as winner
- Winner automatically advances to parent match(es)
- Clear "selected" visual state (green highlight, glow)
- Button to change selection on any match (clears downstream)
- Hover states on all interactive elements

### 4. Dynamic Bracket Recalculation

Already partially implemented via `getAffected()` and `resolveMatch()`. Ensure:

- Group stage edits → bracket rebuilds automatically (existing)
- Third-place changes → re-run Annex C → bracket regenerates (existing)
- Invalid picks (team no longer qualified) → pruned (existing)

### 5. Final Prediction Submission

Once all matches have a winner:

#### CTA Button: **"Lock & Submit Prediction"**

- Full-width neon green gradient button with glow animation
- Only enabled when all matches have winners
- Click triggers:

1. **Validate** all picks complete
2. **Lock** prediction (read-only mode)
3. **Generate JSON** with full prediction data
4. **Send email** with JSON attachment to german.herrero@bull.com

#### JSON Structure

```json
{
  "user": { "display_name": "string" },
  "groupStage": { "A": ["México", "..."], "..." },
  "bestThirdPlaced": ["A", "C", "..."],
  "knockout": { "73": "México", "..." },
  "champion": "string",
  "thirdPlaceWinner": "string",
  "submittedAt": "ISO timestamp"
}
```

#### Email Delivery

- To: german.herrero@bull.com
- Subject: `[World Cup Prediction] New Submitted Bet - {display_name}`
- Body: prediction summary
- Attachment: JSON file

### 6. Read-Only Mode After Submit

When `submitted = true`:

- All match selection buttons disabled
- "Edit Groups" and "Edit Third Place" buttons disabled
- Navigation arrows to previous stages disabled
- Banner: "✓ PRONÓSTICO ENVIADO — Ya no puedes modificar tu pronóstico"
- Champion display in final state

---

## ✅ Acceptance Criteria

1. Bracket renders as a true visual bracket (left/right halves → final)
2. User can select winners by clicking teams in match cards
3. Winners automatically advance to downstream matches
4. All knockout rounds are represented (R32, R16, QF, SF, 3rd, Final)
5. Third-place match is included and resolved correctly
6. Submission button only enabled when all matches have winners
7. Submission locks all predictions (read-only)
8. JSON is generated and emailed to german.herrero@bull.com
9. Bracket recalculates when group/third-place stages are edited
10. Premium dark glassmorphism aesthetic throughout
11. Responsive with horizontal scroll on mobile
12. Build compiles with zero errors

---

## 📁 Files to Modify/Create

### Modify
| File | Change |
|------|--------|
| `src/components/predictions/knockout-view.tsx` | Full bracket visual redesign, submission flow |
| `src/lib/predictions/store.ts` | Add `generatePredictionJson()`, `submitPrediction()` |
| `src/app/api/predictions/submit/route.ts` | New API route for final submission + email |
| `src/lib/predictions/actions.ts` | Server actions for email delivery |

### Create
| File | Purpose |
|------|---------|
| `src/components/predictions/bracket-line.tsx` | SVG connector lines between matches |
| `src/components/predictions/bracket-match-card.tsx` | Premium match card (extracted from MatchCard) |
| `src/lib/email/send-prediction.ts` | Email delivery service |
| `src/lib/predictions/json-export.ts` | JSON generation utility |

---

## 📝 Notes

- Email can use an SMTP service (e.g., Nodemailer, SendGrid, or a simple SMTP connection)
- The bracket layout is purely CSS — no SVG library needed (lines can be CSS pseudo-elements or thin SVG elements)
- All match logic (Annex C, team resolution, affected cascade) already exists in the current knockout-view.tsx
- The code is currently at `src/components/predictions/knockout-view.tsx:485` lines — refactor into smaller components

---

## 🚫 Out of Scope (for this issue)

- Real-time collaboration
- Live score updates during the tournament
- Multiple bracket variants
- PDF export (JSON is sufficient)
