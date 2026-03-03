# Phase 3: Core UI - Research

**Researched:** 2026-03-03
**Domain:** Next.js 15 Server Components, Tailwind v4, next/font, Caveat Google Font, date logic, dialect randomization
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-01 | User sees a clear YES or NO answer for whether Posti delivers mail today at their postal code | Server Component calls `getDeliveryDates()` (from Phase 2 lib); compare today's ISO date string against `deliveryDates[]`; display localized "Yes"/"No" via `getTranslations` |
| DISP-02 | YES answer displays in green, NO answer displays in red | Tailwind `text-green-600 dark:text-green-400` / `text-red-600 dark:text-red-400` classes toggled based on delivery boolean; no JS needed — conditional class on server-rendered element |
| DISP-03 | User sees a random Finnish dialect version of the question and answer on each page load (from content.json) | `connection()` from `next/server` must precede `Math.random()` in the Server Component to force per-request rendering; import `content.json` directly (never through next-intl) |
| DISP-04 | User sees the dialect name and region displayed alongside the question/answer | `dialect.dialect` and `dialect.region` fields from `content.json` are rendered as secondary text alongside the question/answer block |
| DISP-05 | User sees all delivery dates for the current week in a human-readable list | Compute Monday–Sunday of current week from `new Date()`; filter `deliveryDates[]` to that range; format with `getFormatter()` from `next-intl/server` using `{ weekday: 'long', month: 'long', day: 'numeric' }` options for locale-aware display |
| VIS-01 | App uses a handwritten-style font for the main question/answer display | Load `Caveat` from `next/font/google` with `variable: '--font-caveat'`; register in `@theme inline` as `--font-handwriting: var(--font-caveat)`; apply `font-handwriting` Tailwind class to dialect question/answer elements |
| VIS-02 | App has a playful, warm visual aesthetic matching the dialect humor | Tailwind v4 color palette — warm neutrals (stone/amber) for backgrounds; no sharp geometric angles; generous padding; subtle borders; accomplished entirely with Tailwind utility classes |
| VIS-03 | App is fully responsive and mobile-friendly | Mobile-first Tailwind layout: `max-w-sm mx-auto` container; stack vertically at 375px; `sm:` breakpoint for wider screens if needed; test at 375px viewport |
| VIS-04 | App respects system dark mode preference via CSS prefers-color-scheme | Tailwind v4 default `dark:` variant uses `prefers-color-scheme` automatically — zero configuration required; apply `dark:` variants alongside light variants throughout |
</phase_requirements>

---

## Summary

Phase 3 assembles the core UI on the existing Next.js 15 + Tailwind v4 + next-intl foundation from Phase 2. The main page (`src/app/[locale]/page.tsx`) becomes an async Server Component that calls the existing `getDeliveryDates()` lib, computes today's delivery status, picks a random dialect from `content.json`, computes the week's delivery dates, and renders everything in a single server-side pass.

The two non-trivial technical challenges are: (1) `Math.random()` requires `await connection()` from `next/server` before it can be called in a Server Component without breaking Next.js prerendering — this is a documented Next.js 15 requirement with a clean fix; (2) Integrating two fonts (system sans-serif for body, Caveat for dialect display) requires the next/font CSS variable pattern with Tailwind v4's `@theme inline` directive in `globals.css`. Both patterns are well-documented.

Date logic is handled with vanilla JavaScript `Date` arithmetic — no date library is needed for this phase. The Posti API returns ISO `YYYY-MM-DD` strings; comparing them to today's date and filtering to the current week is straightforward. Locale-aware formatting of those dates uses `getFormatter()` from `next-intl/server`, which is already a project dependency.

