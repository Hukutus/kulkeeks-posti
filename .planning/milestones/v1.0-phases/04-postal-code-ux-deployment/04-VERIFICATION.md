---
phase: 04-postal-code-ux-deployment
verified: 2026-03-03T17:45:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "First visit geolocation prompt — open incognito, visit /en, confirm browser prompts for location permission"
    expected: "Browser permission dialog appears immediately; granting it shows delivery answer without extra user action"
    why_human: "navigator.geolocation is a browser API not testable via static code analysis"
  - test: "Denied geolocation -> autocomplete -> delivery"
    expected: "Combobox appears, typing 2+ characters shows grouped results, selecting one shows delivery answer"
    why_human: "Live UI interaction with autocomplete dropdown, keyboard nav, and real-time search required"
  - test: "localStorage persistence across refreshes"
    expected: "Reload page after selecting postal code — delivery answer appears immediately without geolocation prompt"
    why_human: "Requires actual browser session and localStorage read on mount"
  - test: "Change postal code flow"
    expected: "Button below week view is always visible. Clicking it clears postal code and shows selector again."
    why_human: "State transition and UI visibility requires browser interaction"
  - test: "Production URL https://posti-days.vercel.app is live and functional"
    expected: "HTTP 200, full postal code UX works with real Digitransit API key in production"
    why_human: "Cannot verify external URL or production env var configuration programmatically from local codebase"
  - test: "Mobile viewport — autocomplete dropdown doesn't overflow on 375px"
    expected: "Dropdown is scrollable, fits within viewport, no horizontal overflow"
    why_human: "Requires browser DevTools or real device"
  - test: "Dark mode — all components respect prefers-color-scheme"
    expected: "Stone-950 backgrounds, correct text contrast in dark mode"
    why_human: "CSS media query behavior requires browser rendering"
---

# Phase 4: Postal Code UX + Deployment Verification Report

**Phase Goal:** Replace hardcoded postal code with geolocation + manual selection UX and deploy to Vercel
**Verified:** 2026-03-03T17:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths from both plans (04-01 and 04-02) verified against the actual codebase.

#### Plan 04-01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | On first visit (no localStorage), browser prompts for geolocation permission | ? NEEDS HUMAN | `useEffect` in PostalCodeSelector calls `navigator.geolocation.getCurrentPosition` on mount when `skipGeolocation=false`. Code path is wired; browser behavior requires live test. |
| 2 | If geolocation succeeds, postal code is resolved and delivery answer shown without extra user action | VERIFIED | PostalCodeSelector success callback: `fetch(/api/geocode)` -> `onCodeSelected(data.postalCode)` -> PostalCodeGate sets status='resolved' -> DeliveryDisplay renders. Full chain wired. |
| 3 | If geolocation fails or is denied, PostalCodeSelector UI is shown | VERIFIED | Error callback sets `geoState='denied'`, `'error'` renders Combobox. API fetch failure also sets `geoState='error'`. Both paths render the autocomplete UI. |
| 4 | On return visits, saved postal code is loaded from localStorage immediately | VERIFIED | `PostalCodeGate` useEffect reads `localStorage.getItem('posti-days:postalCode')` on mount. If found, sets `status='resolved'` and renders DeliveryDisplay directly. No geolocation triggered. |
| 5 | A 'change postal code' control is always visible when postal code is resolved, clicking it clears code and shows selector | VERIFIED | `DeliveryDisplay` renders `onChangeCode` button in BOTH the success state (line 176) and error state (line 91). `handleChangeCode` in PostalCodeGate calls `localStorage.removeItem`, sets `isChanging=true`, `status='selecting'`. |

#### Plan 04-02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | When geolocation is denied, autocomplete dropdown appears for searching postal codes | VERIFIED | `geoState === 'denied'` or `'error'` renders the full Combobox block (PostalCodeSelector lines 146-207). |
| 7 | Autocomplete results are grouped by municipality with postal areas nested underneath | VERIFIED | `groupByMunicipality()` function exists (lines 50-58), result is iterated as `[...grouped.entries()]` rendering municipality heading `<div>` + nested `<ComboboxOption>` for each entry. |
| 8 | Typing at least 2 characters shows matching results with fuzzy tolerance | VERIFIED | `handleQueryChange`: `if (value.length >= 2 && fuseInstance) { const found = fuseInstance.search(value).slice(0, 50)...}` (line 110-111). Fuse threshold=0.3, minMatchCharLength=2. |
| 9 | Selecting an autocomplete result sets the postal code and shows delivery answer | VERIFIED | `handleSelect(entry)` calls `onCodeSelected(entry.postal_code)` (line 120) -> PostalCodeGate `handleCodeSelected` writes localStorage, sets status='resolved'. |

