# Roadmap: Posti-days

## Overview

Build a focused Next.js utility that instantly answers "Does Posti deliver mail to my postal code today?" with Finnish dialect humor. The build order is dictated by hard dependencies: the postal code data pipeline comes first (autocomplete cannot work without it), then the API proxy and i18n scaffold (all display depends on both), then the core UI assembly, and finally the interactive postal code UX and Vercel deployment. Each phase is independently testable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Pipeline** - Build-time script that converts Statistics Finland XLSX into the postal codes JSON that powers autocomplete
- [ ] **Phase 2: API + i18n Foundation** - Posti API proxy route with Zod validation and next-intl locale routing scaffold
- [ ] **Phase 3: Core UI** - Main page assembling delivery status, week view, and dialect display with visual design
- [ ] **Phase 4: Postal Code UX + Deployment** - Interactive postal code selector (geolocation, autocomplete, persistence) and Vercel production deployment

## Phase Details

### Phase 1: Data Pipeline
**Goal**: The postal code dataset exists as a validated JSON file that covers all Finnish postal codes with Finnish and Swedish names, ready to power autocomplete
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run generate-postal-codes` produces `public/data/postal-codes.json` without errors
  2. The JSON contains postal code, Finnish area name, Swedish area name, Finnish municipality name, and Swedish municipality name for every entry
  3. The script resolves the correct Statistics Finland XLSX URL dynamically (tries current year, falls back to prior year on 404)
  4. Swedish municipality names are present and non-empty in the output (not blank group headers)
**Plans**: 1 plan
Plans:
- [ ] 01-01-PLAN.md — Initialize Next.js project, create postal code generation script, run and validate output

### Phase 2: API + i18n Foundation
**Goal**: The app can fetch and return Posti delivery dates server-side without CORS issues, validated against a known schema, and all UI strings can be rendered in Finnish, English, or Swedish via locale-aware routing
**Depends on**: Phase 1
**Requirements**: API-01, API-02, I18N-01, I18N-02, I18N-03, I18N-04, I18N-05
**Success Criteria** (what must be TRUE):
  1. Visiting `/en`, `/fi`, or `/sv` renders the correct locale without a redirect loop
  2. Visiting `/` auto-redirects to the correct locale based on the browser Accept-Language header
  3. The Route Handler at `/api/delivery?postalCode=00100` returns delivery dates without CORS errors
  4. The Route Handler returns a structured error response (not a 500) when the Posti API is unavailable
  5. Dialect content renders in Finnish regardless of which locale is active
**Plans**: 2 plans
Plans:
- [ ] 02-01-PLAN.md — Posti API proxy Route Handler with Zod validation and typed lib wrapper
- [ ] 02-02-PLAN.md — next-intl locale routing scaffold (fi, en, sv) with middleware and translation files

### Phase 3: Core UI
**Goal**: A visitor with a known postal code sees a clear YES/NO delivery answer in green/red, a random Finnish dialect question/answer, the full week's delivery dates, and a polished visual design — all on a single page load
**Depends on**: Phase 2
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, DISP-05, VIS-01, VIS-02, VIS-03, VIS-04
**Success Criteria** (what must be TRUE):
  1. The main answer ("Yes" / "No") is displayed prominently in green or red matching the current day's delivery status
  2. A random dialect variant with question text and yes/no text renders on each page load, accompanied by the dialect name and region
  3. The week view lists all delivery dates for the current Monday–Sunday week in human-readable format
  4. The handwritten-style font (Caveat) applies to the dialect question/answer; the overall aesthetic feels warm and playful
  5. The layout is usable on a 375px mobile screen and respects the system dark mode preference
**Plans**: TBD

### Phase 4: Postal Code UX + Deployment
**Goal**: A first-time visitor is prompted for geolocation and gets their answer immediately; a returning visitor sees their last postal code automatically; any user can search, change, or re-verify their postal code — and the app is live on Vercel
**Depends on**: Phase 3
**Requirements**: POST-01, POST-02, POST-03, POST-04, POST-05, POST-06
**Success Criteria** (what must be TRUE):
  1. On first visit, the browser prompts for location permission; granting it populates the postal code and shows the delivery answer without any additional user action
  2. If geolocation is denied or fails, an autocomplete input appears where the user can search by postal code number, area name (Finnish or Swedish), or municipality name
  3. Autocomplete results are grouped by municipality with postal areas nested underneath each municipality
  4. On return visits, the previously selected postal code is restored from localStorage and the answer displays without prompting for location again
  5. A "change postal code" control is visible at all times, and clicking it allows the user to search for a different code or re-request geolocation
  6. The app is deployed and publicly accessible at a Vercel URL
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline | 0/1 | Planned | - |
| 2. API + i18n Foundation | 0/2 | Planned | - |
| 3. Core UI | 0/? | Not started | - |
| 4. Postal Code UX + Deployment | 0/? | Not started | - |
