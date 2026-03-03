---
phase: 02-api-i18n-foundation
plan: "01"
subsystem: api
tags: [posti, zod, route-handler, proxy, validation, tdd]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: postal-codes.json and project scaffold (Next.js 15.2.2 App Router)
provides:
  - GET /api/delivery?postalCode=XXXXX Route Handler proxying Posti API server-to-server
  - src/lib/get-delivery-dates.ts typed wrapper with Zod validation for Server Component use
  - DeliverySchema, DeliveryData types for upstream response validation
affects: [03-ui-components, 04-geolocation, any phase needing Posti delivery data]

# Tech tracking
tech-stack:
  added: [zod@^4.3.6]
  patterns:
    - Route Handler as API proxy (eliminates CORS, server-to-server fetch)
    - Zod safeParse discriminated union for external API validation
    - TDD with node:test and mocked global.fetch

key-files:
  created:
    - src/lib/get-delivery-dates.ts
    - src/lib/get-delivery-dates.test.ts
    - src/app/api/delivery/route.ts
  modified:
    - package.json (added zod dependency)

key-decisions:
  - "Posti API returns [] (empty array) for P.O. Box codes and empty query — empty array check added after safeParse"
  - "Posti API returns valid data even for nonexistent codes (e.g. 99999) — no special handling needed"
  - "Route Handler imports DeliverySchema from @/lib/get-delivery-dates to share schema between lib and handler"
  - "export const dynamic = 'force-dynamic' + cache: 'no-store' both required — delivery dates change daily"

patterns-established:
  - "Pattern: Validate 5-digit postal code with /^\\d{5}$/ before calling upstream API"
  - "Pattern: Return structured { error: string } with correct HTTP status (400/502) — never let Next.js generate a 500"
  - "Pattern: Test async functions with mocked global.fetch using node:test + node:assert"

requirements-completed: [API-01, API-02]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 02 Plan 01: Posti API Proxy Route Handler with Zod Validation Summary

**Server-side Posti API proxy at GET /api/delivery with Zod validation, structured error responses, and a typed reusable lib wrapper — no CORS, no 500 crashes**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-03T13:47:22Z
- **Completed:** 2026-03-03T13:51:02Z
- **Tasks:** 2
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- Created `src/lib/get-delivery-dates.ts` — typed wrapper using Zod for Server Component use; returns discriminated union `{ success: true, data } | { success: false, error }`
- Created `src/app/api/delivery/route.ts` — Route Handler proxy eliminating CORS; validates postal code format, upstream response shape, and handles all error paths without 500 crashes
- Spot-checked live Posti API: confirmed empty array for P.O. Box codes, valid response for any 5-digit code including fictional ones
- 9 unit tests pass covering all behavior cases (success, non-200, malformed JSON, empty array, network error, schema shape)

## Task Commits

Each task was committed atomically:

1. **RED (tests): Posti API typed lib tests** - `cea4e23` (test)
2. **GREEN: Implement getDeliveryDates typed lib** - `6c94094` (feat)
3. **Task 2: Create Route Handler proxy** - `3907f5a` (feat)

_Note: TDD task 1 has two commits (test RED → feat GREEN)_

## Files Created/Modified

- `src/lib/get-delivery-dates.ts` - Typed Posti API wrapper with DeliverySchema (Zod), DeliveryData type, getDeliveryDates() function
- `src/lib/get-delivery-dates.test.ts` - 9 unit tests with mocked fetch covering all paths
- `src/app/api/delivery/route.ts` - Route Handler at /api/delivery with postal code validation, Zod response validation, structured error responses
- `package.json` - Added zod@^4.3.6 to dependencies

## Decisions Made

- **Posti API edge case: empty array for P.O. Box codes.** `?q=00011` returns `[]`. The lib's `parsed.data.length === 0` check returns `{ success: false, error }` cleanly. Route Handler passes the raw Posti array through (including empty), which is fine since Route Handler doesn't use `getDeliveryDates()`.
- **Nonexistent postal codes return data.** `?q=99999` returns a valid response from Posti (fictional dates). The API doesn't validate postal code existence — only format validation (5 digits) is in scope.
- **Schema shared between lib and handler.** `route.ts` imports `DeliverySchema` from `@/lib/get-delivery-dates` — single source of truth for the shape.
- **Both caching guards required.** `export const dynamic = 'force-dynamic'` at module scope AND `cache: 'no-store'` on fetch — both needed to prevent Next.js from caching delivery dates that change daily.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Dev server port conflict — ports 3000, 3001, and 3002 were occupied; server auto-selected port 4000. Verification adapted to use port 4000. No code changes required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `/api/delivery?postalCode=XXXXX` ready for client-side fetch from UI components (Phase 3)
- `getDeliveryDates()` ready for direct Server Component use (Phase 3)
- Both typed: `DeliveryData` type available for component props
- All error paths structured — UI can display meaningful messages without special-casing 500s

---
*Phase: 02-api-i18n-foundation*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: src/lib/get-delivery-dates.ts
- FOUND: src/lib/get-delivery-dates.test.ts
- FOUND: src/app/api/delivery/route.ts
- FOUND: .planning/phases/02-api-i18n-foundation/02-01-SUMMARY.md
- FOUND commit: cea4e23 (test RED phase)
- FOUND commit: 6c94094 (feat GREEN phase)
- FOUND commit: 3907f5a (feat Route Handler)
