# Phase 2: API + i18n Foundation - Research

**Researched:** 2026-03-03
**Domain:** Next.js 15 Route Handler API proxy + next-intl 4.x locale routing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | App queries Posti mail delivery API server-side (proxied via Route Handler to avoid CORS) | Route Handler proxy pattern documented; Posti API URL confirmed in project research (`https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}`); `cache: 'no-store'` + `dynamic = 'force-dynamic'` prevents stale responses |
| API-02 | App displays a clear error message when Posti API is unavailable or returns an error | Zod `safeParse` returns discriminated union; Route Handler returns structured `{ error: string }` with appropriate HTTP status instead of letting Next.js throw a 500 |
| I18N-01 | UI chrome supports Finnish, English, and Swedish | next-intl `defineRouting` accepts `locales: ['fi', 'en', 'sv']`; translation files `messages/fi.json`, `messages/en.json`, `messages/sv.json` |
| I18N-02 | App auto-detects language from browser/device settings, falls back to English if no match | next-intl middleware uses `@formatjs/intl-localematcher` "best fit" algorithm against `Accept-Language` header; `defaultLocale: 'en'` is the fallback |
| I18N-03 | User can manually switch language via a language selector | Navigating to `/fi`, `/en`, or `/sv` path prefix switches locale; middleware writes a cookie to remember the selection |
| I18N-04 | App remembers manual language selection for return visits | next-intl cookie with `maxAge` persists past session; configured via `localeCookie: { maxAge: 60 * 60 * 24 * 365 }` in `defineRouting` |
| I18N-05 | Dialect content (question/answer) always displays in Finnish regardless of selected language | Dialect text rendered from `content.json` directly — never passed through `useTranslations`; locale has no path to alter dialect display |
</phase_requirements>

---

## Summary

This phase establishes two independent infrastructure pillars: a server-side API proxy for the Posti delivery dates API, and locale-aware URL routing with next-intl. Both are well-understood Next.js patterns with official documentation and verified library versions.

The Posti delivery API (`https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}`) is an undocumented but confirmed-working endpoint that returns `[{postalCode, deliveryDates: ["YYYY-MM-DD", ...]}]`. The Route Handler at `app/api/delivery/route.ts` proxies this server-to-server to avoid CORS, validates the shape with Zod, and returns a structured error on failure. Two critical settings must be applied at creation: `cache: 'no-store'` on the upstream `fetch()` and `export const dynamic = 'force-dynamic'` on the handler — delivery dates change daily and any caching is a bug.

The i18n setup uses next-intl 4.8.3 (latest stable as of 2026-03-03) with the App Router `[locale]` segment pattern. Locale detection is handled by `middleware.ts` (note: `proxy.ts` is the Next.js 16 name — this project is on 15.2.2, so the file is `middleware.ts`). The middleware reads `Accept-Language`, redirects `/` to the best-match locale path, and writes a persistent cookie when the user navigates to a different locale. The key constraint for I18N-05: dialect content must never be routed through next-intl's translation system — it reads directly from `content.json` so it always renders in Finnish.

**Primary recommendation:** Implement the Route Handler and i18n scaffold as two separate, independently testable tasks. The Route Handler has no dependency on i18n infrastructure; locale routing has no dependency on the Posti API. Build both, then verify the four success criteria manually.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next (already installed) | 15.2.2 | App Router, Route Handlers, middleware | Already in project; no upgrade needed for this phase |
| next-intl | 4.8.3 | Locale routing, `Accept-Language` detection, translation hooks | Only App Router-native i18n library; official Next.js docs recommend it; handles middleware, server components, and client components uniformly |
| zod | 4.3.6 | Validate Posti API response shape at runtime | TypeScript ecosystem standard; Zod 4 stable; `safeParse` returns discriminated union, no try/catch needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @formatjs/intl-localematcher | 0.8.1 | Accept-Language header → best-fit locale matching | Peer dependency of next-intl middleware; install alongside next-intl |
| negotiator | 1.0.0 | HTTP header parsing | Used with `@formatjs/intl-localematcher` in locale detection; install alongside next-intl |
| @types/negotiator | latest | TypeScript types for negotiator | negotiator ships without type stubs; required for TS build |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-intl | next-i18next | next-i18next is Pages Router only; does not work with App Router |
| next-intl | built-in Next.js i18n | Next.js built-in i18n only handles routing; no translation hooks, no server component support |
| zod | yup, valibot | Zod 4 has better TypeScript inference; `safeParse` discriminated union is cleaner than try/catch |

