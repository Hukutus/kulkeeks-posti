# Project Research Summary

**Project:** posti-days
**Domain:** Finnish postal delivery status utility web app (Next.js + i18n + geolocation + XLSX data pipeline)
**Researched:** 2026-03-03
**Confidence:** HIGH

## Executive Summary

Posti-days is a single-purpose utility web app that answers one question: "Does mail get delivered to my postal code today?" The product's value proposition rests on three pillars — speed of answer, personality (Finnish dialect humor), and Finnish-market specificity (multilingual, geolocation, full postal code coverage). Research confirms this is a well-understood problem domain with established Next.js patterns covering every component: App Router server-side API fetching, next-intl for i18n routing, a build-time XLSX pipeline for postal codes, and client-side geolocation with autocomplete fallback. No exotic technology decisions are required; the complexity is in the integration details and edge cases, not in inventing new patterns.

The recommended approach is to build in a strictly ordered sequence driven by build-time dependencies: data pipeline first (generates the postal code JSON everything else depends on), then API layer, then i18n scaffold, then core UI, then postal code UX, and finally polish. This order allows every phase to be independently testable and ensures no blocking rework. The stack is lean and modern — Next.js 16.1.6 with App Router, Tailwind CSS v4, next-intl 4.8.3, fuse.js for fuzzy search, and exceljs for the build-time XLSX parse. Vercel is the zero-configuration deploy target.

The key risks are concentrated in two areas: (1) the data pipeline has year-rollover fragility and a known gap in Swedish municipality names that must be addressed in phase one, and (2) browser API boundaries (localStorage, geolocation) require strict discipline about Server/Client Component boundaries to avoid hydration mismatches and CORS failures. Both risk areas are well-understood, have clear prevention strategies documented in PITFALLS.md, and are recoverable if they slip through — but they are easier to do right from the start than to retrofit.

## Key Findings

### Recommended Stack

The stack is lean and fully verified against current npm registry versions. Next.js 16.1.6 with App Router is the correct framework choice — it handles routing, server-side API fetching (eliminating CORS issues with the Posti API), and Vercel deployment without configuration. React 19.2.4 and TypeScript 5.9.3 are peer requirements. Tailwind CSS v4 (4.2.1) is now stable and the right choice for rapid prototyping of the playful visual style.

For i18n, next-intl 4.8.3 is the clear winner — it is the only library with proper Next.js 16 App Router support (next-i18next is Pages Router only). For postal code autocomplete over 3,000 entries with multi-field fuzzy search, fuse.js is the right choice over native `<datalist>` or react-select. The XLSX pipeline uses exceljs (actively maintained) rather than SheetJS/xlsx (stuck at 0.18.5 since 2022). All versions are current stable releases.

**Core technologies:**
- Next.js 16.1.6: React framework, routing, API proxy — App Router is the stable standard; Vercel is the natural deploy target
- TypeScript 5.9.3: Type safety — catches postal-code/locale type errors at compile time
- Tailwind CSS 4.2.1: Utility-first styling — v4 stable; pairs perfectly with Next.js 16
- next-intl 4.8.3: i18n routing and translations — only library with full App Router support
- fuse.js 7.1.0: Fuzzy search for autocomplete — multi-field search over 3,000 entries without WASM overhead
- exceljs 4.4.0: Build-time XLSX parsing — actively maintained, unlike SheetJS
- zod 4.3.6: Posti API response validation — TypeScript ecosystem standard
- @fontsource/caveat 5.2.8: Handwritten font — self-hosted, supports Finnish characters (ä/ö/å)

### Expected Features

The feature set is clearly defined by PROJECT.md as the primary authoritative source. The core product is a focused, single-question utility — any expansion toward multiple postal codes, notifications, or parcel tracking dilutes the identity and is explicitly out of scope.

