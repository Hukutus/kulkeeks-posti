---
phase: 04-postal-code-ux-deployment
plan: 02
subsystem: ui
tags: [headlessui, fusejs, autocomplete, combobox, vercel, deployment, nextjs]

# Dependency graph
requires:
  - phase: 04-postal-code-ux-deployment/04-01
    provides: PostalCodeGate, PostalCodeSelector stub, geocode proxy, DeliveryDisplay

provides:
  - Headless UI Combobox autocomplete in PostalCodeSelector with Fuse.js fuzzy search
  - Postal code results grouped by municipality with nested postal areas
  - App deployed to production at https://posti-days.vercel.app
  - DIGITRANSIT_API_KEY set in Vercel production environment
  - Finnish timezone date handling via Intl.DateTimeFormat (replaces TZ env var)

affects: []

# Tech tracking
tech-stack:
  added:
    - "@headlessui/react ^2.2.9 — accessible Combobox UI"
    - "fuse.js ^7.1.0 — fuzzy search over postal code data"
    - "Next.js 15.5.12 — upgraded from 15.2.2 (security patch)"
    - "Vercel — production hosting with DIGITRANSIT_API_KEY env var"
  patterns:
    - "Module-level cache for lazy-loaded postal code data + Fuse instance"
    - "Intl.DateTimeFormat with Europe/Helsinki for server-side date arithmetic"
    - "Headless UI Combobox with render-prop focus highlighting"

key-files:
  created: []
  modified:
    - src/components/PostalCodeSelector.tsx
    - src/lib/delivery-utils.ts
    - package.json
    - package-lock.json
    - tsconfig.json

key-decisions:
  - "TZ env var is reserved on Vercel — replaced with Intl.DateTimeFormat(Europe/Helsinki) in delivery-utils.ts"
  - "Upgraded Next.js 15.2.2 to 15.5.12 — Vercel blocks deployments of vulnerable Next.js versions (CVE-2025-66478)"
  - "Module-level cachedData/fuseInstance variables for postal code data — lazy load on first autocomplete open avoids 250KB bundle impact"
  - "anchor='bottom' on ComboboxOptions + max-h-64 overflow-auto — prevents dropdown clipping on mobile viewports"

patterns-established:
  - "Vercel env add for production only — preview/dev can be added separately via --value flag"

requirements-completed: [POST-02, POST-03, POST-04]

# Metrics
duration: 62min
completed: 2026-03-03
---

# Phase 4 Plan 02: Headless UI Combobox autocomplete with Fuse.js + Vercel production deployment Summary

**Headless UI Combobox with Fuse.js fuzzy search across 3,018 Finnish postal codes grouped by municipality, deployed to production at posti-days.vercel.app**

## Performance

- **Duration:** 62 min
- **Started:** 2026-03-03T16:27:29Z
- **Completed:** 2026-03-03T17:29:31Z
- **Tasks:** 2 (task 1 from prior agent, task 2 in this session)
- **Files modified:** 5

## Accomplishments

- Replaced stub manual input with Headless UI Combobox autocomplete powered by Fuse.js
- Search works across postal_code, area names (Finnish/Swedish), and municipality names with fuzzy tolerance
- Results grouped by municipality with nested postal area/code display
- App deployed to production (https://posti-days.vercel.app) with Vercel env var set
- Fixed timezone correctness: server now computes Finnish dates via Intl.DateTimeFormat instead of depending on server TZ
- Upgraded Next.js from vulnerable 15.2.2 to patched 15.5.12

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and build autocomplete into PostalCodeSelector** - `f2df8f4` (feat)
2. **Task 1 fix: skip geolocation on postal code change, add manual mode** - `bd4d8c1` (fix)
3. **Task 2 fix: upgrade Next.js to 15.5.12** - `1cf100a` (fix)
4. **Task 2 fix: Finnish timezone via Intl.DateTimeFormat** - `764d7b6` (fix)

## Files Created/Modified

- `src/components/PostalCodeSelector.tsx` - Headless UI Combobox with Fuse.js, lazy postal code loading, municipality grouping
- `src/lib/delivery-utils.ts` - getTodayISO and getCurrentWeekISO rewritten with Intl.DateTimeFormat(Europe/Helsinki)
- `package.json` - Added @headlessui/react, fuse.js; upgraded next to 15.5.12
- `package-lock.json` - Updated lockfile
- `tsconfig.json` - Updated by Next.js 15.5.12 (jsx preserve confirmed)

## Decisions Made

- **TZ env var reserved on Vercel:** Cannot set `TZ=Europe/Helsinki` — Vercel reserves it. Fixed by using `Intl.DateTimeFormat` with `timeZone: 'Europe/Helsinki'` in delivery-utils.ts. This ensures correct Finnish dates on UTC Vercel servers.
- **Next.js security upgrade required:** Vercel blocks deployments of Next.js versions with known CVEs (CVE-2025-66478). Upgraded from 15.2.2 to 15.5.12 (latest stable 15.x without breaking changes).
- **Module-level Fuse cache:** `cachedData` and `fuseInstance` are module-level nullables, loaded on first autocomplete focus. This avoids ~250KB JSON bundle impact while keeping subsequent searches fast.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded Next.js to fix Vercel deployment block**
- **Found during:** Task 2 (Vercel deployment)
- **Issue:** Vercel refuses to deploy Next.js 15.2.2 due to CVE-2025-66478 security vulnerability
- **Fix:** Ran `npm install next@15.3.1 eslint-config-next@15.3.1` then `npm audit fix` which resolved to 15.5.12 (latest patched 15.x)
- **Files modified:** package.json, package-lock.json, tsconfig.json
- **Verification:** `npx next build` passes, Vercel build completes successfully
- **Committed in:** 1cf100a

**2. [Rule 1 - Bug] Fixed server timezone for Finnish date computation**
- **Found during:** Task 2 (setting TZ env var on Vercel)
- **Issue:** `TZ=Europe/Helsinki` is a reserved Vercel env var and cannot be set. Vercel functions run in UTC, so `getTodayISO()` using `getDate()`/`getMonth()` would return UTC date — wrong for Finnish users between midnight and 2-3am
- **Fix:** Rewrote `getTodayISO()` and `getCurrentWeekISO()` in delivery-utils.ts to use `Intl.DateTimeFormat` with `timeZone: 'Europe/Helsinki'` for all date computations
- **Files modified:** src/lib/delivery-utils.ts
- **Verification:** Build passes; date format verified correct for both UTC+2 and UTC+3 DST periods
- **Committed in:** 764d7b6

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes essential — deployment was blocked and timezone was functionally incorrect. No scope creep.

## Issues Encountered

- Vercel CLI `env add` for preview environments requires explicit `--value` flag and branch specification — only production env var was added via stdin redirect. Production (the only environment that matters for launch) is correctly configured.

## Next Phase Readiness

- App is live at https://posti-days.vercel.app with full postal code UX
- Plan 04-03 (if any) can proceed — all POST-02 through POST-04 requirements satisfied
- Geolocation, autocomplete, persistence, and delivery answer all working end-to-end

---
*Phase: 04-postal-code-ux-deployment*
*Completed: 2026-03-03*

## Self-Check: PASSED

- FOUND: .planning/phases/04-postal-code-ux-deployment/04-02-SUMMARY.md
- FOUND: src/components/PostalCodeSelector.tsx
- FOUND: src/lib/delivery-utils.ts
- FOUND: commit 1cf100a (Next.js upgrade)
- FOUND: commit 764d7b6 (timezone fix)
- FOUND: Production URL https://posti-days.vercel.app/en returns HTTP 200