**Score:** 9/9 truths have verified code paths (7 confirmed programmatically, 2 require human for browser API behavior)

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `src/components/PostalCodeGate.tsx` | 40 | 60 | VERIFIED | Client orchestrator: localStorage read/write/remove, status state machine, renders PostalCodeSelector and DeliveryDisplay. |
| `src/components/DeliveryDisplay.tsx` | 60 | 184 | VERIFIED | Fetches /api/delivery, renders dialect question, yes/no answer, week view, change-code button. Full implementation. |
| `src/components/PostalCodeSelector.tsx` | 80 | 208 | VERIFIED | Headless UI Combobox with Fuse.js, municipality grouping, geolocation flow, lazy postal code loading. |
| `src/app/api/geocode/route.ts` | — | 51 | VERIFIED | Exports `GET`, reads lat/lon params, proxies Digitransit, returns `{ postalCode }`, server-only API key. |
| `src/app/[locale]/page.tsx` | 10 | 17 | VERIFIED | Thin shell: imports PostalCodeGate, calls setRequestLocale, returns `<main>` with `<PostalCodeGate />`. Zero hardcoded data. |
| `package.json` | — | — | VERIFIED | `@headlessui/react: ^2.2.9` and `fuse.js: ^7.1.0` present in dependencies. |
| `messages/en.json` | — | — | VERIFIED | `PostalCode` namespace present with all required keys: allowLocation, locationDenied, locationError, tryAgain, enterPostalCode, searchPlaceholder, changeCode, submit, plus extras (searchManually, useLocation). |
| `messages/fi.json` | — | — | VERIFIED | `PostalCode` namespace with proper Finnish diacritics (ä, ö, å). |
| `messages/sv.json` | — | — | VERIFIED | `PostalCode` namespace with proper Swedish diacritics (å, ä, ö). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PostalCodeGate.tsx` | `localStorage` | `useEffect read/write` | WIRED | Lines 17, 27, 33: `getItem`, `setItem`, `removeItem` for key `posti-days:postalCode` in useEffect and handlers. |
| `PostalCodeSelector.tsx` | `/api/geocode` | `fetch after navigator.geolocation.getCurrentPosition` | WIRED | Line 73: `fetch(/api/geocode?lat=${latitude}&lon=${longitude})` inside geolocation success callback. Response is parsed and postalCode used. |
| `src/app/api/geocode/route.ts` | Digitransit API | `server-side fetch with subscription key` | WIRED | Line 19: `https://api.digitransit.fi/geocoding/v1/reverse?...`. API key read from `process.env.DIGITRANSIT_API_KEY` (server-only, no NEXT_PUBLIC_ prefix), added to headers conditionally. |
| `DeliveryDisplay.tsx` | `/api/delivery` | `client-side fetch` | WIRED | Line 43: `fetch(/api/delivery?postalCode=${postalCode})` in useEffect on `[postalCode]`. Response parsed, `data[0]` taken, state set. |
| `PostalCodeSelector.tsx` | `/data/postal-codes.json` | `fetch on first autocomplete open, module-level cache` | WIRED | Line 31: `fetch('/data/postal-codes.json')`. Module-level `cachedData` and `fuseInstance` variables (lines 25-26). `loadPostalCodes()` called on ComboboxInput focus. |
| `PostalCodeSelector.tsx` | `Fuse instance` | `fuse.search on query change` | WIRED | Line 111: `fuseInstance.search(value).slice(0, 50).map((r) => r.item)`. Search keyed on postal_code (w:2), area names (w:1 each), municipality names (w:1/0.5). |
| `ComboboxOption` | `PostalCodeGate.handleCodeSelected` | `Combobox onChange -> onCodeSelected prop` | WIRED | `handleSelect` (line 118) calls `onCodeSelected(entry.postal_code)`. `Combobox onChange={handleSelect}`. PostalCodeGate passes `handleCodeSelected` as `onCodeSelected` prop. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| POST-01 | 04-01 | App requests browser geolocation on first visit to determine postal code | ? NEEDS HUMAN | Code path wired: PostalCodeSelector calls `navigator.geolocation.getCurrentPosition` on mount when `skipGeolocation=false`. Browser prompt behavior requires live test. |
| POST-02 | 04-02 | If geolocation is denied, user sees autocomplete dropdown | VERIFIED | `geoState='denied'` renders full Combobox block. |
| POST-03 | 04-02 | Autocomplete searches across postal code, area name (fi/sv), municipality name | VERIFIED | Fuse.js configured with keys: postal_code, postal_area_name, postal_area_name_sv, municipality_name, municipality_name_sv. |
| POST-04 | 04-02 | Autocomplete groups results by municipality, then by postal area | VERIFIED | `groupByMunicipality()` groups entries by `municipality_name`, rendered as municipality header + nested ComboboxOptions. |
| POST-05 | 04-01 | App remembers selected postal code in localStorage for return visits | VERIFIED | PostalCodeGate reads from localStorage on mount; writes on code selection; DeliveryDisplay renders immediately for return visits. |
| POST-06 | 04-01 | User can re-check geolocation or select a different postal code at any time | VERIFIED | DeliveryDisplay has `changeCode` button in both success and error states (lines 91, 176). PostalCodeSelector has "Use current location" / "Try again" button that re-triggers `requestGeolocation()`. `skipGeolocation=true` passed when `isChanging=true`, preventing auto-geolocation on explicit code change, showing manual selector directly. |