**Must have (table stakes):**
- Delivery YES/NO answer with green/red color coding — the dominant visual element; reason the app exists
- Postal code input via autocomplete (code, area name, municipality name) — required for any meaningful answer
- Week view of delivery days — nearly free from the API response shape; answers the natural follow-up question
- Remember postal code in localStorage — repeat users (the target audience) require this
- Finnish dialect humor display (random per page load) — the app's identity and differentiator; not optional
- Geolocation on first visit — primary UX path; eliminates the main friction point
- Graceful error state for API failure — Posti API has no SLA; silent failures are not acceptable
- Finnish + English UI languages — primary market plus expats
- XLSX to JSON data pipeline — build-time dependency for autocomplete

**Should have (competitive):**
- Swedish UI language — constitutionally significant in Finland; i18n infrastructure will already exist
- Re-check / change postal code flow — polish for returning users
- System dark mode via CSS `prefers-color-scheme` — low effort, respects user preference

**Defer (v2+):**
- Dialect content expansion — add only if users request specific regions
- URL parameter for pre-filled postal code — low demand to validate first
- Push notifications, multiple address tracking, parcel tracking — explicitly anti-features; increase complexity with no return

### Architecture Approach

The architecture is a conventional Next.js 16 App Router application with a clear Server/Client Component boundary. Server Components handle the Posti API fetch (no CORS issues, no client bundle cost), i18n string loading, and dialect display. Client Components are limited to the postal code selector (needs `window`, `navigator.geolocation`, `localStorage`, and event handlers) and the language switcher. The build-time postal code data pipeline is a standalone Node.js script run as a `prebuild` npm hook, completely separate from the Next.js app. The only external runtime dependency is the Posti API — everything else is static or client-generated.

**Major components:**
1. `scripts/generate-postal-codes.ts` — build-time XLSX download, parse, and JSON emit; runs before `next build`
2. `proxy.ts` (formerly middleware.ts) — locale detection from Accept-Language header, redirects `/` to `/{locale}`
3. `app/[locale]/page.tsx` — async Server Component; fetches Posti API server-side, composes all sections
4. `PostalCodeSelector` (Client Component) — geolocation, fuse.js autocomplete, localStorage persistence; writes postal code to URL search params to trigger server re-render
5. `app/api/delivery/route.ts` — Route Handler proxying the Posti API server-to-server
6. `DeliveryStatus`, `WeekView`, `DialectDisplay` — pure Server Components receiving data as props

State management is URL-first: postal code in `?postalCode=XXXXX` search params (drives server re-render), locale in URL path prefix (`/fi`, `/en`, `/sv`). localStorage and cookies are secondary persistence layers for cross-session continuity.

### Critical Pitfalls

1. **localStorage accessed during SSR** — causes hydration mismatches in production (works in dev, breaks after `next build`). Prevention: all localStorage access must be inside `useEffect(() => {}, [])` only; never in render body or useState initializer.
2. **Posti API called directly from browser** — blocked by CORS. Prevention: always proxy through `app/api/delivery/route.ts` from day one; never write the Posti URL into a client component.
3. **Route Handler caching Posti response indefinitely** — delivery dates change daily; stale cache shows yesterday's answer. Prevention: set `cache: 'no-store'` and `export const dynamic = 'force-dynamic'` in the Route Handler at creation time.
4. **XLSX URL fails at year rollover** — Statistics Finland publishes the new year's file sometime in January, not January 1st. Prevention: script must try current year, fall back to `currentYear - 1` on 404, and log which year was used.
5. **Swedish municipality names missing from XLSX** — the Statistics Finland XLSX does not contain Swedish municipality names; blank group headers break Swedish-language autocomplete. Prevention: source Swedish municipality names from a separate registry (DVV or Statistics Finland kuntarekisteri) and merge in the pipeline script; treat empty `municipality_name_sv` as a build failure.
6. **Geolocation blocked by Permissions-Policy header** — copy-paste security configs often include `geolocation=()` as a "secure default." Prevention: explicitly set `Permissions-Policy: geolocation=(self)` and test on a Vercel preview deployment.

## Implications for Roadmap

