# Architecture Research

**Domain:** Finnish postal delivery status utility web app (Next.js)
**Researched:** 2026-03-03
**Confidence:** HIGH — based on Next.js official docs (v16.1.6, last updated 2026-02-27) and Vercel official docs

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                 │
│  ┌────────────────────┐     ┌──────────────────────────────┐     │
│  │  scripts/          │     │  public/data/                │     │
│  │  generate-postal-  │────>│  postal-codes.json           │     │
│  │  codes.ts          │     │  (baked into static assets)  │     │
│  └────────────────────┘     └──────────────────────────────┘     │
│         |                            |                            │
│         | Downloads XLSX from        | Imported via               │
│         | stat.fi at build time      | next/dynamic or            │
│         └────────────────────────────┘ static import             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     PROXY LAYER (proxy.ts)                        │
│   Locale detection from Accept-Language header                    │
│   Redirects / to /fi, /en, or /sv                                 │
│   Matcher: all paths except _next/static, api, etc.              │
└──────────────────────────────────────────────────────────────────┘
                              |
┌──────────────────────────────────────────────────────────────────┐
│                  NEXT.JS APP ROUTER (app/)                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  app/[locale]/layout.tsx  — root layout, locale context  │    │
│  │  app/[locale]/page.tsx    — main page (Server Component) │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              |                                    │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ DeliveryStatus  │  │ WeekView         │  │ PostalCode     │  │
│  │ (Server Comp.)  │  │ (Server Comp.)   │  │ Selector       │  │
│  │ Fetches Posti   │  │ Renders week of  │  │ (Client Comp.) │  │
│  │ API server-side │  │ delivery dates   │  │ Geolocation +  │  │
│  └─────────────────┘  └──────────────────┘  │ Autocomplete   │  │
│                                              └────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DialectDisplay (Server Comp.)                           │    │
│  │  Random dialect selected at render (server or client)    │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  app/api/delivery/route.ts   — Route Handler             │    │
│  │  Proxies Posti API           (optional, for CORS safety) │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                              |
┌──────────────────────────────────────────────────────────────────┐
│                    BROWSER (localStorage)                         │
│   Selected postal code persisted                                  │
│   Selected language persisted (cookie or localStorage)           │
└──────────────────────────────────────────────────────────────────┘
                              |
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│   Posti API: https://www.posti.fi/maildelivery-api-proxy/?q=...  │
│   Statistics Finland XLSX (build-time only, not runtime)         │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `proxy.ts` | Locale detection, redirect `/` to `/{locale}` | Next.js Proxy (formerly middleware), file at project root |
| `app/[locale]/layout.tsx` | Root layout with lang attribute, i18n context, shared chrome | Server Component, sets `<html lang={locale}>` |
| `app/[locale]/page.tsx` | Main page, fetches delivery data, composes sections | Server Component; async fetch to Posti API |
| `DeliveryStatus` | Show yes/no answer for today with green/red styling | Server Component; receives delivery dates as prop |
| `WeekView` | Show all delivery dates for current week | Server Component; receives delivery dates array as prop |
| `PostalCodeSelector` | Geolocation request, autocomplete dropdown, localStorage | Client Component (`"use client"`); needs browser APIs |
| `DialectDisplay` | Show random Finnish dialect question + answer | Server Component; randomly selects from content.json |
| `LanguageSwitcher` | Manual locale selection UI | Client Component; changes URL prefix `/fi`, `/en`, `/sv` |
| `app/api/delivery/route.ts` | Proxy Posti API call if CORS is a concern | Route Handler (GET); forwards ?q= to Posti, returns JSON |
| `scripts/generate-postal-codes.ts` | Download XLSX, parse, emit JSON to `public/data/` | Node.js script; run as `prebuild` in package.json |

## Recommended Project Structure

