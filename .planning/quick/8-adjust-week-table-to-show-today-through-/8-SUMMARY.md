---
phase: quick-8
plan: 01
subsystem: ui
tags: [next-intl, date-range, caching, delivery-utils, week-table, i18n]

requires:
  - phase: quick-5
    provides: WCAG 2.2 AA accessibility structure preserved

provides:
  - getDateRange utility replacing getCurrentWeekISO for today-to-last-API-date ranges
  - filterDeliveries replacing filterWeekDeliveries with clearer naming
  - API response caching for 86400 seconds via next.revalidate
  - Updated weekTitle i18n keys across all 4 locales

affects: [delivery-utils, DeliveryDisplay, api-caching]

tech-stack:
  added: []
  patterns:
    - "Date range from today to last API date (not fixed Mon-Sun week)"
    - "next.revalidate: 86400 for 24h ISR caching on Posti API fetch"
    - "Route handler revalidate = 86400 for ISR-style caching"

key-files:
  created: []
  modified:
    - src/lib/delivery-utils.ts
    - src/lib/delivery-utils.test.ts
    - src/components/DeliveryDisplay.tsx
    - src/lib/get-delivery-dates.ts
    - src/app/api/delivery/route.ts
    - messages/en.json
    - messages/fi.json
    - messages/sv.json
    - messages/se.json

key-decisions:
  - "getDateRange falls back to [startISO] when endISO is before startISO (not an error)"
  - "Cache Posti API responses for 86400s using next.revalidate (data only changes at midnight)"
  - "Removed getCurrentWeekISO entirely — date range is always computed from today + API last date"

patterns-established:
  - "Date ranges computed dynamically from API data, not hardcoded calendar weeks"

requirements-completed: [QUICK-8]

duration: 12min
completed: 2026-03-04
---

# Phase Quick 8: Adjust Week Table to Show Today Through Last API Date Summary

**Week table now shows today through the last Posti API delivery date (not Mon-Sun), with 24h API response caching via next.revalidate**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-04T07:00:00Z
- **Completed:** 2026-03-04T07:12:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Replaced `getCurrentWeekISO` (Mon-Sun) with `getDateRange(startISO, endISO)` generating today-to-last-API-date ranges
- Renamed `filterWeekDeliveries` to `filterDeliveries` for semantic clarity
- Changed Posti API fetch from `cache: 'no-store'` to `next: { revalidate: 86400 }` in both fetch calls
- Removed `export const dynamic = 'force-dynamic'` from route handler and added `export const revalidate = 86400`
- Updated weekTitle in all 4 locales: "This week" -> "Upcoming" (en), "Tulossa" (fi), "Kommande" (sv), "Boahttime" (se)
- All 16 tests pass, build succeeds, WCAG 2.2 AA accessibility preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace week utilities with date-range utilities and add API caching** - `41bfa85` (feat)
2. **Task 2: Update DeliveryDisplay to use today-to-last-date range and update i18n keys** - `7b7e825` (feat)

## Files Created/Modified

- `src/lib/delivery-utils.ts` - Added `getDateRange`, renamed `filterWeekDeliveries` to `filterDeliveries`, removed `getCurrentWeekISO`
- `src/lib/delivery-utils.test.ts` - Replaced getCurrentWeekISO tests with getDateRange tests, renamed filterWeekDeliveries tests
- `src/components/DeliveryDisplay.tsx` - Uses `getDateRange` and `filterDeliveries`, computes range from today to last API date
- `src/lib/get-delivery-dates.ts` - Changed fetch cache from `no-store` to `next: { revalidate: 86400 }`
- `src/app/api/delivery/route.ts` - Removed `force-dynamic`, added `revalidate = 86400`, updated fetch to use `next.revalidate`
- `messages/en.json` - weekTitle: "Upcoming"
- `messages/fi.json` - weekTitle: "Tulossa"
- `messages/sv.json` - weekTitle: "Kommande"
- `messages/se.json` - weekTitle: "Boahttime"

## Decisions Made

- `getDateRange` returns `[startISO]` (not an error) when endISO is before startISO — handles edge case of no future API dates gracefully
- Caching at 86400s because Posti API data only changes at midnight; no-store was causing unnecessary API calls on every request
- Removed `getCurrentWeekISO` entirely rather than keeping it as a deprecated alias — no other consumers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Week table now reflects actual Posti API delivery schedule, not calendar week
- API caching reduces load on Posti API; responses served from cache for up to 24h
- All accessibility attributes preserved

---
*Phase: quick-8*
*Completed: 2026-03-04*

## Self-Check: PASSED

- FOUND: src/lib/delivery-utils.ts
- FOUND: src/lib/delivery-utils.test.ts
- FOUND: src/components/DeliveryDisplay.tsx
- FOUND: src/lib/get-delivery-dates.ts
- FOUND: src/app/api/delivery/route.ts
- FOUND: commit 41bfa85 (Task 1)
- FOUND: commit 7b7e825 (Task 2)
