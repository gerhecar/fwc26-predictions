---
name: 'Background Image — Dashboard Page'
about: 'Add the Estadio Azteca / stadium atmospheric photo as background on the dashboard'
title: '🌆 Añadir imagen de fondo al Dashboard'
labels: ['enhancement', 'ui']
assignees: ''
---

## 🎯 Goal

Add a full-screen background image to the Dashboard (`/dashboard`) page, matching the same premium dark-stadium aesthetic used in `/predictions`.

---

## 🧠 Current State

The dashboard (`src/app/dashboard/page.tsx`) currently renders inside `<AppShell>` with a solid dark background (`#0a0e1a` from `globals.css`). No background image or overlay is applied.

---

## 📸 Background Image

Use the following Unsplash photo of Emirates Stadium (Arsenal FC, London) — a wide-angle soccer stadium shot with lush green pitch and white seats that fits the football aesthetic:

```
https://images.unsplash.com/photo-1731312084255-6b38e3ea2484?fm=jpg&q=60&w=3000
```

**Credit:** Photo by 安 崔士 (@treesan) on Unsplash

---

## 📐 Implementation

Apply the same pattern used in `src/app/predictions/page.tsx`:

```tsx
<div
  className="min-h-screen"
  style={{
    backgroundImage: `url(${BG_URL})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }}
>
  <div className="min-h-screen bg-[#0a0e1a]/70 backdrop-blur-[2px]">
    {children}
  </div>
</div>
```

- `BG_URL` constant with the Unsplash URL
- Outer `div` with `backgroundImage`, cover, center, fixed
- Inner overlay `div` with `bg-[#0a0e1a]/70` (70% opacity navy) and `backdrop-blur-[2px]`
- The existing `<AppShell>` and content render inside the overlay

---

## ✅ Acceptance Criteria

1. Dashboard renders with the stadium photo as full-screen background
2. Dark overlay (`bg-[#0a0e1a]/70 backdrop-blur-[2px]`) ensures text readability
3. `backgroundAttachment: 'fixed'` for parallax effect on scroll
4. No layout shift or visual regression on cards/grid
5. All existing content (cards, navigation, text) remains fully visible and readable
6. Build compiles with `next build` (zero errors)

---

## 📁 Files to Modify

| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | Add background image wrapper with overlay |

---

## 🚫 Out of Scope

- Nav/AppShell changes
- New components
- Responsive background image swapping
- Lazy loading / blur placeholder (optional enhancement)

---

## 📝 Notes

- Follow same pattern as `src/app/predictions/page.tsx`
- The Unsplash URL is a direct CDN link (`images.unsplash.com`) — no CORS issues expected
- No new dependencies required
