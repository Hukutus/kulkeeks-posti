---
phase: quick-3
plan: 1
subsystem: theme
tags: [bugfix, dark-mode, locale, client-navigation, next-intl]
dependency_graph:
  requires: []
  provides: [theme-persistence-on-locale-switch]
  affects: [src/app/[locale]/layout.tsx, src/components/ThemeSync.tsx]
tech_stack:
  added: []
  patterns: [client-component-sync, useEffect-no-deps]
key_files:
  created:
    - src/components/ThemeSync.tsx
  modified:
    - src/app/[locale]/layout.tsx
decisions:
  - useEffect with no dependency array chosen for simplicity and guaranteed correctness on all re-renders (cost is negligible: one localStorage read + classList check)
  - Inline script kept for FOUC prevention on initial full page loads; ThemeSync handles client-side navigations
metrics:
  duration: "~1 minute"
  completed: "2026-03-03"
  tasks_completed: 2
  files_changed: 2
---

# Quick Task 3: Fix Theme Resetting to Light When Changing Locale Summary

**One-liner:** ThemeSync client component re-applies dark class from localStorage on every render, fixing theme reset on next-intl locale switches.

## What Was Built

A minimal `ThemeSync` client component that runs after every React render to ensure `document.documentElement.classList` reflects the theme stored in `localStorage`. This fixes the bug where switching locale via next-intl's `router.replace()` causes React to reconcile the `<html>` element back to the server-rendered value (which lacks the `dark` class), effectively resetting the theme to light mode.

## Root Cause

The inline `<script>` in layout.tsx runs synchronously on initial full page loads only. Client-side locale navigation does not trigger a full page load, so the script never re-runs. React's reconciliation then strips any `dark` class that was applied on the client, reverting to the server-rendered className.

## Solution Architecture

Two-layer theme management:
1. **Inline script** (existing) — synchronously applies theme before first paint, preventing FOUC
2. **ThemeSync component** (new) — `useEffect` with no dependency array re-applies theme after every render, including those triggered by locale switches

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ThemeSync client component | d7e6e5e | src/components/ThemeSync.tsx |
| 2 | Integrate ThemeSync into layout and verify | ab00433 | src/app/[locale]/layout.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx next build` completed successfully with no errors
- All 5 pages (fi, en, sv, not-found, API routes) generated correctly

## Self-Check: PASSED

- src/components/ThemeSync.tsx: FOUND
- src/app/[locale]/layout.tsx: FOUND (modified)
- Commit d7e6e5e: FOUND
- Commit ab00433: FOUND