**Installation:**
```bash
npm install next-intl @formatjs/intl-localematcher negotiator zod
npm install -D @types/negotiator
```

---

## Architecture Patterns

### Recommended Project Structure (additions for this phase)

```
posti-days/
├── messages/               # NEW: translation dictionaries
│   ├── fi.json
│   ├── en.json
│   └── sv.json
├── src/
│   ├── i18n/               # NEW: next-intl configuration
│   │   ├── routing.ts      # defineRouting() — locales, defaultLocale, cookie
│   │   ├── request.ts      # getRequestConfig() — per-request locale resolution
│   │   └── navigation.ts   # createNavigation() — locale-aware Link, redirect, etc.
│   ├── app/
│   │   ├── [locale]/       # NEW: replace app/ root with [locale] segment
│   │   │   ├── layout.tsx  # Root layout (replaces current src/app/layout.tsx)
│   │   │   └── page.tsx    # Main page (replaces current src/app/page.tsx)
│   │   └── api/
│   │       └── delivery/
│   │           └── route.ts # NEW: Posti API proxy Route Handler
│   └── lib/
│       └── get-delivery-dates.ts  # NEW: typed wrapper for Posti API fetch + Zod validation
├── middleware.ts            # NEW: locale detection + redirect (project root)
└── next.config.ts          # MODIFY: wrap with createNextIntlPlugin()
```

**Important:** The existing `src/app/layout.tsx` and `src/app/page.tsx` must be relocated into `src/app/[locale]/`. The `[locale]` directory is the entire application — all routes nest under it.

### Pattern 1: Route Handler as API Proxy

**What:** `app/api/delivery/route.ts` accepts `GET /api/delivery?postalCode=XXXXX`, calls the Posti API server-to-server, validates the response with Zod, and returns either validated data or a structured error response.

**When to use:** Any external API call that would cause CORS errors from the browser.

**Critical settings:** Both `cache: 'no-store'` on the fetch AND `export const dynamic = 'force-dynamic'` on the handler. Delivery dates change daily — both guards are needed.

```typescript
// Source: https://nextjs.org/docs/app/getting-started/route-handlers (v16.1.6, 2026-02-27)
// src/app/api/delivery/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PostiResponseSchema = z.array(
  z.object({
    postalCode: z.string(),
    deliveryDates: z.array(z.string()),
  })
)

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')

  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    return NextResponse.json(
      { error: 'Invalid postal code. Must be a 5-digit number.' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://www.posti.fi/maildelivery-api-proxy/?q=${postalCode}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Posti API returned status ${res.status}` },
        { status: 502 }
      )
    }

    const raw = await res.json()
    const parsed = PostiResponseSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Unexpected response shape from Posti API' },
        { status: 502 }
      )
    }

    return NextResponse.json(parsed.data)
  } catch {
    return NextResponse.json(
      { error: 'Posti API is unavailable' },
      { status: 502 }
    )
  }
}
```

### Pattern 2: next-intl Routing Configuration

**What:** `src/i18n/routing.ts` declares the three locales, default locale, and cookie persistence. This object is imported by both middleware and the app layout.

```typescript
// Source: https://next-intl.dev/docs/routing/setup (fetched 2026-03-03)
// src/i18n/routing.ts

import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fi', 'en', 'sv'],
  defaultLocale: 'en',
  // Persist language preference for one year (I18N-04)
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
})
```

### Pattern 3: Middleware (Next.js 15 — file is `middleware.ts`, not `proxy.ts`)

**What:** `middleware.ts` at the project root intercepts all non-asset requests, reads `Accept-Language`, and redirects `/` to the best-match locale path. When the user navigates to `/fi`, `/en`, or `/sv`, the middleware writes a cookie.

**CRITICAL:** This project uses Next.js 15.2.2. The `proxy.ts` convention belongs to Next.js 16. Use `middleware.ts` with `export default` for this project.

```typescript
// Source: https://next-intl.dev/docs/routing/middleware (fetched 2026-03-03)
// middleware.ts (project root, NOT inside src/)