**Primary recommendation:** Build in one plan: font setup + globals.css first (unblocks visual work), then the page Server Component with delivery status + dialect + week view, then Tailwind styling passes for visual polish and dark mode. This is a single-plan phase — all UI work is interdependent and fits naturally in one implementation unit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next (already installed) | 15.2.2 | Async Server Components, `connection()`, App Router | Already in project |
| next-intl (already installed) | 4.8.3 | `getTranslations`, `getFormatter` in server components | Already in project; provides locale-aware date formatting |
| tailwindcss (already installed) | ^4 | Utility-first styling, dark mode via `prefers-color-scheme`, responsive layout | Already in project |
| next/font/google (built into next) | — | Self-hosted Caveat font with zero external requests | Built into Next.js; no install needed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| content.json (already in repo) | — | Source of all 11 dialect variants | Import directly in Server Component; never route through next-intl |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla Date arithmetic | date-fns or dayjs | No external dependency needed for this phase's date logic (ISO string comparison + week range); date-fns adds ~13KB for week utilities that aren't needed yet |
| next-intl `getFormatter` | `Intl.DateTimeFormat` directly | `getFormatter` is locale-aware automatically (reads locale from request context); `Intl.DateTimeFormat` requires manually threading the locale value |
| CSS `prefers-color-scheme` default (Tailwind v4) | next-themes + class toggle | next-themes adds JS bundle; not needed when respecting system preference only (VIS-04 requirement is "respects system dark mode", not "user-toggleable dark mode") |

**Installation:** No new packages needed. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure (additions for this phase)

```
posti-days/
├── content.json                          # EXISTING — 11 dialect variants
├── messages/
│   ├── en.json                           # MODIFY — add delivery status keys
│   ├── fi.json                           # MODIFY — add delivery status keys
│   └── sv.json                           # MODIFY — add delivery status keys
└── src/
    ├── app/
    │   └── [locale]/
    │       ├── globals.css               # MODIFY — add Caveat font @theme, color tokens, dark mode base
    │       ├── layout.tsx                # MODIFY — add Caveat font variable to html/body classNames
    │       └── page.tsx                  # REPLACE — full UI: delivery status + dialect + week view
    └── lib/
        ├── get-delivery-dates.ts         # EXISTING — no changes needed
        └── delivery-utils.ts             # NEW — isDeliveryToday(), getWeekDates(), filterWeekDeliveries()
```

### Pattern 1: Font Setup — next/font + Tailwind v4 @theme inline

**What:** Load Caveat from Google Fonts via `next/font/google` with a CSS variable name. Apply that variable to the `<body>` element. Register it as a Tailwind token via `@theme inline` in `globals.css`.

**When to use:** Any time two different font families are needed (body font vs. display/handwriting font).

**Example:**

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts (last updated 2026-02-27)
// src/app/[locale]/layout.tsx

