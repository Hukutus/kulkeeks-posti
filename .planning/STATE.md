---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-03-03T15:35:50Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 5
  completed_plans: 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.
**Current focus:** Phase 3 - Core UI

## Current Position

Phase: 3 of 4 (Core UI)
Plan: 1 of 2 in current phase (plan 01 complete)
Status: Phase 3 in progress — plan 01 done, plan 02 pending
Last activity: 2026-03-03 — Plan 03-01 complete

Progress: [███████░░░] 62%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 3 min
- Total execution time: 0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-pipeline | 1 | 4 min | 4 min |
| 02-api-i18n-foundation | 2 | 4 min | 4 min |
| 03-core-ui | 1 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 4 min, 4 min, 2 min
- Trend: improving

*Updated after each plan completion*
| Phase 01-data-pipeline P01 | 4 | 3 tasks | 10 files |
| Phase 02-api-i18n-foundation P01 | 4 | 2 tasks | 4 files |
| Phase 03-core-ui P01 | 2 | 2 tasks | 7 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-planning]: Swedish municipality names not in Statistics Finland XLSX — must be sourced from DVV or Statistics Finland kuntarekisteri; exact URL and format not yet verified (resolve before Phase 1)
- [Pre-planning]: Reverse geocoding lat/lon → Finnish postal code needs a service decision before Phase 4 (Digitransit API, Nominatim, or similar)
- [Pre-planning]: Posti API live behavior on edge cases (empty code, unknown code, weekend) should be spot-checked at start of Phase 2
- [01-01]: Use Statistics Finland Classification API for Swedish municipality names — official, free, no-auth, 308 municipalities confirmed working
- [01-01]: Use workbook.worksheets[0] (index) not sheet name — sheet name changed between 2025 XLSX and 2026 XLSX
- [01-01]: Commit public/data/postal-codes.json to repo — CI/Vercel builds do not need external API at deploy time
- [01-01]: Pad municipality codes to 3 digits before map lookup — ExcelJS may return numeric 91 instead of string "091"
- [Phase 02-01]: Posti API returns [] for P.O. Box codes — empty array check after safeParse handles this cleanly
- [Phase 02-01]: Route Handler imports DeliverySchema from @/lib/get-delivery-dates — single source of truth for Posti response shape
- [Phase 02-01]: Both cache guards required: export const dynamic = 'force-dynamic' + cache: 'no-store' on fetch — delivery dates change daily
- [02-02]: middleware.ts must be in src/ (not project root) when using Next.js 15 with src/app/ layout — rootDir is computed as src/ and Next.js only searches that directory
- [02-02]: @tailwindcss/postcss required for Tailwind v4 — was missing from package.json despite being referenced in postcss.config.mjs
- [03-01]: Use @theme inline (not bare @theme) for font CSS variable mapping — bare @theme resolves at build time and loses the var() reference set by next/font at runtime
- [03-01]: getTodayISO uses local date methods (getFullYear/getMonth/getDate), not toISOString() — prevents off-by-one errors in timezones
- [03-01]: getCurrentWeekISO uses (dayOfWeek + 6) % 7 to convert JS Sunday=0 to Monday-indexed offset — handles Sunday correctly

### Pending Todos

None.

### Blockers/Concerns

- **Phase 4 blocker:** Reverse geocoding service for lat/lon → Finnish postal code not decided. Must resolve before implementing POST-01.

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 03-core-ui/03-01-PLAN.md
Resume file: None
