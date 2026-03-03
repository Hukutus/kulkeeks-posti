# Stack Research

**Domain:** Next.js utility web app (Finnish postal delivery status, i18n, geolocation, XLSX data pipeline)
**Researched:** 2026-03-03
**Confidence:** HIGH (versions verified via npm registry; official Next.js docs consulted)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | React framework, routing, API proxy | Latest stable (released Oct 2025). App Router is standard. Built-in API routes serve as the Posti API proxy without a separate backend. Vercel is the natural deploy target. |
| React | 19.2.4 | UI runtime | Peer requirement of Next.js 16. React 19 is stable and required. |
| TypeScript | 5.9.3 | Type safety | Standard for Next.js projects. Catches postal-code/locale type errors at compile time. Next.js 16 ships first-class TS support. |
| Tailwind CSS | 4.2.1 | Utility-first styling | v4 is now stable (`latest` tag since early 2025). Native CSS cascade layers, no PostCSS config required. Pairs perfectly with Next.js 16. Enables the playful, warm visual style quickly. |

### i18n

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| next-intl | 4.8.3 | UI string translations (fi/en/sv), locale detection, routing | The de-facto i18n library for Next.js App Router. Officially listed in Next.js docs. Supports Next.js 12–16. Handles middleware-based locale detection, server components, client components, and `useTranslations` hook. 3 locales with static rendering is trivially supported. |
| @formatjs/intl-localematcher | 0.8.1 | Accept-Language header matching | Peer utility used by next-intl's middleware for `Accept-Language` → locale resolution. Tiny, spec-compliant. |
| negotiator | 1.0.0 | HTTP header parsing for locale detection | Pair with `@formatjs/intl-localematcher`. Used in the Next.js official i18n example and next-intl middleware. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| exceljs | 4.4.0 | Parse Statistics Finland XLSX at build time | Data pipeline script only (`scripts/parse-postal-codes.ts`). Use instead of `xlsx` (SheetJS) because exceljs is actively maintained (last publish Dec 2024 vs xlsx last publish Oct 2024, and xlsx has been stuck at 0.18.5 since March 2022 with no major updates). exceljs reads `.xlsx` column values and headers reliably. |
| date-fns | 4.1.0 | Format delivery dates in human-readable form | Only if `Intl.DateTimeFormat` proves insufficient. The app shows a week view of delivery dates — the native `Intl` API may cover this without a dependency. Add date-fns only if locale-aware date formatting for fi/sv/en needs to be more expressive than Intl supports. |
| clsx | 2.1.1 | Conditional CSS class composition | Everywhere conditional Tailwind classes are applied (e.g., green/red delivery status). Tiny, zero-dependency. |
| tailwind-merge | 3.5.0 | Merge Tailwind classes without conflicts | Pair with clsx for a `cn()` utility. Prevents Tailwind class conflicts when composing components. |
| fuse.js | 7.1.0 | Fuzzy search over postal codes for autocomplete | The postal code dataset has ~3,000 entries. Fuzzy search across postal_code + postal_area_name + municipality_name + Swedish names in the browser requires a client-side search index. Fuse.js is lightweight (no WASM), loads fast, and handles the multi-field grouped-by-municipality requirement. |
| @fontsource/caveat | 5.2.8 | Handwritten-style font for dialect display | Self-hosted via @fontsource for performance (no Google Fonts CDN round-trip). Caveat is the best match for "playful, warm, handwritten" — legible at all sizes, has a full Latin character set including Finnish ä/ö/å. |
| lucide-react | 0.576.0 | Icons (location pin, language switcher, reload) | Standard icon library for React. Pairs with Tailwind and shadcn conventions. Tree-shakeable. |
| zod | 4.3.6 | Validation of Posti API response shape | Validates the `[{postalCode, deliveryDates}]` response from the Posti API proxy at runtime. Zod 4 is stable (latest tag). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| create-next-app (16.1.6) | Project scaffolding | `npx create-next-app@latest` creates a Next.js 16 app with TypeScript, Tailwind v4, App Router, and ESLint pre-configured. Use this as the starting point. |
| ESLint + next/eslint | Lint | Included by create-next-app. Use `next lint` as the lint step. No extra config needed for this project size. |
| Prettier | Formatting | Not included by default; add with `prettier` + `prettier-plugin-tailwindcss` to auto-sort Tailwind classes. |
| tsx | Running TypeScript scripts | For the `scripts/parse-postal-codes.ts` data pipeline. `npx tsx scripts/parse-postal-codes.ts` avoids a separate compile step. Install as dev dependency. |
| Vercel CLI | Local dev + deployment | `vercel dev` mirrors production Edge middleware locally. `vercel --prod` deploys. |

---

## Installation

