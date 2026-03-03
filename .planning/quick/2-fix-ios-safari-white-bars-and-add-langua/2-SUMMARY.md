---
phase: quick
plan: 2
subsystem: ui
tags: [ios-safari, viewport, safe-area, dark-mode, i18n, next-intl, tailwind-v4]

requires: []
provides:
  - iOS Safari viewport-fit=cover with safe area inset CSS
  - Class-based dark mode toggle with localStorage persistence and no flash on load
  - Language switcher (FI/EN/SV) via next-intl router
  - SettingsBar component below postal code area in DeliveryDisplay
affects: [ui, mobile, a11y]

tech-stack:
  added: []
  patterns:
    - "Next.js 15 viewport export for viewport meta (not metadata)"
    - "Tailwind v4 @custom-variant dark for class-based dark mode"
    - "Inline script in body before children to prevent theme flash"
    - "next-intl useRouter().replace(pathname, { locale }) for locale switching"

key-files:
  created:
    - src/components/SettingsBar.tsx
  modified:
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/globals.css
    - src/app/[locale]/page.tsx
    - src/components/DeliveryDisplay.tsx

key-decisions:
  - "Used Next.js 15 viewport export (not metadata.viewport) for viewportFit=cover"
  - "Class-based dark mode via @custom-variant dark in Tailwind v4 instead of media query"
  - "Theme persistence uses localStorage key posti-days:theme with system preference fallback"
  - "Inline SVG icons for sun/moon (no icon library dependency)"
  - "suppressHydrationWarning on html element because inline script may add dark class before hydration"

patterns-established:
  - "Viewport safety: html and body both have bg-stone-50/dark:bg-stone-950 to fill safe areas"
  - "Theme toggle: document.documentElement.classList + localStorage pattern"

requirements-completed: []

duration: 6min
completed: 2026-03-03
---

# Quick Task 2: Fix iOS Safari White Bars and Add Language/Theme Toggles Summary

**iOS Safari full-bleed fix via viewport-fit=cover + safe area CSS, plus SettingsBar component with class-based dark mode toggle and FI/EN/SV locale switching**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-03T19:42:38Z
- **Completed:** 2026-03-03T19:48:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Fixed iOS Safari white bars by exporting Next.js 15 `viewport` object with `viewportFit: 'cover'` and adding `env(safe-area-inset-*)` padding to the body in globals.css
- Added class-based dark mode with localStorage persistence and a no-flash inline script in layout.tsx body
- Created `SettingsBar` component with FI/EN/SV locale buttons and a sun/moon theme toggle, integrated below postal code area in `DeliveryDisplay`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix iOS Safari white bars with viewport-fit and safe area CSS** - `0ba54d5` (fix)
2. **Task 2: Add language and theme toggle buttons below the week table** - `6328339` (feat)

## Files Created/Modified

- `src/components/SettingsBar.tsx` - Language (FI/EN/SV) and theme (sun/moon) toggle component
- `src/app/[locale]/layout.tsx` - Added viewport export, bg classes on html/body, suppressHydrationWarning, inline theme script
- `src/app/[locale]/globals.css` - Added safe area inset padding, @custom-variant dark for class-based Tailwind dark mode
- `src/app/[locale]/page.tsx` - Changed min-h-screen to min-h-dvh on main element
- `src/components/DeliveryDisplay.tsx` - Imported and rendered SettingsBar below postal code control

## Decisions Made

- Used Next.js 15 `export const viewport: Viewport` (not `metadata.viewport`) - this is the correct way to set viewport meta in Next.js 15+
- Used `@custom-variant dark (&:where(.dark, .dark *))` in Tailwind v4 CSS for class-based dark mode
- Theme flash prevention via minified inline script in `<body>` before children, reading localStorage and checking `prefers-color-scheme`
- Inline SVG icons for sun and moon (no added icon library dependency)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Mobile iOS Safari now renders without white bars at top/bottom
- Language switching and dark/light mode toggle are available to users
- Dark mode class-based variant established for future Tailwind dark mode usage

## Self-Check

### Files Created/Modified

- `src/components/SettingsBar.tsx` - FOUND
- `src/app/[locale]/layout.tsx` - FOUND
- `src/app/[locale]/globals.css` - FOUND
- `src/app/[locale]/page.tsx` - FOUND
- `src/components/DeliveryDisplay.tsx` - FOUND

### Commits

- `0ba54d5` - FOUND
- `6328339` - FOUND

## Self-Check: PASSED

---
*Phase: quick-2*
*Completed: 2026-03-03*