```
posti-days/
├── scripts/
│   └── generate-postal-codes.ts    # Build-time XLSX → JSON converter
├── public/
│   └── data/
│       └── postal-codes.json       # Generated at build; served as static asset
├── messages/                       # i18n translation files
│   ├── fi.json
│   ├── en.json
│   └── sv.json
├── content.json                    # Finnish dialect content (11 variations)
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Root layout with locale-aware html lang
│   │   ├── page.tsx                # Main page; fetches Posti API server-side
│   │   ├── loading.tsx             # Loading skeleton while Posti API resolves
│   │   └── _components/           # Route-colocated components (not publicly routable)
│   │       ├── DeliveryStatus.tsx  # Yes/No answer with colour coding
│   │       ├── WeekView.tsx        # Week of delivery dates
│   │       ├── DialectDisplay.tsx  # Random dialect question/answer
│   │       ├── PostalCodeSelector.tsx  # Geolocation + autocomplete (Client)
│   │       └── LanguageSwitcher.tsx    # Locale switcher (Client)
│   ├── api/
│   │   └── delivery/
│   │       └── route.ts            # Optional: proxy Posti API for CORS safety
│   └── globals.css
├── lib/
│   ├── get-delivery-dates.ts       # Typed wrapper around Posti API fetch
│   ├── get-dialect.ts              # Random dialect selection utility
│   └── postal-codes.ts             # Types + helpers for postal code data
├── proxy.ts                        # Locale detection + redirect (was middleware.ts)
├── next.config.ts
├── tsconfig.json
└── package.json
```

### Structure Rationale

- **`scripts/`:** Kept outside `app/` entirely — it's a Node.js build-time utility, not part of the web app. Run via `prebuild` script in `package.json`.
- **`public/data/postal-codes.json`:** Static JSON served directly by CDN. No runtime processing, instant access from client. Generated once per build.
- **`messages/`:** Top-level translation dictionaries following the pattern recommended by Next.js official i18n docs and used by `next-intl`. Loaded server-side only — zero client JS bundle cost.
- **`app/[locale]/`:** All routes nested under locale segment for i18n URL routing (`/fi`, `/en`, `/sv`). Proxy redirects root `/` to detected locale.
- **`app/[locale]/_components/`:** Route-colocated components using private folder convention (`_`). Not routable, grouped with the page they serve.
- **`lib/`:** Pure business logic with no React dependency. Shared across route handlers and server components. Keeps pages thin.
- **`proxy.ts`:** At project root (same level as `app/`). Note: Next.js 16 renamed `middleware.ts` to `proxy.ts` — use `proxy.ts` for new projects.

## Architectural Patterns

### Pattern 1: Server Component for External API Fetch

**What:** Fetch the Posti delivery API directly in a Server Component (async function), not via a client-side useEffect or SWR.
**When to use:** The main page load — user needs delivery status immediately. No interactivity needed on the data itself.
**Trade-offs:** No client-side refetch (acceptable — data changes infrequently within a day). Server sees the response, not the browser (no CORS issue). Rendering blocks on API latency.

**Example:**
```typescript
// app/[locale]/page.tsx
import { getDeliveryDates } from '@/lib/get-delivery-dates'

export default async function Page({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  const postalCode = // read from cookie or searchParams
  const data = await getDeliveryDates(postalCode)

  return (
    <>
      <DeliveryStatus dates={data.deliveryDates} />
      <WeekView dates={data.deliveryDates} />
    </>
  )
}
```

### Pattern 2: Client Component Island for Browser APIs

**What:** Wrap geolocation + localStorage + autocomplete in a `"use client"` component. Pass postal code selection up via URL (search params or navigation) so the Server Component re-renders with the new postal code.
**When to use:** Any feature requiring `window`, `navigator.geolocation`, `localStorage`, or event handlers.
**Trade-offs:** Requires understanding of the Server/Client boundary. Using URL (searchParams) as state keeps the page shareable and avoids prop drilling through client context.

**Example:**
```typescript
// app/[locale]/_components/PostalCodeSelector.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function PostalCodeSelector() {
  const router = useRouter()

  function handleSelect(postalCode: string) {
    localStorage.setItem('postalCode', postalCode)
    router.push(`?postalCode=${postalCode}`)
  }

  // Geolocation on mount, autocomplete against /public/data/postal-codes.json
}
```