```bash
# Scaffold the project (Next.js 16 with TypeScript + Tailwind v4 + App Router)
npx create-next-app@latest posti-days --typescript --tailwind --app --no-src-dir --no-import-alias

# i18n
npm install next-intl @formatjs/intl-localematcher negotiator

# Type stubs for negotiator (not shipped with package)
npm install -D @types/negotiator

# Search for autocomplete
npm install fuse.js

# Utilities
npm install clsx tailwind-merge zod lucide-react

# Font
npm install @fontsource/caveat

# XLSX parsing (dev/script only — not a runtime dep)
npm install -D exceljs tsx

# Optional: date formatting (only if Intl.DateTimeFormat is insufficient)
# npm install date-fns
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| next-intl 4.8.3 | next-i18next, lingui, rosetta | next-i18next is Pages Router only; lingui requires a build step for message extraction; rosetta is too minimal (no locale routing). Use next-intl unless you need a translation management platform integration (then consider Tolgee). |
| exceljs | xlsx (SheetJS) | xlsx has far wider adoption but has been stuck at 0.18.5 since March 2022 with no major updates. For a one-off build-time script, either works. If you hit an edge case with exceljs column parsing, xlsx is a valid fallback. |
| fuse.js | native `<datalist>`, react-select, cmdk | `<datalist>` doesn't support grouped results or fuzzy matching across multiple fields. react-select adds ~50 KB and is overkill for a single input. cmdk is designed for command palettes, not postal code pickers. fuse.js gives fuzzy multi-field search with grouping logic you control. |
| @fontsource/caveat | Google Fonts CDN, next/font with remote URL | Google Fonts CDN adds a DNS round-trip and privacy concern. `next/font` with the `@fontsource` package is the canonical Next.js way: zero layout shift, self-hosted, tree-shaken. |
| Tailwind CSS v4 | Tailwind CSS v3, CSS Modules, styled-components | Tailwind v4 is now stable (`latest` tag). v3 is maintained as `v3-lts` but receives no new features. Styled-components has React Server Component incompatibilities. CSS Modules work but are slower to prototype with for a small utility app. |
| Zod | yup, valibot | Zod 4 is the TypeScript ecosystem standard. valibot is smaller but has a smaller ecosystem. yup is older with less TypeScript ergonomics. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Pages Router (`pages/`) | Next.js 16 App Router is the stable standard. Pages Router is in maintenance mode. Mixing the two causes confusion. | App Router only (`app/`) |
| next-i18next | Written for Pages Router. Requires `serverSideTranslations` which does not exist in App Router. | next-intl |
| SheetJS/xlsx pro version | Requires a paid license for recent versions; community edition (0.18.5) hasn't had a major npm release since 2022. | exceljs |
| react-select | 50 KB+ bundle for a single postal code input; over-engineered for this use case; harder to style with Tailwind. | fuse.js + headless `<input>` + custom dropdown |
| Moment.js | Deprecated by its own maintainers. Huge bundle size. | date-fns or native `Intl.DateTimeFormat` |
| `node-fetch` | Node 18+ (which Next.js 16 requires) ships native `fetch`. No polyfill needed. | Native `fetch` in API routes |
| External database (Postgres, etc.) | The project is explicitly no-backend. Postal codes are static JSON at build time. Delivery status is fetched live from Posti API. localStorage handles persistence. | No database — static JSON + localStorage |

---

## Stack Patterns by Variant

**For the Posti API proxy (Next.js Route Handler):**
- Use `app/api/delivery/route.ts` with `export async function GET(request: Request)`
- Proxy to `https://www.posti.fi/maildelivery-api-proxy/?q={postalCode}` using native `fetch`
- Validate response with Zod before returning to client
- Because Next.js API routes are serverless functions on Vercel — no CORS issues, no credentials exposed

**For locale routing:**
- Use next-intl's `createNavigation` with subpath routing (`/fi/`, `/en/`, `/sv/`)
- Auto-detect from `Accept-Language` header in middleware
- Remember selection in a cookie (next-intl handles this)
- Because 3 locales with static rendering is the simplest pattern next-intl supports

**For the postal code autocomplete:**
- Load full postal code JSON at component mount (it will be ~200 KB uncompressed, ~30 KB gzipped — acceptable for a utility app)
- Index with fuse.js on first search keystroke
- Render a custom `<ul>` dropdown grouped by municipality
- Because `<datalist>` cannot group results and doesn't support searching across 4 fields simultaneously

**For XLSX data pipeline:**
- Run as a `scripts/parse-postal-codes.ts` Node.js script with `tsx`
- Fetch the XLSX dynamically using the current year in the URL
- Write output to `public/postal-codes.json`
- Commit the generated JSON to the repo (no runtime XLSX parsing)
- Because statically generated JSON keeps the app fast and removes the XLSX as a runtime dependency

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next-intl@4.8.3 | next@^12-^16, react@^16-^19 | Verified via peerDependencies. All versions supported. |
| Tailwind CSS@4.2.1 | Next.js 16 | v4 uses `@import "tailwindcss"` in CSS, no `tailwind.config.js` required. Works with `@tailwindcss/postcss` PostCSS plugin or the Vite plugin. For Next.js (which uses webpack/Turbopack, not Vite) use `@tailwindcss/postcss`. |
| exceljs@4.4.0 | Node.js >= 8.3.0 | Node 18+ (required by Next.js 16) works fine. |
| fuse.js@7.1.0 | React 18/19, Next.js Client Components | Must be a Client Component (`"use client"`) since it runs in the browser. |
| zod@4.3.6 | TypeScript ^5.0 | Zod 4 requires TypeScript 5+. Next.js 16 ships with TypeScript 5 support. |

---

## Sources

- Next.js 16.1.6 official docs (https://nextjs.org/docs/app/guides/internationalization) — i18n routing patterns, library recommendations. Fetched 2026-03-03. HIGH confidence.
- npm registry `npm view [package] version` / `dist-tags` — all version numbers verified live. HIGH confidence.
- Next.js npm metadata — confirmed v16.0.0 released 2025-10-22; v16.1.6 is current stable. HIGH confidence.
- next-intl peerDependencies — confirmed support for Next.js 12–16 and React 16–19. HIGH confidence.
- exceljs vs xlsx comparison — xlsx stuck at 0.18.5 (npm time data); exceljs 4.4.0 published Dec 2024. MEDIUM confidence (no detailed changelog review).
- Tailwind CSS dist-tags — v4.2.1 is `latest`, v3 is `v3-lts`. HIGH confidence.
- Zod dist-tags — 4.3.6 is `latest` stable. HIGH confidence.

---
*Stack research for: posti-days (Finnish postal delivery status app)*
*Researched: 2026-03-03*
