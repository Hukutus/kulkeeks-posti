---
phase: 01-data-pipeline
plan: "01"
subsystem: data
tags: [exceljs, tsx, statistics-finland, postal-codes, xlsx, next.js, typescript, tailwind]

# Dependency graph
requires: []
provides:
  - "public/data/postal-codes.json: flat JSON array of 3018 postal code entries with Finnish and Swedish names"
  - "scripts/generate-postal-codes.ts: build-time script to regenerate postal codes from Statistics Finland"
  - "Next.js 15 project scaffold with TypeScript, Tailwind CSS"
affects:
  - 02-posti-api
  - 03-ui-foundation
  - 04-autocomplete

# Tech tracking
tech-stack:
  added:
    - "next 15.2.2: Next.js app router framework"
    - "react 19: UI library"
    - "exceljs 4.4.0: XLSX parsing for Statistics Finland postal code data"
    - "tsx 4.x: TypeScript script runner (zero-config)"
    - "tailwindcss 4: utility-first CSS"
    - "typescript 5: type safety"
  patterns:
    - "Build-time data generation: scripts/ run at prebuild, output committed to public/data/"
    - "Year-fallback download: try currentYear, fall back to currentYear-1 on non-200"
    - "Municipality code padding: always padStart(3, '0') before using as map key"
    - "Worksheet by index: workbook.worksheets[0] to avoid year-dependent sheet name"

key-files:
  created:
    - "scripts/generate-postal-codes.ts"
    - "scripts/generate-postal-codes.test.ts"
    - "public/data/postal-codes.json"
    - "package.json"
    - "tsconfig.json"
    - "next.config.ts"
    - "src/app/layout.tsx"
    - "src/app/page.tsx"
  modified: []

key-decisions:
  - "Use Statistics Finland Classification API (api.stat.fi/classificationservice) for Swedish municipality names — official, free, no-auth, 308 municipalities, 0 empty names"
  - "Use worksheet by index (workbook.worksheets[0]) not by name — sheet name changed between 2025 and 2026 XLSX files"
  - "Use same year for both XLSX and Classification API to prevent municipality code mismatches across years"
  - "Commit public/data/postal-codes.json to repo — CI/Vercel builds do not depend on external API availability at deploy time"
  - "Municipality codes padded to 3 digits with padStart before map lookup — ExcelJS may return numeric 91 instead of string 091"

patterns-established:
  - "Pattern 1 (Year-Fallback): downloadXlsx tries currentYear then currentYear-1, logs which year was used, throws if both fail"
  - "Pattern 2 (Worksheet by Index): workbook.worksheets[0] — never look up by name"
  - "Pattern 3 (Municipality Code Padding): String(code).padStart(3, '0') in both XLSX parser and API consumer"
  - "Pattern 4 (Data Integrity Guard): throw if any municipality code has no Swedish name match"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04]

# Metrics
duration: 4min
completed: 2026-03-03
---

# Phase 1 Plan 1: Data Pipeline Summary

**Statistics Finland XLSX postal code pipeline with Swedish municipality names via Classification API, producing 3018-entry JSON dataset committed to repo**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-03T12:32:42Z
- **Completed:** 2026-03-03T12:36:22Z
- **Tasks:** 3 completed
- **Files modified:** 10

## Accomplishments

- Next.js 15 project initialized with TypeScript, Tailwind CSS, exceljs, tsx
- Build-time script downloads Statistics Finland XLSX with year-fallback (2026 -> 2025 on 404)
- Swedish municipality names fetched from Statistics Finland Classification API (308 municipalities, 0 empty)
- All 3018 entries validated: postal_code, postal_area_name, postal_area_name_sv, municipality_name, municipality_name_sv all non-empty
- Spot-check confirmed: 00100 -> Helsinki / Helsingfors
- Unit tests cover municipality code padding, shape validation, error on missing Swedish name

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js project and install data pipeline dependencies** - `a6247b3` (chore)
2. **Task 2 (test): Add unit tests for postal code parsing logic** - `efdf2cc` (test)
3. **Task 2 (feat): Create postal code generation script** - `e28381a` (feat)
4. **Task 3: Add generated postal codes dataset** - `b8cf999` (feat)

_Note: TDD task (Task 2) has two commits: test RED phase then feat GREEN phase_

## Files Created/Modified

- `scripts/generate-postal-codes.ts` - Build-time script: downloadXlsx, fetchSwedishMunicipalityNames, parseXlsx, main
- `scripts/generate-postal-codes.test.ts` - Unit tests using node:test for parsing logic
- `public/data/postal-codes.json` - Generated dataset: 3018 entries, all 5 fields populated
- `package.json` - Next.js project config with generate-postal-codes and prebuild scripts
- `tsconfig.json` - TypeScript config for Next.js app router
- `next.config.ts` - Next.js configuration stub
- `postcss.config.mjs` - PostCSS config for Tailwind CSS 4
- `src/app/layout.tsx` - Root layout stub
- `src/app/page.tsx` - Home page stub
- `.gitignore` - Standard Next.js gitignore

## Decisions Made

- Used Statistics Finland Classification API for Swedish municipality names — the XLSX does not contain Swedish municipality names; the Classification API provides all 308 municipalities in one unauthenticated GET request
- Used `workbook.worksheets[0]` (index) instead of sheet name — confirmed the sheet name changed between 2025 XLSX ("postinumero-kunta-avain 2025") and 2026 XLSX ("taul1")
- Used same year for both XLSX and Classification API — prevents municipality code mismatches if a municipal merger changes the count
- Committed `public/data/postal-codes.json` to repo — Vercel/CI builds do not need to re-download XLSX on every deploy; the file is ~500KB and acceptable in the repo
- Municipality code padding with `padStart(3, '0')` — ExcelJS returns cell value as number 91 rather than string "091" for some cells; padding both sides prevents silent join mismatches

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx create-next-app` refused the non-empty directory (`.planning/`, `.claude/`, `content.json` present). Created minimal Next.js project files manually as specified in the plan's fallback instructions. No functional impact.

## User Setup Required

None - no external service configuration required. Statistics Finland data sources are public and unauthenticated.

## Next Phase Readiness

- `public/data/postal-codes.json` is committed and ready for Phase 4 autocomplete
- Next.js project scaffold ready for Phase 2 (Posti API integration) and Phase 3 (UI foundation)
- The `prebuild` npm script ensures JSON is regenerated before any `next build` call

## Self-Check: PASSED

All created files verified:
- FOUND: scripts/generate-postal-codes.ts
- FOUND: scripts/generate-postal-codes.test.ts
- FOUND: public/data/postal-codes.json
- FOUND: package.json
- FOUND: 01-01-SUMMARY.md

All commits verified:
- a6247b3: chore(01-01): initialize Next.js project with TypeScript and Tailwind CSS
- efdf2cc: test(01-01): add unit tests for postal code parsing logic
- e28381a: feat(01-01): create postal code generation script
- b8cf999: feat(01-01): add generated postal codes dataset

---
*Phase: 01-data-pipeline*
*Completed: 2026-03-03*