### Pattern 3: [locale] Segment for i18n Routing

**What:** All app routes nested under `app/[locale]/`. A `proxy.ts` at the root intercepts requests to `/` and redirects to `/{detected-locale}`. `generateStaticParams` pre-renders all three locale variants.
**When to use:** This project's three-language requirement (fi/en/sv).
**Trade-offs:** Adds one dynamic segment to all URLs. Straightforward compared to alternatives like cookies-only locale or domain-based locale. Official Next.js recommended pattern.

**Example:**
```typescript
// app/[locale]/layout.tsx
export async function generateStaticParams() {
  return [{ locale: 'fi' }, { locale: 'en' }, { locale: 'sv' }]
}
```

### Pattern 4: Build-Time Data Generation with prebuild Script

**What:** A Node.js script downloads and parses the Statistics Finland XLSX, emitting `postal-codes.json` to `public/data/`. The script runs as the `prebuild` npm lifecycle hook before `next build`.
**When to use:** Any static dataset that changes infrequently (yearly for this XLSX) and would be too large to bundle inline.
**Trade-offs:** Must run successfully before build starts. On Vercel, the `prebuild` hook runs automatically. Keep the generated file in `.gitignore` or commit it — both are valid. Committing means CI doesn't need to re-download XLSX each time.

**Example:**
```json
// package.json
{
  "scripts": {
    "prebuild": "tsx scripts/generate-postal-codes.ts",
    "build": "next build"
  }
}
```

## Data Flow

### Request Flow: Page Load (Known Postal Code)

```
Browser requests /fi?postalCode=00100
    |
proxy.ts — locale already present, passes through
    |
app/[locale]/page.tsx (Server Component, async)
    |
    ├── reads postalCode from searchParams
    ├── reads postalCode from cookie (fallback)
    |
    └── getDeliveryDates('00100')
            |
            └── fetch('https://www.posti.fi/maildelivery-api-proxy/?q=00100')
                    |
                    └── returns [{postalCode, deliveryDates: ["YYYY-MM-DD", ...]}]
    |
Renders: DeliveryStatus + WeekView + DialectDisplay
HTML sent to browser
```

### Request Flow: First Visit (No Postal Code)

```
Browser requests /
    |
proxy.ts — no locale detected, reads Accept-Language
    |
Redirects to /fi (or /en, /sv)
    |
app/[locale]/page.tsx — no postalCode in searchParams or cookie
    |
Renders page WITHOUT delivery data
Shows: PostalCodeSelector (Client Component hydrated)
    |
PostalCodeSelector calls navigator.geolocation.getCurrentPosition()
    |
[User grants permission]
    |
Browser resolves lat/lon → reverse geocode → postal code
    (Reverse geocoding is client-side, e.g. via browser APIs or a free geocoding API)
    |
PostalCodeSelector calls router.push('?postalCode=XXXXX')
localStorage.setItem('postalCode', 'XXXXX')
    |
Server Component re-renders with postalCode
```

### Request Flow: Postal Code Autocomplete

```
User types in PostalCodeSelector input
    |
Client Component filters postal-codes.json (loaded once into memory)
    |
Note: postal-codes.json is a public static file
Options:
  (a) Fetch /data/postal-codes.json on mount, keep in component state
  (b) Import as JSON module (webpack bundles it — BAD for large files)

Recommendation: fetch once on mount, store in component state
Groups results by municipality → postal area in UI
```

### State Management

```
Postal code (primary state)
    → URL search param (?postalCode=XXXXX)  — drives server re-render
    → localStorage                          — persists across sessions
    → Cookie (optional)                     — allows server-side read on first load

Language (locale)
    → URL path prefix (/fi, /en, /sv)       — drives i18n, shareable URLs
    → Cookie (optional, set by proxy.ts)    — allows proxy to detect preference on return

Dialect selection
    → Randomised each page render           — no persistence needed
    → On server: Math.random() in Server Component is fine for this use case
```

### Key Data Flows