import { Caveat } from 'next/font/google'

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  display: 'swap',
})

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  // ...
  return (
    <html lang={locale} className={caveat.variable}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

```css
/* Source: https://tailwindcss.com/docs/font-family (fetched 2026-03-03) */
/* src/app/[locale]/globals.css */

@import "tailwindcss";

@theme inline {
  /* Maps --font-caveat CSS variable (set by next/font) to a Tailwind utility */
  --font-handwriting: var(--font-caveat);
}
```

Usage in components: `<p className="font-handwriting text-4xl">Kulkeeko Posti?</p>`

**Important:** `@theme inline` (not bare `@theme`) is needed when the value references a CSS variable that is set at runtime by `next/font`. Bare `@theme` resolves values at build time; `@theme inline` preserves the `var()` reference.

### Pattern 2: Per-Request Randomness in Server Components

**What:** `Math.random()` in a Next.js 15 Server Component requires `await connection()` beforehand to signal that the component should be rendered per-request, not prerendered.

**When to use:** Any Server Component that uses `Math.random()`, `new Date()`, or other non-deterministic values that must be fresh per request.

**Example:**

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/connection (last updated 2026-02-27)
// src/app/[locale]/page.tsx

import { connection } from 'next/server'
import content from '../../../content.json'

export default async function Page({ params }: Props) {
  const { locale } = await params

  // Signal per-request rendering — must come before Math.random()
  await connection()

  const dialects = content.dialects
  const randomIndex = Math.floor(Math.random() * dialects.length)
  const dialect = dialects[randomIndex]

  // ... rest of component
}
```

**Critical:** `connection()` must be called BEFORE `Math.random()`. The call opts the entire component (and everything below it in the same component boundary) out of prerendering. Without it, Next.js may throw a build error or silently cache the first random value.

### Pattern 3: Delivery Date Logic (vanilla JS, no library)

**What:** Compute whether today is a delivery day, and compute the full week's delivery dates from the Posti API response.

**When to use:** All date comparison in this phase.

**Example:**

```typescript
// src/lib/delivery-utils.ts

/**
 * Returns the ISO date string for today in local time (YYYY-MM-DD).
 * Note: use local date, not UTC, to match Posti's date format.
 */
export function getTodayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns ISO date strings for Monday through Sunday of the current week.
 */
export function getCurrentWeekISO(): string[] {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const monday = new Date(now)
  // Adjust to Monday (if Sunday, go back 6 days; otherwise go back dayOfWeek - 1)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
}

/**
 * Filters Posti deliveryDates to only those in the current Mon–Sun week.
 */
export function filterWeekDeliveries(
  deliveryDates: string[],
  weekISO: string[]
): string[] {
  const weekSet = new Set(weekISO)
  return deliveryDates.filter((d) => weekSet.has(d))
}

/**
 * Returns true if todayISO is in the deliveryDates array.
 */
export function isDeliveryDay(
  deliveryDates: string[],
  todayISO: string
): boolean {
  return deliveryDates.includes(todayISO)
}
```

### Pattern 4: Locale-Aware Date Formatting with next-intl

**What:** Format ISO date strings into human-readable locale-aware strings using `getFormatter()` from `next-intl/server`.

**When to use:** Any server-side date display that should respect the active locale (Finnish: "maanantai 3. maaliskuuta", English: "Monday, March 3").

**Example:**

```typescript
// Source: https://next-intl.dev/docs/environments/server-client-components (fetched 2026-03-03)
// src/app/[locale]/page.tsx (within the async Server Component)

import { getFormatter } from 'next-intl/server'

// Inside the async component:
const format = await getFormatter()

// Format an ISO date string for display
const dateLabel = format.dateTime(new Date('2026-03-03'), {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
// Finnish: "maanantai 3. maaliskuuta"
// English: "Monday, March 3"
// Swedish: "måndag 3 mars"
```

### Pattern 5: Delivery Status Page Structure

**What:** The full `page.tsx` structure — async Server Component that wires delivery data, dialect, and week view.

**Example:**

```typescript
// src/app/[locale]/page.tsx

import { connection } from 'next/server'
import { getTranslations, getFormatter } from 'next-intl/server'
import { getDeliveryDates } from '@/lib/get-delivery-dates'
import { getTodayISO, getCurrentWeekISO, filterWeekDeliveries, isDeliveryDay } from '@/lib/delivery-utils'
import content from '../../../content.json'

type Props = { params: Promise<{ locale: string }> }

export default async function Page({ params }: Props) {
  const { locale } = await params

  // Must precede Math.random() — opts component into per-request rendering
  await connection()

  // Random dialect — runs fresh every request
  const dialect = content.dialects[Math.floor(Math.random() * content.dialects.length)]

  // Fetch delivery data (server-side, no CORS issue)
  const result = await getDeliveryDates('00100') // placeholder postal code (Phase 4 wires real code)

  const t = await getTranslations('Delivery')
  const format = await getFormatter()

  if (!result.success) {
    return <ErrorView message={result.error} />
  }

  const todayISO = getTodayISO()
  const weekISO = getCurrentWeekISO()
  const deliveryToday = isDeliveryDay(result.data.deliveryDates, todayISO)
  const weekDeliveries = filterWeekDeliveries(result.data.deliveryDates, weekISO)

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center px-4 py-12">
      {/* Delivery answer */}
      <div className={deliveryToday ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
        <p className="font-handwriting text-6xl">{dialect.question}</p>
        <p className="font-handwriting text-8xl font-bold">
          {deliveryToday ? dialect.yes : dialect.no}
        </p>
      </div>

      {/* Dialect metadata */}
      <p className="text-stone-500 dark:text-stone-400 text-sm mt-2">
        {dialect.dialect} — {dialect.region}
      </p>

      {/* Week view */}
      <ul className="mt-8">
        {weekISO.map((iso) => {
          const hasDelivery = weekDeliveries.includes(iso)
          const label = format.dateTime(new Date(iso), { weekday: 'long', month: 'long', day: 'numeric' })
          return (
            <li key={iso} className={hasDelivery ? 'text-green-700 dark:text-green-300' : 'text-stone-400'}>
              {label}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
```

### Pattern 6: Translation Keys for Delivery Status

**What:** Add translation keys for the UI chrome around delivery status (not the dialect text itself — that is always Finnish from `content.json`).

**Example:**

```json
// messages/en.json (additions for Phase 3)
{
  "Common": {
    "loading": "Loading...",
    "error": "Error",
    "title": "Posti Days",
    "description": "Is Posti delivering mail today?"
  },
  "Delivery": {
    "errorTitle": "Could not check delivery",
    "weekTitle": "This week",
    "postalCode": "Postal code"
  }
}
```

### Anti-Patterns to Avoid

- **Calling `Math.random()` without `await connection()` first:** Next.js 15 will throw `Cannot access Math.random() before other uncached data or Request data in a Server Component`. Always call `await connection()` before any `Math.random()` or `new Date()` in a Server Component that isn't already using a dynamic API like `cookies()` or `headers()`.
- **Using UTC for today's date comparison:** `new Date().toISOString().slice(0, 10)` returns the UTC date, which differs from local time near midnight. Use local year/month/day extraction (`getFullYear()`, `getMonth()`, `getDate()`) to match the user's actual day.
- **Routing dialect text through `useTranslations`:** Dialect content is always Finnish (I18N-05). Import `content.json` directly. Never add dialect text to `messages/*.json`.
- **Using bare `@theme` instead of `@theme inline` for next/font variables:** Bare `@theme` resolves at build time; the CSS variable `--font-caveat` is set at runtime by the browser from next/font's injected `<style>`. Use `@theme inline` to preserve the `var()` reference.
- **Not applying the font variable class to `<html>` or `<body>`:** `next/font` injects the CSS variable as a class. If `caveat.variable` is not applied to an ancestor element, `var(--font-caveat)` is undefined and the font falls back silently.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font self-hosting | Download font files manually, serve from /public | `next/font/google` | Handles subset optimization, display swap, layout shift prevention, GDPR-compliant no-Google-request |
| Locale-aware date formatting | Manually map locale codes to `Intl.DateTimeFormat` options | `getFormatter()` from `next-intl/server` | next-intl reads the active locale from request context automatically; no threading needed |
| Dark mode detection | JS `matchMedia` + class toggle | Tailwind v4 default `dark:` variant | `dark:` uses CSS `prefers-color-scheme` natively — zero JS, works with CSS-only rendering, correct even before hydration |
| Week range calculation | Third-party date library (date-fns, dayjs) | Vanilla `Date` arithmetic | The calculation is ~15 lines; adding 13KB+ date library for this use case is disproportionate |

**Key insight:** The entire phase can ship with zero new npm dependencies. Every tool needed (fonts, i18n, styling, date formatting) is either already installed or built into the platform.

---

## Common Pitfalls

### Pitfall 1: `Math.random()` Without `connection()` Throws at Build Time

**What goes wrong:** Build fails with error `Cannot access Math.random() before other uncached data or Request data in a Server Component`. Or worse: the component silently prerendered with the same "random" dialect on every page load.

**Why it happens:** Next.js 15 treats `Math.random()` as a signal of non-determinism. Without `await connection()` (or another Dynamic API like `cookies()`), the component is attempted as prerenderable. The `Math.random()` call violates that assumption.

**How to avoid:** Add `await connection()` as the first statement after `await params` in `page.tsx`, before the dialect random selection.

**Warning signs:** Build-time TypeScript/Next.js error mentioning `Math.random()`; or the same dialect displaying on every page load even across hard refreshes.

### Pitfall 2: UTC Date vs. Local Date Mismatch

**What goes wrong:** After 10pm UTC (midnight Helsinki time), `new Date().toISOString().slice(0, 10)` returns tomorrow's UTC date, so the delivery status shows tomorrow's answer for users in Finland tonight.

**Why it happens:** `toISOString()` always returns UTC. Finland is UTC+2 (UTC+3 in summer). Finnish users experience this bug for 2–3 hours per night.

**How to avoid:** Use `getFullYear()`, `getMonth() + 1`, `getDate()` on a `new Date()` to extract local date parts. The server timezone should be set to Europe/Helsinki, or the date extraction should use local methods regardless of server timezone.

**Warning signs:** Delivery status answer is inconsistent with the actual day in Finland late at night.

### Pitfall 3: Week View Shows Dates Outside Mon–Sun

**What goes wrong:** If today is Sunday and the calculation uses `getDay()` directly (where Sunday = 0), the week range can be computed as the upcoming Mon–Sun instead of the current Mon–Sun, showing no delivery dates for the current day.

**Why it happens:** JavaScript `getDay()` returns 0 for Sunday but weeks start on Monday in Finland. The formula `(dayOfWeek + 6) % 7` converts JS's 0-indexed Sunday to the correct Monday-indexed offset.

**How to avoid:** Use `(getDay() + 6) % 7` to compute days since Monday. See Pattern 3 in the Code Examples section.

**Warning signs:** Week view on Sunday shows the upcoming week's dates, not the current week.

### Pitfall 4: `new Date(isoString)` Timezone Interpretation

**What goes wrong:** `new Date('2026-03-03')` (date-only ISO string) is interpreted as UTC midnight, not local midnight. When formatted with a Finnish locale, it may display as the previous day.

**Why it happens:** The ECMA spec treats date-only ISO strings as UTC. `new Date('2026-03-03T00:00:00')` (with time) is local. `new Date('2026-03-03')` (without time) is UTC midnight.

**How to avoid:** When creating `Date` objects from the Posti API's ISO date strings for `format.dateTime()`, append `T12:00:00` to avoid day-boundary issues: `new Date(iso + 'T12:00:00')`. Noon local time is safely within any day regardless of timezone offset.

**Warning signs:** Week view dates display as the previous day in the Finnish locale.

### Pitfall 5: Tailwind `dark:` Not Working Without Explicit Configuration

**What goes wrong:** `dark:bg-stone-950` has no effect — the page always shows the light theme.

**Why it happens:** In Tailwind v3, dark mode required `darkMode: 'media'` in `tailwind.config.js`. A developer who read v3 docs adds this config to a non-existent config file and wonders why it doesn't work. In Tailwind v4, `dark:` already uses `prefers-color-scheme` by default — no config needed.

**How to avoid:** In Tailwind v4, `dark:` variants work with `prefers-color-scheme` out of the box. The only configuration needed is if you want to override this (e.g., to use a class toggle). For this phase's requirement (system preference only), add zero configuration.

**Warning signs:** `dark:` classes do nothing; checking browser DevTools shows the `dark:` media query is not applied.

---

## Code Examples

Verified patterns from official sources:

### Font Loading with CSS Variable (next/font + Tailwind v4)

```typescript
// Source: https://nextjs.org/docs/app/getting-started/fonts (last updated 2026-02-27)
// Source: https://tailwindcss.com/docs/font-family (fetched 2026-03-03)

// layout.tsx
import { Caveat } from 'next/font/google'

const caveat = Caveat({
  variable: '--font-caveat',   // CSS variable name injected by next/font
  subsets: ['latin'],
  display: 'swap',
})

// Apply .variable class to html so the CSS var is available globally
<html className={caveat.variable}>
```

```css
/* globals.css */
@import "tailwindcss";

@theme inline {
  --font-handwriting: var(--font-caveat);  /* creates font-handwriting utility */
}
```

```tsx
/* Usage */
<p className="font-handwriting text-6xl">Kulkeeko Posti?</p>
```

### Per-Request Random Value (connection() pattern)

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/connection (last updated 2026-02-27)
import { connection } from 'next/server'

export default async function Page() {
  await connection()  // opt out of prerendering; must precede Math.random()
  const rand = Math.floor(Math.random() * items.length)
  return <span>{items[rand]}</span>
}
```

### Locale-Aware Date Formatting (next-intl server)

```typescript
// Source: https://next-intl.dev/docs/environments/server-client-components (fetched 2026-03-03)
import { getFormatter } from 'next-intl/server'

const format = await getFormatter()
const label = format.dateTime(new Date('2026-03-03T12:00:00'), {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})
// 'fi' locale: "tiistai 3. maaliskuuta"
// 'en' locale: "Tuesday, March 3"
// 'sv' locale: "tisdag 3 mars"
```

### Tailwind v4 Dark Mode (zero configuration)

```tsx
// Source: https://tailwindcss.com/docs/dark-mode (fetched 2026-03-03)
// No tailwind.config.js needed. dark: variant uses prefers-color-scheme by default in v4.

<div className="bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
  <p className="text-green-600 dark:text-green-400">Kyllä</p>
  <p className="text-red-600 dark:text-red-400">Ei</p>
</div>
```

### Monday-Anchored Week Range

```typescript
// Vanilla JS — no library needed
export function getCurrentWeekISO(): string[] {
  const now = new Date()
  const dayOfWeek = now.getDay()              // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = (dayOfWeek + 6) % 7  // 0=Mon, 1=Tue, ..., 6=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - daysFromMonday)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `darkMode: 'media'` in `tailwind.config.js` | No config needed; `dark:` uses `prefers-color-scheme` by default | Tailwind v4 (Jan 2025) | Simpler setup; don't add `tailwind.config.js` for this |
| `@theme {}` bare block | `@theme inline {}` when referencing runtime CSS variables | Tailwind v4 | Must use `inline` when the theme value contains `var()` set by next/font at runtime |
| `unstable_noStore()` for dynamic rendering | `connection()` from `next/server` | Next.js 15.0.0 (stable) | `unstable_noStore` is deprecated; use `connection()` |
| `params` as sync object in Next.js 14 | `params` as `Promise<{...}>` in Next.js 15 | Next.js 15 | Always `await params` in layouts and pages |

**Deprecated/outdated:**
- `unstable_noStore()`: Replaced by `connection()` in Next.js 15.0.0 stable. Use `connection()`.
- `darkMode: 'media'` in Tailwind config: No longer exists in v4. Default behavior is already `prefers-color-scheme`.
- `@tailwindcss/typography` for base prose: Not relevant for this phase's playful UI; raw utility classes are more appropriate.

---

## Open Questions

1. **Placeholder postal code for Phase 3**
   - What we know: Phase 3 builds the UI with a known postal code; Phase 4 wires geolocation and autocomplete. The page must display delivery data, but the actual postal code mechanism doesn't exist yet.
   - What's unclear: Should Phase 3 use a hardcoded postal code (`'00100'` — Helsinki center), or should it render a "no postal code" empty state that Phase 4 will fill?
   - Recommendation: Use hardcoded `'00100'` as a placeholder. This lets the full UI be tested visually. Phase 4 replaces this with the actual postal code resolution. Document the hardcoded value with a `// TODO Phase 4: replace with resolved postal code` comment.

2. **Server timezone for date comparison**
   - What we know: Posti API returns Finnish dates (Europe/Helsinki timezone). The server may run in UTC (Vercel's default).
   - What's unclear: If the Next.js server is in UTC, `new Date().getDate()` returns the UTC date, which is 2–3 hours behind Helsinki. This causes the wrong "today" in the late evening.
   - Recommendation: Use the local date extraction methods (`getFullYear`, `getMonth`, `getDate`) which read from the *server's* local time. On Vercel, add `TZ=Europe/Helsinki` to environment variables so server-side date math matches Finnish time. Flag this for Phase 4 validation.

3. **Caveat font weights available**
   - What we know: Caveat is a variable font on Google Fonts supporting weights 400–700.
   - What's unclear: Whether the variable font format requires explicit weight range specification or if `next/font` handles it automatically.
   - Recommendation: Omit the `weight` option for variable fonts (next/font handles it automatically for variable fonts). Caveat is listed as a variable font on Google Fonts, so no explicit weight array is needed. If the build warns about missing weight, add `weight: ['400', '700']`.

---

## Sources

### Primary (HIGH confidence)

- Next.js official docs, Font Optimization — https://nextjs.org/docs/app/getting-started/fonts — version 16.1.6, last updated 2026-02-27. Used for `next/font/google` patterns, CSS variable approach, `display: 'swap'`.
- Next.js official docs, `connection()` function — https://nextjs.org/docs/app/api-reference/functions/connection — version 16.1.6, last updated 2026-02-27. Used for per-request rendering signal, relationship with `Math.random()`, v15.0.0 stable status.
- Next.js official docs, `Math.random()` in Server Components — https://nextjs.org/docs/messages/next-prerender-random — version 16.1.6, last updated 2026-02-27. Used for error description, `connection()` fix pattern.
- Tailwind CSS official docs, Dark Mode — https://tailwindcss.com/docs/dark-mode — fetched 2026-03-03. Confirmed v4 default is `prefers-color-scheme`; `@custom-variant` for overrides; no config file needed.
- Tailwind CSS official docs, Font Family — https://tailwindcss.com/docs/font-family — fetched 2026-03-03. Confirmed `@theme` directive with `--font-*` namespace; `@theme inline` for runtime CSS variable references.
- next-intl official docs, Server & Client Components — https://next-intl.dev/docs/environments/server-client-components — fetched 2026-03-03. Confirmed `getFormatter()` as async server-side API; `await getFormatter()` pattern.
- Phase 2 RESEARCH.md — `.planning/phases/02-api-i18n-foundation/02-RESEARCH.md` — confirmed existing stack: next-intl 4.8.3, Tailwind v4, Next.js 15.2.2, Zod 4.3.6; I18N-05 dialect isolation pattern.

### Secondary (MEDIUM confidence)

- Tailwind CSS + next/font integration pattern — https://www.owolf.com/blog/how-to-use-custom-fonts-in-a-nextjs-15-tailwind-4-app — fetched 2026-03-03. Cross-referenced with official Tailwind docs; `@theme inline` with CSS variable mapping confirmed.
- next-intl `getFormatter` server usage — WebSearch + next-intl docs fetch — confirmed `await getFormatter()` API available in `next-intl/server`; follows same pattern as `getTranslations`.

### Tertiary (LOW confidence)

- Server timezone behavior on Vercel with `TZ=Europe/Helsinki` — not independently verified; flagged as Open Question 2. Low risk: use local date methods rather than `toISOString()` as primary mitigation.
- Caveat variable font weight behavior in `next/font` — not independently verified; likely works without explicit weight (standard variable font behavior). Low impact: worst case, specify `weight: ['400', '700']` if build warns.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; versions confirmed in Phase 2 research; font loading and Tailwind v4 patterns verified from official docs fetched 2026-03-03
- Architecture: HIGH — `connection()` pattern verified from official Next.js docs; font CSS variable pattern verified from Tailwind and Next.js official docs; date logic is vanilla JS with well-understood behavior
- Pitfalls: HIGH — UTC vs. local date, `Math.random()` without `connection()`, `@theme` vs `@theme inline` all verified from official documentation; Tailwind v4 dark mode zero-config verified from official docs

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable libraries; re-verify if upgrading to Next.js 16 or Tailwind v5)