Based on the research, the build order is dictated by hard dependencies. The data pipeline is the foundational dependency for autocomplete. The API proxy layer is the foundational dependency for delivery status. i18n scaffolding must exist before any translated UI string is rendered. Core UI assembles all prior pieces. Postal code UX adds the interactive layer. Polish is last.

### Phase 1: Data Pipeline
**Rationale:** The postal code dataset is a build-time hard dependency for autocomplete. Nothing else in the app is blocked on the API or UI layer — but autocomplete cannot work without this JSON. Swedish municipality names must be sourced here, not retrofitted. This phase has no Next.js dependency (pure Node.js) and is independently testable.
**Delivers:** `scripts/generate-postal-codes.ts` + `public/data/postal-codes.json` with Finnish and Swedish municipality names
**Addresses:** Postal code autocomplete (table stakes), Swedish UI language (competitive)
**Avoids:** XLSX year rollover failure, Swedish municipality name gap — both must be solved here

### Phase 2: API Layer
**Rationale:** The delivery status answer is the core product. The Route Handler proxy must be established before any UI depends on it, and caching policy must be set at creation to prevent stale data bugs.
**Delivers:** `app/api/delivery/route.ts` + `lib/get-delivery-dates.ts` with Zod validation, proper `no-store` cache settings, and error handling
**Addresses:** Delivery YES/NO answer, graceful API error state (both table stakes)
**Avoids:** CORS failure from direct browser call, indefinite response caching

### Phase 3: i18n Scaffold
**Rationale:** Locale routing via `proxy.ts` and `app/[locale]/layout.tsx` must exist before any page or component renders translated strings. Installing next-intl early prevents retrofitting locale context into components built without it.
**Delivers:** `proxy.ts`, `messages/fi.json`, `messages/en.json`, `messages/sv.json`, `app/[locale]/layout.tsx`, locale-aware routing
**Addresses:** Finnish + English UI (table stakes), Swedish UI (competitive), locale detection
**Avoids:** localStorage-only locale storage (causes hydration flicker); cookie-based locale preference set up correctly from the start

### Phase 4: Core UI
**Rationale:** With data, API, and i18n in place, the main page can be assembled. Server Components render with real data from phases 1-3. This phase produces the testable, deployable MVP answer.
**Delivers:** `app/[locale]/page.tsx`, `DeliveryStatus`, `WeekView`, `DialectDisplay`, `content.json` dialect data, `loading.tsx` skeleton
**Addresses:** YES/NO answer with color, week view, dialect display, fast load time (all table stakes)
**Avoids:** Dialect re-randomizing on re-render (fix with stable useState/useRef from the start)

### Phase 5: Postal Code UX
**Rationale:** The interactive layer — geolocation, autocomplete, and localStorage persistence — depends on the postal code JSON (phase 1), locale routing (phase 3), and the Server Component page (phase 4) that re-renders when the postal code URL param changes.
**Delivers:** `PostalCodeSelector` client component with geolocation, fuse.js autocomplete, localStorage persistence, and all error states
**Addresses:** Postal code input, remember postal code, geolocation first visit, graceful geolocation denial (all table stakes)
**Avoids:** localStorage SSR hydration mismatch, Permissions-Policy blocking geolocation, missing loading state during geolocation

### Phase 6: Polish and Deployment
**Rationale:** Language switcher, styling refinement, error state polish, dark mode, and production deployment validation. This phase completes the competitive differentiators that require the full app to exist first.
**Delivers:** `LanguageSwitcher`, system dark mode via CSS media query, re-check postal code flow, autocomplete keyboard navigation, Vercel production deployment
**Addresses:** Re-check / change code flow, dark mode (competitive); mobile UX validation
**Avoids:** Autocomplete missing keyboard navigation, "no delivery today" looking like an error, language switcher accidentally changing dialect content

### Phase Ordering Rationale

- Phases 1 and 2 are parallelizable in theory but phase 1 is faster, so sequential is simpler
- Phase 3 must come before phase 4 because every page component must be locale-aware
- Phase 5 requires phases 1 (postal code JSON), 3 (locale routing), and 4 (Server Component that consumes URL params) to all be complete
- Phase 6 is pure polish with no blocking dependencies on future phases
- This ordering maps directly to the build order implications documented in ARCHITECTURE.md

