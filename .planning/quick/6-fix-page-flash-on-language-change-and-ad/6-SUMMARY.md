---
phase: quick-6
plan: "01"
subsystem: theme-ux
tags: [theme, locale, flash-fix, accessibility, system-theme]
dependency_graph:
  requires: []
  provides: [flash-free-locale-switching, three-state-theme-toggle, system-theme-support]
  affects: [SettingsBar, ThemeSync, layout]
tech_stack:
  added: []
  patterns: [startTransition-navigation, custom-events, matchMedia-listener, inline-script-theme-fix]
key_files:
  created: []
  modified:
    - src/components/SettingsBar.tsx
    - src/components/ThemeSync.tsx
    - src/app/[locale]/layout.tsx
decisions:
  - "3-state theme cycle: light->dark->system->light, stored as string in localStorage"
  - "startTransition + background-color pre-set as dual-layer flash prevention"
  - "Custom window event 'theme-sync' used for same-page ThemeSync notification"
  - "ThemeSync initialized with [] deps (mount only) plus event listeners for dynamic updates"
metrics:
  duration: "~2 min"
  completed: "2026-03-03T20:34:15Z"
  tasks_completed: 1
  files_modified: 3
---

# Quick Task 6: Fix Page Flash on Language Change and Add System Theme Summary

**One-liner:** Flash-free locale switching via startTransition + inline background-color pre-set, with 3-state light/dark/system theme cycling that follows OS preference in real time.

## What Was Built

### Flash Prevention (locale switching)
Two complementary techniques eliminate the white flash in dark mode when switching locales:

1. **`startTransition`** — wraps `router.replace()` so React keeps showing the old UI while the new locale page loads, preventing the unmount-flash pattern.
2. **Background-color pre-set** — before `router.replace`, explicitly sets `document.documentElement.style.backgroundColor` to the matching theme color (`#0c0a09` for dark, `#fafaf9` for light). ThemeSync clears this inline style after hydration via `removeProperty('background-color')`.

### System Theme Support
Three interconnected pieces handle system theme:

**`layout.tsx` inline script** — Updated to handle the `'system'` value: `stored === 'dark'` applies dark, `stored === 'light'` applies light, and anything else (including `'system'` or absent) falls through to `matchMedia`. This ensures no flash even on initial load in system mode.

**`ThemeSync.tsx`** — Completely rewritten:
- Runs on mount only (`[]` deps) instead of every render
- Adds `matchMedia('(prefers-color-scheme: dark)')` change listener for real-time OS theme tracking
- Listens for custom `'theme-sync'` window event fired by SettingsBar after user toggles
- Clears inline `backgroundColor` style set by flash-prevention safeguard

**`SettingsBar.tsx`** — Updated theme toggle:
- 3-state cycle: light -> dark -> system -> light
- New `MonitorIcon` SVG for the system state
- Icons: light = MoonIcon (next: dark), dark = MonitorIcon (next: system), system = SunIcon (next: light)
- State tracked via React `useState<ThemePref>` initialized from localStorage on mount
- WCAG-compliant `aria-label` includes current state and action: "Theme: dark, switch to system"
- `isPending` from `useTransition` exposed as `aria-disabled` on locale buttons

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| a1d602f | feat(quick-6-01): fix locale flash and add 3-state system theme support |

## Self-Check: PASSED

- [x] `src/components/SettingsBar.tsx` — modified, committed
- [x] `src/components/ThemeSync.tsx` — modified, committed
- [x] `src/app/[locale]/layout.tsx` — modified, committed
- [x] Build passes: `npx next build` completed without errors
- [x] Commit a1d602f exists