import createMiddleware from 'next-intl/middleware'
import { routing } from './src/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // Match all pathnames except Next.js internals and static files
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
```

**Note on middleware.ts location:** Next.js expects `middleware.ts` at the project root (same level as `package.json`), not inside `src/`. The `routing` import must use a relative path from the root.

### Pattern 4: Locale Layout and Request Config

**What:** The root layout at `src/app/[locale]/layout.tsx` awaits `params.locale` (a Promise in Next.js 15), validates it against the routing config, and provides `NextIntlClientProvider`.

```typescript
// Source: https://next-intl.dev/docs/routing/setup (fetched 2026-03-03)
// src/app/[locale]/layout.tsx

import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params  // params is a Promise in Next.js 15

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

```typescript
// Source: https://next-intl.dev/docs/routing/setup (fetched 2026-03-03)
// src/i18n/request.ts

import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
```

### Pattern 5: next.config.ts Plugin

```typescript
// Source: https://next-intl.dev/docs/getting-started/app-router (fetched 2026-03-03)
// next.config.ts

import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  /* config options here */
}

export default withNextIntl(nextConfig)
```

### Pattern 6: Translation Files (minimal for this phase)

```json
// messages/fi.json — scaffold only; full content added in Phase 3
{
  "Common": {
    "loading": "Ladataan...",
    "error": "Virhe"
  }
}
```

```json
// messages/en.json
{
  "Common": {
    "loading": "Loading...",
    "error": "Error"
  }
}
```

```json
// messages/sv.json
{
  "Common": {
    "loading": "Laddar...",
    "error": "Fel"
  }
}
```

### Pattern 7: Posti API Typed Lib Wrapper