### Research Flags

Phases with standard patterns (research not needed):
- **Phase 1:** XLSX parsing with exceljs and prebuild script patterns are well-documented
- **Phase 2:** Next.js Route Handler proxy pattern is well-documented in official docs
- **Phase 3:** next-intl 4.8.3 with App Router is the official recommended approach; documentation is thorough
- **Phase 4:** Server Component composition is standard Next.js App Router
- **Phase 6:** Language switcher and Vercel deployment are standard patterns

Phases likely needing deeper research during planning:
- **Phase 1:** Swedish municipality name data source needs verification — DVV or Statistics Finland kuntarekisteri; exact file format and field mapping are not confirmed in current research
- **Phase 5:** Reverse geocoding from lat/lon to Finnish postal code — the specific service or API to use for this step was not researched. This is a non-trivial integration point (cannot use browser Geolocation API alone; requires a geocoding service)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified live against npm registry; peerDependencies checked; Next.js 16 official docs consulted |
| Features | MEDIUM | PROJECT.md is authoritative for this app's scope (HIGH confidence for in-scope decisions); competitor analysis based on domain knowledge, not live research |
| Architecture | HIGH | Based on Next.js 16.1.6 official docs (fetched 2026-02-27) and Vercel docs; patterns are canonical, not community folklore |
| Pitfalls | HIGH | Sourced from Next.js official docs, MDN, and live API verification; Next.js 16 caching behavior verified in docs |

**Overall confidence:** HIGH

### Gaps to Address

- **Reverse geocoding service for geolocation:** The research confirms geolocation is needed but does not specify which service to use for lat/lon → Finnish postal code lookup. Options include Digitransit API (Finnish public transit, has geocoding), OpenStreetMap Nominatim, or a similar free geocoding service. This must be decided and researched before Phase 5.
- **Swedish municipality name data source:** Research confirms the Statistics Finland XLSX lacks Swedish municipality names and names DVV and the Statistics Finland municipality registry as candidate sources — but the exact file format, URL, and field mapping have not been verified. Resolve before Phase 1 implementation.
- **Posti API availability guarantee:** The API is undocumented with no SLA. Current research confirms it returns `[{postalCode, deliveryDates: [...]}]` but the failure modes are only partially documented. A brief live exploration of API behavior (empty postal code, unknown postal code, weekend queries) should happen at the start of Phase 2.
- **Week boundary logic (Monday vs Sunday):** Finnish weeks start on Monday. The week view must use `fi-FI` locale week conventions. This is flagged in PITFALLS.md as a "looks done but isn't" item; confirm the implementation handles Sunday-night edge cases during Phase 4 testing.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs — i18n routing, App Router patterns, proxy.ts, Route Handlers, data fetching, project structure (fetched 2026-02-27 to 2026-03-03)
- npm registry live queries — all package versions verified via `npm view [package] dist-tags` (2026-03-03)
- Vercel official docs — build configuration, deployment model
- MDN — Geolocation API, Secure Contexts (authoritative, verified 2026-03-03)
- Posti delivery API live test — `https://www.posti.fi/maildelivery-api-proxy/?q=00100` response shape confirmed
- PROJECT.md — primary source for feature scope and out-of-scope decisions

### Secondary (MEDIUM confidence)
- Domain knowledge: Finnish postal service delivery scheduling, utility web app UX patterns, "Is it X today?" single-purpose app conventions — training data up to August 2025, not independently verified in this session
- Competitor analysis: posti.fi, IsItChristmas.com — based on domain knowledge, no live research

### Tertiary (LOW confidence)
- Swedish municipality name sources (DVV, Statistics Finland kuntarekisteri) — named but format/URL not verified; requires validation during Phase 1
- Reverse geocoding options for Finnish postal codes — not researched; requires a dedicated spike before Phase 5

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