**Orphaned requirements (phase 4 mapped in REQUIREMENTS.md but unclaimed by plans):** None.

**Note on REQUIREMENTS.md status field:** At time of verification, REQUIREMENTS.md still shows POST-01, POST-05, POST-06 as `[ ]` (Pending). The implementations are present and verified. The checkboxes in REQUIREMENTS.md were not updated after plan completion — this is a documentation sync issue only, not an implementation gap.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PostalCodeSelector.tsx` | 157, 162 | `placeholder` CSS class and attribute | ℹ️ Info | These are legitimate: one is the HTML input placeholder attribute (t('searchPlaceholder')), one is the `placeholder-stone-400` Tailwind utility. Not a code stub. |

No blockers or warnings found. No TODO/FIXME/HACK comments, no empty return stubs, no `return null` implementations, no console.log-only handlers.

### Additional Verification Findings

**Hardcoded postal code removed:** `grep` found `00100` only in `src/lib/get-delivery-dates.test.ts` (a test file), not in `page.tsx` or any component. The hardcoded postal code is fully removed from production code.

**API key security:** `DIGITRANSIT_API_KEY` has no `NEXT_PUBLIC_` prefix anywhere in the codebase. The key is read only server-side in the geocode Route Handler.

**Finnish timezone fix:** `delivery-utils.ts` uses `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Helsinki' })` for both `getTodayISO()` and `getCurrentWeekISO()`. This correctly handles the Vercel UTC server environment.

**Next.js version:** `package.json` shows `next: "^15.3.1"` which resolves the CVE-2025-66478 security block that was preventing Vercel deployment.

**Commits verified:** All commits documented in SUMMARY files are present in git log: c80257a, 69cd69f (04-01), f2df8f4, bd4d8c1, 1cf100a, 764d7b6 (04-02).

**`skipGeolocation` prop:** When user clicks "Change postal code", `isChanging=true` causes `skipGeolocation=true` to be passed to PostalCodeSelector. This means the selector opens directly in `geoState='manual'` (not 'requesting'), skipping the geolocation prompt — correct UX for an intentional code change.

### Human Verification Required

All automated checks passed. The following items require live browser testing:

#### 1. Geolocation Permission Prompt

**Test:** Open incognito window, visit /en (or /fi). Do not interact until prompted.
**Expected:** Browser permission dialog appears automatically. Granting permission resolves postal code and shows delivery answer. Denying permission shows the autocomplete Combobox.
**Why human:** `navigator.geolocation` is a browser API; geolocation timing and browser UI cannot be verified in static analysis.

#### 2. Autocomplete Search and Selection

**Test:** Deny geolocation (or click "Or search manually"). Type "Espoo" into the Combobox. Then type "00100".
**Expected:** Results appear after 2+ characters, grouped by municipality. Arrow keys navigate results, Enter selects. Selected code triggers delivery answer.
**Why human:** Headless UI keyboard nav, real-time DOM updates, and Fuse.js search results require browser rendering.

#### 3. localStorage Persistence

**Test:** Select a postal code. Close and reopen the browser tab (non-incognito). Observe initial render.
**Expected:** Delivery answer shown immediately without geolocation prompt. "Change postal code" button visible.
**Why human:** Requires actual browser session with localStorage.

#### 4. Change Postal Code Flow

**Test:** With a postal code resolved, click "Change postal code".
**Expected:** Selector UI appears in manual mode (no geolocation prompt, since it's an intentional change). After selecting a new code, delivery answer updates.
**Why human:** State transitions and isChanging flag behavior require browser interaction.

#### 5. Production Deployment

**Test:** Visit https://posti-days.vercel.app/en in a browser.
**Expected:** App loads, full postal code UX works, geolocation resolves Finnish postal codes via real Digitransit API.
**Why human:** Cannot verify external URL, production env vars, or live API response from local codebase.

#### 6. Mobile Viewport

**Test:** Chrome DevTools, 375px width. Trigger autocomplete, type a query.
**Expected:** Dropdown appears below input, is scrollable, fits within viewport without horizontal overflow.
**Why human:** CSS layout rendering requires browser.

#### 7. Dark Mode

**Test:** Toggle system dark mode preference. View all states (loading, selecting, resolved).
**Expected:** All components use stone-950 backgrounds, appropriate text contrast in dark.
**Why human:** `prefers-color-scheme` media query requires browser.

### Gaps Summary

No code gaps. All artifacts exist, are substantive, and are fully wired. The phase goal is structurally achieved.

The only open items are human-verification tests for browser-API-dependent behavior (geolocation permission flow, autocomplete interaction, localStorage persistence, production URL) — these cannot be confirmed by static code analysis but all supporting code is correctly implemented.

**REQUIREMENTS.md sync note:** POST-01, POST-05, and POST-06 still show `[ ]` (Pending) in REQUIREMENTS.md despite the implementation being complete. This is a documentation artifact — the checkboxes should be updated to `[x]` to reflect completion.

---

_Verified: 2026-03-03T17:45:00Z_
_Verifier: Claude (gsd-verifier)_