1. **Postal code → delivery dates:** `PostalCodeSelector` writes to URL → Server Component reads searchParams → fetches Posti API → passes dates to `DeliveryStatus` and `WeekView`
2. **XLSX → postal codes JSON:** Build-time script downloads, parses, writes JSON → committed to `public/data/` or generated fresh each build → served as static CDN asset → fetched once in `PostalCodeSelector` on mount
3. **Locale → UI strings:** proxy.ts detects Accept-Language → redirects to locale-prefixed URL → layout.tsx loads `messages/{locale}.json` server-side → passes dict as props → zero client bundle cost
4. **Dialect → display:** `content.json` imported in `DialectDisplay` Server Component → `Math.random()` selects entry on each render → no persistence, no client JS

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current design is sufficient. Single Vercel deployment, no caching layer needed. Posti API called per request. |
| 1k-100k users | Add Vercel Edge caching on the Route Handler (`cache-control: s-maxage=300`). Posti API responses change at most once per day — cache aggressively. Consider `revalidate = 3600` on the page. |
| 100k+ users | This scale is implausible for this utility. If it happens: static generation with ISR (revalidate hourly), postal-code-keyed cache. |

### Scaling Priorities

1. **First bottleneck:** Posti API latency on every server render. Fix: cache the `fetch()` response in Next.js Data Cache (`cache: 'force-cache'` with `next: { revalidate: 3600 }`). Delivery dates don't change mid-day.
2. **Second bottleneck:** postal-codes.json client download (file could be 1–3 MB). Fix: compress response (Vercel does gzip/br automatically), and consider splitting by first digit if filtering is slow.

## Anti-Patterns

### Anti-Pattern 1: Importing postal-codes.json as a Module

**What people do:** `import postalCodes from '../public/data/postal-codes.json'` inside a client component
**Why it's wrong:** Webpack/Turbopack bundles the JSON into the JS bundle. A 1–3 MB JSON file ships to every browser. First load is slow, especially on mobile.
**Do this instead:** `fetch('/data/postal-codes.json')` on component mount. The file is served as a static CDN asset, cached by the browser after first load, and never bloats the JS bundle.

### Anti-Pattern 2: Fetching Posti API from the Browser

**What people do:** `useSWR('https://www.posti.fi/maildelivery-api-proxy/?q=00100')` in a client component
**Why it's wrong:** Posti's API does not set CORS headers that permit cross-origin browser requests. The request will be blocked by the browser. Additionally, it exposes the API URL in client-visible code.
**Do this instead:** Fetch in a Server Component (no CORS restrictions apply server-to-server). If you need client-side re-fetch, create a Route Handler at `app/api/delivery/route.ts` that proxies the request server-side.

### Anti-Pattern 3: Storing Locale in localStorage Only

**What people do:** Save locale preference in localStorage, read it in a useEffect, apply to the page
**Why it's wrong:** Causes layout shift and flicker (renders in wrong language on first paint, then corrects). Server never knows the locale, so SSR HTML is mismatched. Dialect content renders in the wrong language until hydration.
**Do this instead:** Use URL path prefix (`/fi`, `/en`, `/sv`) as the single source of truth. Store preference in a cookie (readable by proxy.ts) so return visits redirect automatically.

### Anti-Pattern 4: Using middleware.ts Instead of proxy.ts

**What people do:** Create `middleware.ts` with `export function middleware()` as documented in older Next.js guides
**Why it's wrong:** Next.js 16 deprecated `middleware` and renamed the convention to `proxy`. The `middleware.ts` file still works but will show deprecation warnings. The function export name also changed from `middleware` to `proxy`.
**Do this instead:** Use `proxy.ts` at the project root, export `function proxy(request)`. Run the official codemod if migrating: `npx @next/codemod@canary middleware-to-proxy .`

### Anti-Pattern 5: Parsing XLSX at Runtime