```typescript
// src/lib/get-delivery-dates.ts
// Called from Server Components directly — no CORS issue, no Route Handler needed for server-side use
// The Route Handler is for client-side refetch only (Phase 3+)

import { z } from 'zod'

export const DeliverySchema = z.array(
  z.object({
    postalCode: z.string(),
    deliveryDates: z.array(z.string()),
  })
)

export type DeliveryData = z.infer<typeof DeliverySchema>[number]

export async function getDeliveryDates(postalCode: string): Promise<
  | { success: true; data: DeliveryData }
  | { success: false; error: string }
> {
  try {
    const res = await fetch(
      `https://www.posti.fi/maildelivery-api-proxy/?q=${postalCode}`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      return { success: false, error: `Posti API error: ${res.status}` }
    }
    const raw = await res.json()
    const parsed = DeliverySchema.safeParse(raw)
    if (!parsed.success || parsed.data.length === 0) {
      return { success: false, error: 'Unexpected Posti API response' }
    }
    return { success: true, data: parsed.data[0] }
  } catch {
    return { success: false, error: 'Posti API unavailable' }
  }
}
```

### Anti-Patterns to Avoid

- **Using `proxy.ts` on Next.js 15:** `proxy.ts` is the Next.js 16 convention. On 15.2.2, use `middleware.ts` with `export default`. Using `proxy.ts` on v15 means the middleware simply does not run.
- **Placing `middleware.ts` inside `src/`:** Next.js requires middleware at the project root (beside `package.json`). Inside `src/` it is not picked up.
- **Importing `routing.ts` from the wrong path in middleware:** `middleware.ts` is at the root; `routing.ts` is at `src/i18n/routing.ts`. The import must be `'./src/i18n/routing'`.
- **Not awaiting `params` in Next.js 15 layouts/pages:** `params` is a Promise. `const { locale } = params` (without `await`) gives a Promise object, not the locale string. Always `const { locale } = await params`.
- **Caching the Posti API response:** Delivery dates change daily. Omitting `cache: 'no-store'` means Next.js Data Cache may serve yesterday's answer. Set both `cache: 'no-store'` on `fetch()` AND `export const dynamic = 'force-dynamic'` on the Route Handler.
- **Passing dialect text through useTranslations:** Dialect content must always render in Finnish (I18N-05). If it goes through next-intl's translation system, a Swedish locale would try to load a Swedish translation. Import `content.json` directly in the component, bypassing i18n entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accept-Language header → locale | Custom header parser + negotiation logic | next-intl middleware (createMiddleware) | Handles weighted quality values, case normalization, regional variants (e.g., `fi-FI` → `fi`), cookie preference precedence, and redirect logic in ~5 lines of config |
| Locale cookie management | Custom cookie read/write in middleware | next-intl `localeCookie` config | next-intl handles cookie creation on locale switch, expiry, and GDPR-compliant session-only default (4.0+) |
| Runtime API response shape checking | Custom type guards / manual field checks | Zod `safeParse` | Zod generates TypeScript types from the same schema; `safeParse` returns a discriminated union; single source of truth for shape and types |
| Locale-prefixed URL routing | Custom dynamic segment handling | next-intl `defineRouting` + `generateStaticParams` | Handles `localePrefix: 'always'` (default), static pre-rendering of all locale variants, and `notFound()` for invalid locale segments |

**Key insight:** The next-intl middleware is doing ~200 lines of spec-compliant locale negotiation. Rolling it by hand produces bugs with edge-case Accept-Language headers (multiple languages, quality factors, language tags with region subtags).

---

## Common Pitfalls

### Pitfall 1: `proxy.ts` vs `middleware.ts` Version Confusion

**What goes wrong:** Developer reads next-intl docs showing `proxy.ts` and creates that file — but the project is on Next.js 15.2.2. The file is silently ignored; no locale detection runs; visiting `/` returns a 404 or shows an unlocalized page.

**Why it happens:** next-intl documentation now shows Next.js 16 patterns where `proxy.ts` is the convention. The `middleware.ts` → `proxy.ts` rename happened in Next.js 16.

**How to avoid:** Use `middleware.ts` on Next.js 15. Check `package.json` for the Next.js version before deciding the filename. When upgrading to Next.js 16 later, run the official codemod: `npx @next/codemod@canary middleware-to-proxy .`

**Warning signs:** Visiting `/` returns 404 or doesn't redirect to `/en`; locale segment is missing from all URLs.

### Pitfall 2: `middleware.ts` Placed Inside `src/`

**What goes wrong:** `src/middleware.ts` is created instead of `middleware.ts` at the project root. Next.js does not pick it up. No locale detection runs.

**Why it happens:** The project uses `src/` directory layout. Developers assume all app files go inside `src/`. But Next.js only looks for `middleware.ts` at the root.

**How to avoid:** Place `middleware.ts` at the same level as `package.json`, not inside `src/`.

**Warning signs:** Same symptoms as Pitfall 1 — no locale redirect, no cookie set.

### Pitfall 3: Route Handler Caches Posti API Response

**What goes wrong:** After midnight, users see the previous day's delivery answer. The Route Handler runs once, the response is cached, and subsequent requests get the cached version.

**Why it happens:** Next.js extends `fetch()` with a Data Cache. Without explicit opt-out, a `GET` Route Handler may cache the upstream response.

**How to avoid:** Both guards at Route Handler creation time: `export const dynamic = 'force-dynamic'` in the module scope AND `{ cache: 'no-store' }` in the `fetch()` call.

**Warning signs:** Delivery status is the same all day even when the date changes; the Route Handler `console.log` shows it only fires once.

### Pitfall 4: Posti API Returns Empty Array for Some Postal Codes

**What goes wrong:** Posti API returns `[]` (empty array) for postal codes that have no upcoming delivery dates (e.g., P.O. Box areas, industrial zones). Zod validates the array structure as valid, but `parsed.data[0]` is `undefined`, causing a runtime crash.

**Why it happens:** The schema validates `z.array(...)` but doesn't require at least one element. Empty array passes validation.

**How to avoid:** After `safeParse`, check `parsed.data.length > 0` before accessing `parsed.data[0]`. Return a structured "no delivery dates found" response rather than crashing.

**Warning signs:** TypeScript shows `data[0]` could be `undefined`; runtime error accessing `.deliveryDates` on undefined.

### Pitfall 5: Dialect Content Accidentally Localized

**What goes wrong:** A developer threads the dialect question/answer text through `useTranslations('Dialect')` for "consistency." When the locale is `sv`, next-intl looks for `messages/sv.json` Dialect keys, finds none, and throws or falls back to the key name.

**Why it happens:** Using `useTranslations` for all text is the standard pattern — it feels inconsistent to have one area that doesn't use it.

**How to avoid:** Import `content.json` directly in `DialectDisplay`. Never register dialect text in any `messages/*.json` file. Add a comment explaining the intentional separation (I18N-05 requirement).

**Warning signs:** Dialect text shows key names in non-Finnish locales; missing translation warnings in console.

### Pitfall 6: `params` Not Awaited (Next.js 15 Breaking Change)

**What goes wrong:** `const { locale } = params` (without `await`) gives a Promise object; `locale` is `[object Promise]`; `hasLocale` returns false; `notFound()` is called for every request.

**Why it happens:** Next.js 15 changed `params` in layouts and pages from a sync object to a `Promise`. This is a Next.js 15 breaking change that catches developers coming from Next.js 14 docs.

**How to avoid:** Always `const { locale } = await params`. The TypeScript type `Props` should type `params` as `Promise<{ locale: string }>`.

**Warning signs:** All locale routes return 404; TypeScript shows `params` is `Promise<...>` but code uses it directly.

---

## Code Examples

Verified patterns from official sources:

### Reading Search Params in a Route Handler (Next.js 15)

```typescript
// Source: https://nextjs.org/docs/app/getting-started/route-handlers (2026-02-27)
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const postalCode = searchParams.get('postalCode')
  // postalCode is "00100" for /api/delivery?postalCode=00100
  return NextResponse.json({ postalCode })
}
```

### Zod `safeParse` with Discriminated Union

```typescript
// Source: https://zod.dev/ (2026-03-03)
import { z } from 'zod'

const schema = z.array(z.object({
  postalCode: z.string(),
  deliveryDates: z.array(z.string()),
}))

const result = schema.safeParse(unknownData)
if (result.success) {
  // result.data is typed as { postalCode: string; deliveryDates: string[] }[]
  console.log(result.data[0].deliveryDates)
} else {
  // result.error is a ZodError with detailed path information
  console.error(result.error.issues)
}
```

### Using Translations in a Server Component

```typescript
// Source: https://next-intl.dev/docs/getting-started/app-router (2026-03-03)
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('Common')
  return <p>{t('loading')}</p>  // renders "Loading..." in English, "Ladataan..." in Finnish
}
```

### Using Translations in a Client Component

```typescript
// Source: https://next-intl.dev/docs/getting-started/app-router (2026-03-03)
'use client'
import { useTranslations } from 'next-intl'

export function LoadingSpinner() {
  const t = useTranslations('Common')
  return <span>{t('loading')}</span>
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` (Next.js 15) | `proxy.ts` (Next.js 16) | Next.js 16 (Oct 2025) | This project is on 15.2.2 — use `middleware.ts`; `proxy.ts` is silently ignored on v15 |
| `params` as sync object | `params` as `Promise<{...}>` | Next.js 15 | All layout/page `params` access must be `await params` |
| `getServerSideProps` / API routes | Route Handlers + Server Components | Next.js 13+ App Router | Route Handler is the correct pattern; `pages/api/` routes should not be used alongside App Router |
| next-intl 3.x `useMessages` / `NextIntlClientProvider` with explicit messages | next-intl 4.x auto-provides messages via `NextIntlClientProvider` with no explicit messages prop | next-intl 4.0 (Mar 2025) | `NextIntlClientProvider` no longer requires `messages` prop in layouts |
| `zod` imported as `import { z } from 'zod'` (v3) | Same import works for v4; `import * as z from 'zod/v4'` for subpath | Zod 4 (2025) | `import { z } from 'zod'` still works; Zod 4 is published at the package root |

**Deprecated/outdated:**
- `next-i18next`: Pages Router only; incompatible with App Router. Use next-intl.
- `middleware.ts` `export const config` with `matcher` using deprecated patterns: use the regex negation pattern `/((?!api|_next|...).*)/` as shown in Pattern 3.
- `getServerSideProps`: Not available in App Router. Fetch data directly in async Server Components.

---

## Open Questions

1. **Posti API edge case behavior (STATE.md flagged)**
   - What we know: The API URL is `https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}` and returns `[{postalCode, deliveryDates: [...]}]` for postal code `00100`
   - What's unclear: Behavior for unknown postal codes, P.O. Box codes, weekends, and when the Posti API is down for maintenance
   - Recommendation: Do a live API spot-check at the start of Phase 2 implementation (as flagged in STATE.md). Test: valid residential code, P.O. Box code (ends in 1, e.g. 00011), nonexistent code (e.g. 99999), and a weekend date if possible. This takes 5 minutes and prevents Zod schema surprises.

2. **`messages/` directory location**
   - What we know: next-intl docs show `messages/` at the project root; some projects put it inside `src/`
   - What's unclear: Whether the `import()` in `request.ts` uses a path relative to the file or the project root
   - Recommendation: Use project root for `messages/`. The dynamic import `import(\`../../messages/${locale}.json\`)` from `src/i18n/request.ts` points two levels up to the project root. Alternatively, configure `createNextIntlPlugin('./src/i18n/request.ts')` with an absolute import path. Verify with `next build` output.

3. **`localePrefix: 'always'` vs `'as-needed'`**
   - What we know: `'always'` (the default) means every URL has a locale prefix (`/fi`, `/en`, `/sv`); `'as-needed'` omits the prefix for the default locale
   - What's unclear: The roadmap success criteria says "visiting `/en`, `/fi`, or `/sv` renders the correct locale" — this implies `'always'` is the expected behavior
   - Recommendation: Use `localePrefix: 'always'` (the default). This matches the success criteria and avoids ambiguity about which locale is active when no prefix is present.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs, Route Handlers — https://nextjs.org/docs/app/getting-started/route-handlers — version 16.1.6, last updated 2026-02-27. Used for Route Handler patterns, caching behavior, `dynamic = 'force-dynamic'`.
- next-intl official docs, App Router setup — https://next-intl.dev/docs/routing/setup — fetched 2026-03-03. Used for `defineRouting`, layout code, `generateStaticParams`, `params` as Promise.
- next-intl official docs, Middleware — https://next-intl.dev/docs/routing/middleware — fetched 2026-03-03. Used for middleware file pattern, cookie behavior, Accept-Language detection order.
- next-intl official docs, Routing configuration — https://next-intl.dev/docs/routing/configuration — fetched 2026-03-03. Used for `localePrefix`, `localeCookie` with `maxAge`.
- zod official docs — https://zod.dev/ — fetched 2026-03-03. Confirmed Zod 4 is stable at 4.3.6; `safeParse` pattern.
- npm registry live — `npm show next-intl version` → 4.8.3; `npm show zod version` → 4.3.6 (verified 2026-03-03).
- next-intl 4.0 blog post — https://next-intl.dev/blog/next-intl-4-0 — breaking changes, ESM-only, `NextIntlClientProvider` changes, cookie GDPR behavior.
- Project research files — `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`, `.planning/research/STACK.md`, `.planning/research/SUMMARY.md` — confirmed Posti API URL and response shape; `proxy.ts` vs `middleware.ts` context; phase sequencing rationale.
- Next.js 16 upgrade docs — https://nextjs.org/docs/app/guides/upgrading/version-16 — confirmed `proxy.ts` is a Next.js 16 convention; current project is on 15.2.2.

### Secondary (MEDIUM confidence)
- next-intl docs via WebFetch (2026-03-03) — verified code examples for layout, request config, and middleware setup. Cross-referenced with npm version to confirm 4.8.3 is current.
- Next.js docs via WebFetch (2026-03-03) — Route Handler with `NextRequest.nextUrl.searchParams` for query param access.

### Tertiary (LOW confidence)
- Posti API edge case behavior (unknown codes, weekends, P.O. Box codes) — not independently verified; STATE.md flags this for spot-checking at start of Phase 2.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified live via npm registry on 2026-03-03
- Architecture: HIGH — patterns sourced from next-intl and Next.js official docs, cross-referenced with project research files
- Pitfalls: HIGH — sourced from official docs and project research (PITFALLS.md); `proxy.ts` vs `middleware.ts` pitfall verified via Next.js upgrade guide

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (next-intl is active; API patterns stable; re-verify if upgrading to Next.js 16)
