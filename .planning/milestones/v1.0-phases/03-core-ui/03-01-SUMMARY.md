---
phase: 03-core-ui
plan: 01
subsystem: ui
tags: [next-font, caveat, tailwind-v4, i18n, date-utils, tdd]

# Dependency graph
requires:
  - phase: 02-api-i18n-foundation
    provides: next-intl layout structure, messages/*.json pattern, globals.css base

provides:
  - Caveat variable font loaded via next/font with --font-caveat CSS variable on html element
  - font-handwriting Tailwind utility registered via @theme inline in globals.css
  - delivery-utils.ts with getTodayISO, getCurrentWeekISO, filterWeekDeliveries, isDeliveryDay
  - delivery-utils.test.ts with 17 tests covering all date utility functions
  - Delivery i18n namespace in en/fi/sv locale files

affects:
  - 03-02-core-ui (depends directly on all outputs of this plan)

# Tech tracking
tech-stack:
  added: [next/font/google (Caveat)]
  patterns:
    - TDD with node:test and node:assert/strict for pure utility functions
    - "@theme inline for runtime CSS variables in Tailwind v4"
    - Monday-indexed week using (dayOfWeek + 6) % 7 formula

key-files:
  created:
    - src/lib/delivery-utils.ts
    - src/lib/delivery-utils.test.ts
  modified:
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/globals.css
    - messages/en.json
    - messages/fi.json
    - messages/sv.json

key-decisions:
  - "Use @theme inline (not bare @theme) for font CSS variable mapping — bare @theme resolves at build time and loses the var() reference set by next/font at runtime"
  - "getTodayISO uses local date methods (getFullYear/getMonth/getDate), not toISOString() which returns UTC — prevents off-by-one errors in timezones"
  - "getCurrentWeekISO uses (dayOfWeek + 6) % 7 to convert JS Sunday=0 to Monday-indexed offset — handles Sunday correctly returning Mon-Sun of same week"

patterns-established:
  - "TDD pattern: write failing tests first using node:test + node:assert/strict, commit RED, implement, commit GREEN"
  - "Date utilities use local time methods not UTC to avoid timezone day boundary issues"
  - "Tailwind v4 runtime CSS variables use @theme inline directive"

requirements-completed: [VIS-01, DISP-05]

# Metrics
duration: 2min
completed: 2026-03-03
---

# Phase 3 Plan 01: Visual Foundation and Date Utilities Summary

**Caveat handwriting font with Tailwind v4 @theme inline, tested delivery date utility functions (getTodayISO/getCurrentWeekISO/filterWeekDeliveries/isDeliveryDay), and Delivery i18n namespace in all three locales**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-03T15:33:39Z
- **Completed:** 2026-03-03T15:35:50Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created delivery-utils.ts with 4 exported date utility functions using local time methods, all with TDD coverage (17 passing tests)
- Set up Caveat variable font via next/font/google with CSS variable applied to html element
- Registered font-handwriting Tailwind utility via @theme inline for runtime CSS variable compatibility
- Added Delivery i18n namespace with 6 keys (errorTitle, weekTitle, postalCode, yes, no, today) to en/fi/sv

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for delivery date utilities** - `4c9b6cb` (test)
2. **Task 1 GREEN: Implement delivery date utility functions** - `996ebc3` (feat)
3. **Task 2: Set up Caveat font and add Delivery translation keys** - `033fe18` (feat)

_Note: TDD tasks had separate RED (test) and GREEN (feat) commits_

## Files Created/Modified
- `src/lib/delivery-utils.ts` - Date utility functions: getTodayISO, getCurrentWeekISO, filterWeekDeliveries, isDeliveryDay
- `src/lib/delivery-utils.test.ts` - 17 tests covering all four utility functions using node:test + node:assert/strict
- `src/app/[locale]/layout.tsx` - Added Caveat font import and caveat.variable class on html element
- `src/app/[locale]/globals.css` - Added @theme inline block mapping --font-handwriting to var(--font-caveat)
- `messages/en.json` - Added Delivery namespace (6 keys)
- `messages/fi.json` - Added Delivery namespace (6 keys in Finnish)
- `messages/sv.json` - Added Delivery namespace (6 keys in Swedish)

## Decisions Made
- Used `@theme inline` (not bare `@theme`) for font CSS variable mapping — bare `@theme` resolves at build time and would lose the `var()` reference set by next/font at runtime
- `getTodayISO` uses local date methods (`getFullYear`/`getMonth`/`getDate`), not `toISOString()` which returns UTC — prevents off-by-one errors in timezones east/west of UTC
- `getCurrentWeekISO` uses `(dayOfWeek + 6) % 7` to convert JS Sunday=0 to Monday-indexed offset — handles Sunday correctly, returning Mon-Sun of the same week

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all tasks completed cleanly on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- font-handwriting Tailwind utility is available for use in components
- delivery-utils.ts is ready for import in the main page component
- All Delivery translation keys are available via useTranslations('Delivery')
- Plan 02 (main page assembly) can proceed immediately

---
*Phase: 03-core-ui*
*Completed: 2026-03-03*

## Self-Check: PASSED

- src/lib/delivery-utils.ts: FOUND
- src/lib/delivery-utils.test.ts: FOUND
- src/app/[locale]/layout.tsx: FOUND
- src/app/[locale]/globals.css: FOUND
- 03-01-SUMMARY.md: FOUND
- Commit 4c9b6cb (test RED): FOUND
- Commit 996ebc3 (feat GREEN): FOUND
- Commit 033fe18 (feat Task 2): FOUND