**What people do:** Download and parse the Statistics Finland XLSX on each server request (or on app startup)
**Why it's wrong:** The XLSX is ~several MB; parsing adds hundreds of ms to cold start. The data changes once per year. Runtime downloading can fail if stat.fi is unavailable.
**Do this instead:** Parse at build time in a `prebuild` script. Output `postal-codes.json` to `public/data/`. The app never touches the XLSX at runtime.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Posti mail delivery API | Server Component `fetch()` OR Route Handler proxy | No auth required. Fetch server-side to avoid CORS. Response shape: `[{postalCode, deliveryDates: ["YYYY-MM-DD"]}]`. |
| Statistics Finland XLSX | Build-time script download only | URL: `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx`. Script resolves current year dynamically. Swedish municipality names NOT in XLSX — need separate dataset (DVV or Statistics Finland municipality registry). |
| Browser Geolocation API | Client Component only | `navigator.geolocation.getCurrentPosition()`. Must be on HTTPS (Vercel provides this). Handle denial gracefully: fall back to autocomplete. |
| Vercel deployment | Zero-config for Next.js | Build command: `npm run build` (which triggers `prebuild` first). Vercel auto-detects Next.js. No additional config needed. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Component ↔ Client Component | Props (serializable data only) | Pass delivery dates array, dict strings, postal code options as props. Never pass functions or class instances. |
| PostalCodeSelector (Client) → Page (Server) | URL search params via `router.push()` | Triggers full server re-render with new postal code. This is intentional and correct. |
| proxy.ts ↔ app/ routes | HTTP redirect (302) | proxy.ts reads Accept-Language, redirects to locale path. App routes read locale from URL segment. |
| Build script ↔ app/ | File system (public/data/postal-codes.json) | Script writes JSON; app reads it via fetch at runtime. No direct import. |
| content.json ↔ DialectDisplay | Static import in Server Component | JSON is small (~5KB), acceptable to bundle server-side. Never import in Client Component. |

## Build Order Implications

These dependencies determine which phases must come before others:

```
1. scripts/generate-postal-codes.ts  (must succeed before build)
        |
        └── produces: public/data/postal-codes.json
                            |
2. next build                        (consumes postal-codes.json via static serving)
        |
        ├── compiles app/[locale]/page.tsx
        ├── compiles PostalCodeSelector.tsx
        └── generates static routes for /fi, /en, /sv (generateStaticParams)

3. Vercel deploy                     (serves .next/ output + public/)
```

**Recommended build phase sequence for development:**

1. **Phase 1 — Data pipeline:** `scripts/generate-postal-codes.ts` + types for postal code data
2. **Phase 2 — API layer:** `lib/get-delivery-dates.ts` + optional Route Handler proxy
3. **Phase 3 — i18n scaffold:** `proxy.ts`, `messages/` dictionaries, `app/[locale]/layout.tsx`
4. **Phase 4 — Core UI:** `app/[locale]/page.tsx`, `DeliveryStatus`, `WeekView`, `DialectDisplay`
5. **Phase 5 — Postal code UX:** `PostalCodeSelector` with geolocation + autocomplete + localStorage
6. **Phase 6 — Polish:** `LanguageSwitcher`, styling, error handling, loading states

Each phase is independently testable. Phase 1 has no Next.js dependency (pure Node.js). Phase 2 can be tested with a hardcoded postal code before Phase 5 exists.

## Sources

- Next.js official docs: Project Structure — https://nextjs.org/docs/app/getting-started/project-structure (v16.1.6, 2026-02-27)
- Next.js official docs: Internationalization — https://nextjs.org/docs/app/guides/internationalization (v16.1.6, 2026-02-27)
- Next.js official docs: Fetching Data — https://nextjs.org/docs/app/getting-started/fetching-data (v16.1.6, 2026-02-27)
- Next.js official docs: proxy.ts (formerly middleware) — https://nextjs.org/docs/app/api-reference/file-conventions/proxy (v16.1.6, 2026-02-27)
- Next.js official docs: Route Handlers — https://nextjs.org/docs/app/api-reference/file-conventions/route (v16.1.6, 2026-02-27)
- Vercel official docs: Configuring a Build — https://vercel.com/docs/deployments/configure-a-build

---
*Architecture research for: Finnish postal delivery status web app (Next.js + Vercel)*
*Researched: 2026-03-03*
