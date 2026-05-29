---
name: 'UI/UX Redesign — Group Stage Prediction Screen'
about: 'Premium sports look & feel for the predictions flow'
title: '🎯 Redesign UI/UX de la pantalla de Predicción de Grupos'
labels: ['enhancement', 'design', 'ux']
assignees: ''
---

## 🎯 Goal

Transform the current Group Stage Prediction screen from a basic functional layout into a **premium, professional sports-portal experience** — inspired by FIFA/UEFA tournament products, modern fantasy sports apps, and high-end betting platforms.

---

## 🧠 Current State

Three components power the flow:

| Component | File | Description |
|-----------|------|-------------|
| `PredictionsFlow` | `src/components/predictions/predictions-flow.tsx` | Step manager (Groups → Third-placed) with step indicator |
| `GroupsView` | `src/components/predictions/groups-view.tsx` | 12-group grid + "Continue" CTA |
| `GroupCard` | `src/components/predictions/group-card.tsx` | DnD zone per group with 4 team rows |
| `SortableTeamRow` | `src/components/predictions/sortable-team-row.tsx` | Draggable row with rank badge, flag, name, handle |
| `ThirdPlacedView` | `src/components/predictions/third-placed-view.tsx` | 8/12 third-place picker |

**Current theme** (`globals.css`):
- Light-mode only with basic Tailwind colors
- `fifa-blue: #1a237e`, `fifa-gold: #ffd700`, `fifa-green: #2e7d32`
- Flat white cards with `border-border` (#e2e8f0) borders
- Generic `bg-white`, `shadow-sm`, `rounded-xl` on cards
- No dark mode, no glassmorphism, no gradients
- Rank colors: yellow, gray, orange, red badges (no semantic meaning by position)

---

## 🎨 Visual Direction

### 1. Color Palette (Dark Theme)

**Background:**
- Deep navy/dark blue gradient (`#0a0e1a` → `#0d1b3e`)
- Subtle stadium atmosphere — optional blurred pitch-texture overlay
- Cards: dark glassmorphism (`rgba(255,255,255,0.05)` with backdrop blur)

**Primary Accent:**
- Tournament green: `#00e676` (neon green) — primary CTAs, qualified highlights
- FIFA blue: `#2979ff` — interactive elements, selected states

**Text:**
- White `#ffffff` — primary text
- `#94a3b8` — secondary/muted text
- WCAG AA contrast on all backgrounds

**Status Colors:**
- `#00e676` / `#00c853` — Qualified (1st–2nd position)
- `#ffd740` / `#ffab00` — Best third-place candidate (3rd position)
- `#546e7a` / muted — Eliminated / 4th position

### 2. Typography

- **Headlines:** `Bebas Neue` (already loaded as `--font-bebas`) — use for group titles, step numbers, main heading
- **Body:** `Inter` (already default) — team names, labels
- **Sizes:** Larger hierarchy gap: h1 → 3xl/4xl, group title → xl, team name → base
- **Tracking:** Wider letter-spacing on group titles for premium feel
- Remove all generic `text-text-secondary` gray — use the dark-theme specific muted values

### 3. Group Cards (Glassmorphism Premium)

Design each card as a glass/dark sports panel:

- `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- Inner glow on hover (`box-shadow: 0 0 30px rgba(0,230,118,0.1)`)
- Group title: Bebas Neue, white, with subtle gold or green underline accent
- Progress pill: "1 of 12" in top-right corner
- Smooth expand/contract on drag
- Drop zone: dashed border highlight when dragging over

### 4. Team Rows (Interactive + Semantic)

Redesign `SortableTeamRow`:

| Position | Visual Treatment |
|----------|-----------------|
| 1st–2nd | Left green accent bar (`border-l-4 border-[#00e676]`), green tint background |
| 3rd | Gold/yellow accent bar (`border-l-4 border-[#ffd740]`), subtle gold tint |
| 4th | Neutral / muted — no accent bar, lowered opacity |

Each row:
- Rank number in a circular badge (sized consistently, same font as team name)
- Flag emoji at 1.5x size
- Team name in white (Inter, medium weight)
- Drag handle: 6-dot grid icon, visible on hover, semi-transparent by default
- Hover: subtle white glow (`box-shadow: 0 0 12px rgba(255,255,255,0.08)`)
- Dragging: elevated with larger shadow (`shadow-2xl`), slight scale (`scale-[1.02]`), `z-50`

### 5. Layout

- **Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` — maintain current breakpoints
- **Gap:** Increase to `gap-6` between cards
- **Container:** `max-w-7xl mx-auto` — keep current
- **Sidebar/Header:** Consider adding:
  - Tournament banner/logo area (FWC 26 branding)
  - Progress bar across top (Step 1/2 with visual pipeline)
  - Instructions panel collapsible on mobile
- **CTA Button:** Full-width neon green gradient button, rounded-full, with glow animation on hover
- **Padding:** More generous inner padding (`p-6` instead of `p-4`)

### 6. Step Indicator (PredictionsFlow)

Redesign the step indicator:

- Horizontal track with connecting line (completed = green, active = white, pending = muted)
- Step numbers in circular badges with checkmark on complete
- Smooth transition between steps (slide/fade)
- Bebas Neue font for step labels
- Step 1: "FASE DE GRUPOS" — Step 2: "TERCEROS LUGARES"
- Dark background bar behind indicator

### 7. Third-Placed View (Step 2)

- Redesign cards as toggleable dark tiles with radio-button feel
- Selected: green border glow, filled checkmark, slight scale up
- Unselected: dark glass with white/10 border, dimmed
- Disabled (max 8 reached on unselected): opacity 50%, no pointer
- Show group letter in Bebas Neue, third-place team with flag below
- Summary banner at bottom: green glass panel with selected groups list

### 8. Motion & Micro-interactions

All animations fast (~200ms), lightweight, CSS-only where possible:

| Element | Animation |
|---------|-----------|
| Card hover | `shadow` + `border-color` transition, 200ms ease-out |
| Drag start | Scale to 1.02, shadow boost, opacity 0.95 |
| Drop target area | Dashed border pulse |
| Drag end | Scale back, spring transition |
| Step transition | Content fades out/in, 150ms |
| CTA hover | Glow keyframe (`box-shadow pulse`) + slight translateY(-1px) |
| Rank badge on reorder | Staggered background color transition |
| Progress counter | Counter number color transition from white to green |

### 9. Mobile Considerations

- Group cards stack single-column on mobile (`grid-cols-1`)
- Touch targets: minimum 44×44px for drag handles and buttons
- Drag activation: `activationConstraint: { distance: 8 }` on mobile to prevent scroll conflicts
- Step indicator scrollable horizontally if needed
- Padding: `px-4` on mobile, `px-6` on tablet, `px-8` on desktop
- Third-place cards: `grid-cols-2` on mobile, `grid-cols-3` tablet, `grid-cols-4` desktop

---

## 📋 Technical Implementation Tasks

### Phase 1 — Theme Foundation

- [ ] Update `globals.css` with new dark-theme CSS variables (navy background, glass tokens, neon green accent, semantic status colors)
- [ ] Add backdrop-blur utilities (verify in Tailwind v4 / PostCSS config)
- [ ] Define animation keyframes: glow-pulse, fade-in, slide-up
- [ ] Ensure dark background applies to `body` and all parent containers

### Phase 2 — GroupCard Redesign

- [ ] Rewrite card wrapper: glassmorphism (`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`)
- [ ] Add inner padding `p-6`
- [ ] Group title: Bebas Neue, tracking-wider, with accent underline (green/gold)
- [ ] Progress indicator "X/12" pill in top-right
- [ ] Drop zone: dashed border on `DndContext` hover
- [ ] Hover glow effect on card container

### Phase 3 — SortableTeamRow Redesign

- [ ] Refactor `RANK_STYLES` to semantic tokens (qualified / wildcard / eliminated)
- [ ] Left accent bar based on rank position
- [ ] Rank badge redesign: circular, consistent dark bg, white number
- [ ] Flag size increase (`text-2xl`)
- [ ] Team name: white text, Inter medium
- [ ] Drag handle: 6-dot grid icon, visible on row hover
- [ ] Hover state: subtle white glow + background shift
- [ ] Dragging state: scale, shadow, z-index
- [ ] Drop animation: smooth transition via `@dnd-kit` transition

### Phase 4 — GroupsView Enhancements

- [ ] Update heading: Bebas Neue, 3xl, white, with subtitle in muted text
- [ ] Increase grid gap to `gap-6`
- [ ] CTA redesign: full-width, neon green gradient, rounded-full, glow animation, disabled state darker
- [ ] Add tournament subtitle / branding line below heading

### Phase 5 — Step Indicator (PredictionsFlow)

- [ ] Dark background bar with horizontal track
- [ ] Connecting line between steps (green when active/completed)
- [ ] Step badges: circular with number/checkmark, colored by state
- [ ] Step labels: Bebas Neue, uppercase
- [ ] Animated step transition (fade/slide)

### Phase 6 — ThirdPlacedView Redesign

- [ ] Dark glass tiles matching GroupCard style
- [ ] Selected state: green border glow, checkmark, scale(1.03)
- [ ] Group letter: Bebas Neue, tracking-wide
- [ ] Team name + flag centered in tile
- [ ] Counter bar: glass style with green number when 8/8
- [ ] Summary banner: green glass panel at bottom

### Phase 7 — Polish & QA

- [ ] Verify all states (hover, active, dragging, disabled, selected, empty)
- [ ] Check mobile touch targets and scroll behavior
- [ ] Confirm WCAG contrast on all text/background combinations
- [ ] Test DnD across all 12 groups (no cross-contamination)
- [ ] Ensure transitions don't interfere with DnD (use `will-change` sparingly)
- [ ] Snapshot/visual regression if using Storybook

---

## ✅ Acceptance Criteria

1. All 12 group cards render with dark glassmorphism style
2. Team rows show semantic styling by position (1st–2nd green, 3rd gold, 4th muted)
3. Drag & drop works smoothly with lift/shadow effects
4. Step indicator shows current step clearly with connection line
5. Third-placed view uses matching dark tiles with green selection glow
6. CTA button has neon green gradient with hover glow animation
7. All text is readable (WCAG AA) on dark backgrounds
8. Mobile: cards stack single-column, touch targets ≥44px, no scroll conflicts
9. Build compiles with `next build` (zero errors)
10. No regressions in existing functionality (login, admin, landing page)

---

## 📐 Design References

- **Inspired by:** FIFA World Cup tournament products, UEFA Champions League digital platforms, DAZN/ESPN betting UI
- **Color system:** Dark navy base (#0a0e1a) + neon green accent (#00e676) + gold (#ffd740)
- **Glass tokens:** `backdrop-blur-md`, `bg-white/5`, `border-white/10`
- **Typography:** Bebas Neue for headings (variable `--font-bebas`), Inter for body
- **Emoji flags:** Already implemented via `constants.ts` — use at `text-2xl` in rows

---

## 📁 Files to Modify

| File | Impact |
|------|--------|
| `src/app/globals.css` | Theme variables, keyframes, dark bg |
| `src/components/predictions/group-card.tsx` | Full card glass redesign |
| `src/components/predictions/sortable-team-row.tsx` | Semantic ranks, interaction states |
| `src/components/predictions/groups-view.tsx` | Layout, typography, CTA |
| `src/components/predictions/predictions-flow.tsx` | Step indicator redesign |
| `src/components/predictions/third-placed-view.tsx` | Dark tile redesign |

No new dependencies required — all visual changes use Tailwind v4 utilities, CSS, and existing `@dnd-kit` packages.

---

## 🚫 Out of Scope (for this issue)

- Backend / database changes
- Authentication or permission changes
- Admin panel UI
- Landing page redesign (already done)
- Real-time collaboration
- Translation / i18n
- Performance metrics beyond basic render optimization

---

## 📝 Notes

- Tailwind v4 is in use (notice `@import "tailwindcss"` instead of `@tailwind base/components/utilities`) — use the `@theme` directive or inline arbitrary values; avoid v3 `@apply` patterns that may not work
- Dark mode is currently implemented via `@media (prefers-color-scheme: dark)` in `globals.css` — decide whether to keep system-based or add a toggle
- The `backdrop-blur` utilities require no extra configuration in Tailwind v4, but verify browser support (Caniuse `backdrop-filter`)
- `next/font/google` already loads Bebas Neue as `--font-bebas` in `layout.tsx` — reference via `font-[family-name:var(--font-bebas)]` in Tailwind classes
