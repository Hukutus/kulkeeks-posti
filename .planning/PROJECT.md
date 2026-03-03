# Posti-days

## What This Is

A Next.js web app that instantly tells Finnish users whether Posti delivers mail today at their postal code, presented through Finnish dialect humor. Users see a random dialect version of "Does mail run today? Yes/No" with a Caveat handwriting font, a color-coded week view, and geolocation or autocomplete-based postal code selection. Deployed at posti-days.vercel.app.

## Core Value

Instantly answer "Is Posti delivering mail today?" for the user's postal code — with a smile.

## Requirements

### Validated

- ✓ Query Posti mail delivery API and display yes/no answer — v1.0
- ✓ Show random Finnish dialect question/answer on each page load — v1.0
- ✓ Display all delivery dates for the current week — v1.0
- ✓ Green/red color coding for delivery status — v1.0
- ✓ Request browser geolocation on first visit — v1.0
- ✓ Autocomplete dropdown for manual postal code selection — v1.0
- ✓ Autocomplete searches across postal code, area name, municipality — v1.0
- ✓ Autocomplete groups results by municipality — v1.0
- ✓ Remember postal code in localStorage — v1.0
- ✓ Change postal code anytime — v1.0
- ✓ Support 3 languages: Finnish, English, Swedish — v1.0
- ✓ Auto-detect language from browser, fallback to English — v1.0
- ✓ Language selection remembered via locale cookie — v1.0
- ✓ Dialect content always Finnish regardless of UI language — v1.0
- ✓ Data pipeline: Statistics Finland XLSX → JSON — v1.0
- ✓ Dynamic year resolution in XLSX URL — v1.0
- ✓ Swedish municipality names from Classification API — v1.0
- ✓ Playful visual style with Caveat handwriting font — v1.0
- ✓ Deploy to Vercel — v1.0

### Active

- [ ] Share link with postal code pre-filled via URL parameter
- [ ] Additional dialect content beyond the initial 11 variants
- [ ] Language switcher UI component (routing works, no in-app control)

### Out of Scope

- PWA / installable app — just a website, no service worker needed
- Push notifications — calendar/week view covers the use case
- Historical delivery data — Posti API doesn't support it
- Multiple postal code tracking — single-purpose app, fast switching via autocomplete
- User accounts or backend database — localStorage covers all persistence
- Parcel / package tracking — completely different product
- Offline mode — real-time delivery data is core value

## Context

Shipped v1.0 with 1,373 LOC TypeScript/TSX/CSS.
Tech stack: Next.js 15.5.12, React 19, Tailwind CSS 4, next-intl, Zod, Headless UI, Fuse.js, ExcelJS.
Production: https://posti-days.vercel.app
3,018 Finnish postal codes in dataset with Finnish and Swedish names.
11 dialect variants in content.json.

Known tech debt:
- No language-switcher UI (URL path switching works)
- DISP-04 waived: dialect name/region not rendered (user preference)
- getDeliveryDates wrapper orphaned (route handler duplicates fetch logic)
- Stale municipality_code type in PostalCodeSelector

## Constraints

- **Tech stack:** Next.js 15.5.12 (React 19), deployed on Vercel
- **API dependency:** Posti mail delivery API — no auth required, availability not guaranteed
- **Data freshness:** Postal code XLSX updates yearly; script handles year rollover
- **Geolocation:** Browser API requires HTTPS and user permission; denial falls back to autocomplete
- **Languages:** UI strings in fi/en/sv; dialect content always Finnish
- **Vercel:** TZ env var reserved — use Intl.DateTimeFormat for Finnish timezone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dialects always visible regardless of language | Core personality — humor is the differentiator | ✓ Good — works well |
| Geolocation first, autocomplete fallback | Most users set code once and revisit | ✓ Good — smooth UX |
| Static JSON for postal codes (not runtime XLSX) | Build-time processing keeps app fast | ✓ Good — 3,018 entries, ~500KB |
| Vercel deployment | Natural fit for Next.js, free tier sufficient | ✓ Good — deployed same day |
| Statistics Finland Classification API for Swedish names | XLSX doesn't have Swedish municipality names | ✓ Good — 308 municipalities, 0 gaps |
| Worksheet by index not name | Sheet name changed between XLSX years | ✓ Good — prevents yearly breakage |
| Intl.DateTimeFormat for timezone | TZ env var reserved on Vercel | ✓ Good — correct Finnish dates |
| Next.js 15.5.12 upgrade | CVE-2025-66478 blocked deployment | ✓ Good — security patched |
| Dialect name/region hidden | User preferred cleaner UI | ✓ Good — user decision |
| Module-level Fuse cache | Avoids 250KB bundle on every render | ✓ Good — lazy load on first search |

---
*Last updated: 2026-03-03 after v1.0 milestone*
