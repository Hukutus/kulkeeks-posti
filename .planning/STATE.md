---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-03T17:40:31.706Z"
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 7
  completed_plans: 7
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.
**Current focus:** Phase 4 - Postal Code UX + Deployment

## Current Position

Phase: 4 of 4 (Postal Code UX + Deployment)
Plan: 3 of 3 in current phase (plans 01-02 complete)
Status: Phase 4 in progress — plans 01-02 complete, plan 03 pending
Last activity: 2026-03-03 — Plan 04-02 complete, app deployed to posti-days.vercel.app

Progress: [█████████░] 93%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 12 min
- Total execution time: 0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-data-pipeline | 1 | 4 min | 4 min |
| 02-api-i18n-foundation | 2 | 4 min | 4 min |
| 03-core-ui | 2 | 17 min | 8 min |
| 04-postal-code-ux-deployment | 2 | 65 min | 32 min |

**Recent Trend:**
- Last 5 plans: 4 min, 2 min, 3 min, 3 min, 62 min
- Trend: longer due to Vercel deployment + security patches

*Updated after each plan completion*
| Phase 01-data-pipeline P01 | 4 | 3 tasks | 10 files |
| Phase 02-api-i18n-foundation P01 | 4 | 2 tasks | 4 files |
| Phase 03-core-ui P01 | 2 | 2 tasks | 7 files |
| Phase 03-core-ui P02 | 15 | 1 task | 2 files |
| Phase 04-postal-code-ux-deployment P01 | 3 | 2 tasks | 8 files |
| Phase 04-postal-code-ux-deployment P02 | 62 | 2 tasks | 5 files |

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
- [03-02]: Removed dialect name/region display from main UI — answer is the focus, metadata added visual clutter
- [03-02]: whitespace-nowrap on answer text prevents large YES/NO from wrapping on 375px viewport
- [03-02]: await connection() before Math.random() forces per-request rendering for dialect randomness
- [04-01]: DeliveryDisplay is a client component fetching /api/delivery — server render moved client-side to enable postal code personalization
- [04-01]: DIGITRANSIT_API_KEY is server-only (no NEXT_PUBLIC_ prefix) — geocode proxy keeps API key off the client
- [04-01]: PostalCodeGate checks localStorage on mount before triggering geolocation — avoids unnecessary browser prompts on return visits
- [04-02]: TZ env var is reserved on Vercel — replaced with Intl.DateTimeFormat(Europe/Helsinki) in delivery-utils.ts for correct Finnish date computation
- [04-02]: Next.js 15.2.2 blocked by Vercel (CVE-2025-66478) — upgraded to 15.5.12 (latest stable 15.x)
- [04-02]: Module-level cachedData/fuseInstance for postal code lazy-loading — avoids 250KB JSON bundle impact

### Pending Todos

None.

### Blockers/Concerns

None. Production deployment complete at https://posti-days.vercel.app.

## Session Continuity

Last session: 2026-03-03
Stopped at: Completed 04-postal-code-ux-deployment/04-02-PLAN.md
Resume file: None
