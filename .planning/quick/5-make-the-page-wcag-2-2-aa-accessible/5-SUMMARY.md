---
phase: quick
plan: 5
subsystem: accessibility
tags: [wcag, a11y, aria, keyboard, screen-reader, contrast]
dependency_graph:
  requires: []
  provides: [WCAG-AA compliance]
  affects: [DeliveryDisplay, PostalCodeSelector, PostalCodeGate, SettingsBar, layout, page]
tech_stack:
  added: []
  patterns: [aria-live polite, sr-only, focus-visible, motion-safe, skip-nav, role=status, nav landmark, section aria-labelledby]
key_files:
  created: []
  modified:
    - src/app/[locale]/globals.css
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/components/DeliveryDisplay.tsx
    - src/components/PostalCodeSelector.tsx
    - src/components/PostalCodeGate.tsx
    - src/components/SettingsBar.tsx
    - messages/en.json
    - messages/fi.json
    - messages/sv.json
    - messages/se.json
decisions:
  - "Used motion-safe:animate-pulse Tailwind class approach instead of global CSS for reduced motion — cleaner and more targeted"
  - "Placed sr-only h1 in page.tsx rather than sub-components to avoid duplicate headings in both PostalCodeSelector and DeliveryDisplay states"
  - "Used focus-visible: prefix instead of focus: on all interactive elements to prevent showing outlines on mouse clicks"
  - "Added p-2 padding to SettingsBar buttons for touch targets rather than min-h/min-w to keep the compact visual appearance"
metrics:
  duration: 4 min
  completed_date: "2026-03-03"
  tasks_completed: 2
  files_modified: 11
---

# Quick Task 5: Make the Page WCAG 2.2 AA Accessible — Summary

**One-liner:** Full WCAG 2.2 AA pass: contrast upgrades to stone-500/400, focus-visible outlines on all interactive elements, skip nav + sr-only h1, aria-live delivery status, motion-safe animations across all 4 locales.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Fix color contrast, focus indicators, touch targets, reduced motion | 0ad5ca1 | Complete |
| 2 | Add skip navigation, heading hierarchy, ARIA landmarks, live regions, SR text | 8291b06 | Complete |

## What Was Built

### Task 1: Color Contrast, Focus Indicators, Touch Targets, Reduced Motion

**Color contrast** — All secondary text upgraded from the failing `text-stone-400 dark:text-stone-500` to the passing `text-stone-500 dark:text-stone-400` across DeliveryDisplay, PostalCodeSelector, and SettingsBar. Active locale buttons moved to `text-stone-700 dark:text-stone-200`. Municipality group headers updated to `text-stone-600 dark:text-stone-400`.

**Focus indicators** — Added `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:focus-visible:outline-stone-400 focus-visible:rounded-sm` to every button and link in all components. The ComboboxInput switched from `focus:ring-2` to `focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400`.

**Touch targets** — Added `p-2` to all SettingsBar buttons (locale toggles, theme toggle, GitHub link), giving 30px+ effective targets. Added `py-2 px-3` to action buttons in PostalCodeSelector and `py-1 px-2` to the "change postal code" button in DeliveryDisplay.

**Reduced motion** — Replaced all `animate-pulse` with `motion-safe:animate-pulse` in DeliveryDisplay, PostalCodeSelector, and PostalCodeGate. Added `@media (prefers-reduced-motion: reduce)` global override in globals.css as an extra safety net.

**SettingsBar** — Converted from plain `<div>` to `<nav aria-label="Settings">` to provide a navigation landmark.

### Task 2: Skip Navigation, Heading Hierarchy, ARIA Landmarks, Live Regions

**Skip navigation** — Added a skip-to-content `<a href="#main-content">` as the first focusable element in layout.tsx. Uses `sr-only focus:not-sr-only` pattern to show only on keyboard focus. The `<main>` element in page.tsx gained `id="main-content"` and `tabIndex={-1}`.

**Heading hierarchy** — Added `<h1 className="sr-only">Posti Days</h1>` in page.tsx inside the `<main>` element. The existing `<h2>` in DeliveryDisplay ("This week") forms a proper h1 > h2 hierarchy.

**Live regions** — Wrapped the dialect question + delivery answer in `<div role="status" aria-live="polite">` in DeliveryDisplay so screen readers announce the delivery status when it loads. Wrapped geolocation status messages in PostalCodeSelector with the same pattern. Added `role="status" aria-label="Loading"` to the PostalCodeGate loading spinner.

**Week day SR text** — Added `<span className="sr-only">{isDelivery ? t('deliveryDay') : t('noDelivery')}</span>` to each week day list item so screen readers announce delivery/no-delivery status alongside the date.

**Week view section** — Wrapped the week view `<div>` in `<section aria-labelledby="week-title">` with the h2 gaining `id="week-title"`.

**Translation keys** — Added `deliveryDay` and `noDelivery` keys to all 4 locale files (en, fi, sv, se).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate sr-only h1 from DeliveryDisplay**
- **Found during:** Task 2
- **Issue:** Plan suggested adding h1 in DeliveryDisplay but page.tsx also received a sr-only h1, which would create two h1 elements on the page
- **Fix:** Placed the single h1 in page.tsx only (server component), removed the one originally drafted for DeliveryDisplay
- **Files modified:** src/components/DeliveryDisplay.tsx
- **Commit:** 8291b06

### Out-of-scope items

None discovered.

## Verification

- [x] `npx next build` passes without errors (all 4 locales, all routes)
- [x] Skip nav: `<a href="#main-content">` is first child of body, sr-only until focused
- [x] h1 "Posti Days" present as sr-only in page.tsx main element
- [x] Week h2 ("This week") properly subordinate to h1
- [x] Delivery status wrapped in `aria-live="polite"` region
- [x] Each week day has sr-only delivery status text
- [x] SettingsBar wrapped in `<nav aria-label="Settings">`
- [x] All loading states have `role="status"`
- [x] All buttons/links have `focus-visible:outline-*` classes
- [x] All secondary text is stone-500/stone-400 minimum
- [x] `motion-safe:animate-pulse` used everywhere
- [x] `prefers-reduced-motion` media query in globals.css
- [x] All 4 locale files updated with deliveryDay/noDelivery keys

## Self-Check: PASSED

Files verified present:
- src/app/[locale]/globals.css: FOUND
- src/app/[locale]/layout.tsx: FOUND
- src/app/[locale]/page.tsx: FOUND
- src/components/DeliveryDisplay.tsx: FOUND
- src/components/PostalCodeSelector.tsx: FOUND
- src/components/PostalCodeGate.tsx: FOUND
- src/components/SettingsBar.tsx: FOUND
- messages/en.json: FOUND
- messages/fi.json: FOUND
- messages/sv.json: FOUND
- messages/se.json: FOUND

Commits verified:
- 0ad5ca1: FOUND (Task 1)
- 8291b06: FOUND (Task 2)
