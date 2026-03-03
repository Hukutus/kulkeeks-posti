---
phase: 02-api-i18n-foundation
plan: "02"
subsystem: i18n
tags: [next-intl, i18n, routing, middleware, locale, typescript]

# Dependency graph
requires:
  - phase: 01-data-pipeline
    provides: postal codes dataset and project scaffolding
provides:
  - next-intl locale routing with fi/en/sv path prefix support
  - Middleware for Accept-Language detection and locale redirects with 1-year cookie
  - Locale layout with NextIntlClientProvider and locale validation
  - Translation message scaffolds for all three locales
  - Navigation utilities (locale-aware Link, redirect, usePathname, useRouter)
affects: [03-ui, 04-location, all future UI phases requiring translated content]

# Tech tracking
tech-stack:
  added: [next-intl ^4.8.3, @formatjs/intl-localematcher, negotiator, @types/negotiator, @tailwindcss/postcss]
  patterns: [locale path prefix routing, per-request locale resolution, static params generation for locales, NextIntlClientProvider wrapping]

key-files:
  created:
    - src/i18n/routing.ts
    - src/i18n/request.ts
    - src/i18n/navigation.ts
    - src/middleware.ts
    - src/app/[locale]/layout.tsx
    - src/app/[locale]/page.tsx
    - src/app/[locale]/globals.css
    - messages/en.json
    - messages/fi.json
    - messages/sv.json
  modified:
    - next.config.ts
    - package.json
    - tsconfig.json

key-decisions:
  - "Place middleware.ts in src/ not project root — Next.js 15 with src/app looks for middleware in src/ (rootDir = path.join(appDir, '..') = src/)"
  - "Use src/i18n/request.ts path in createNextIntlPlugin (not default auto-detection)"
  - "Install @tailwindcss/postcss — required by postcss.config.mjs for Tailwind v4 but was missing from package.json"
  - "Default locale is 'en' (English) — /de and similar unknown paths redirect to /en/{path} then 404"

patterns-established:
  - "Locale routing: URL path prefix /fi, /en, /sv controls active locale"
  - "Locale cookie: set automatically by next-intl middleware, persists 1 year"
  - "Translation namespaces: start with 'Common' namespace, add more per feature in Phase 3+"
  - "Server components use getTranslations(), client components use useTranslations()"
  - "Params awaited: const { locale } = await params (Next.js 15 — params is a Promise)"

requirements-completed: [I18N-01, I18N-02, I18N-03, I18N-04, I18N-05]

# Metrics
duration: 9min
completed: 2026-03-03
---

# Phase 02 Plan 02: i18n Foundation Summary

**next-intl locale routing with fi/en/sv path prefix, Accept-Language middleware, locale cookie, and translation scaffolds for all three languages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-03T13:47:23Z
- **Completed:** 2026-03-03T13:56:28Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Three locales (fi, en, sv) working with URL path prefix routing — /fi, /en, /sv each return 200 with correct translated content
- Middleware auto-detects Accept-Language header and redirects / to appropriate locale; English fallback when no match
- 1-year locale cookie set automatically by next-intl middleware on locale navigation
- Translation message scaffolds created (Common namespace) for Finnish, English, and Swedish
- next build completes without errors, middleware shows 44 kB in build output

## Task Commits

Each task was committed atomically:

1. **Task 1: Install next-intl and create i18n config files** - `bd21a5b` (feat)
2. **Task 2: Relocate layout/page to [locale] segment and wire next-intl plugin** - `c6b3ea5` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `src/i18n/routing.ts` - Locale routing config (locales: fi/en/sv, defaultLocale: en, 1-year cookie)
- `src/i18n/request.ts` - Per-request locale resolution and message loading
- `src/i18n/navigation.ts` - Locale-aware Link, redirect, usePathname, useRouter exports
- `src/middleware.ts` - Accept-Language detection, locale redirect, cookie management
- `src/app/[locale]/layout.tsx` - Root layout with NextIntlClientProvider, locale validation, generateStaticParams
- `src/app/[locale]/page.tsx` - Home page rendering locale-specific translations
- `src/app/[locale]/globals.css` - Tailwind CSS (moved from src/app/)
- `messages/en.json` - English translation strings (Common namespace)
- `messages/fi.json` - Finnish translation strings (Common namespace)
- `messages/sv.json` - Swedish translation strings (Common namespace)
- `next.config.ts` - Wrapped with createNextIntlPlugin
- `package.json` - Added next-intl, @formatjs/intl-localematcher, negotiator, @tailwindcss/postcss

## Decisions Made
- Middleware must be in `src/middleware.ts`, not project root — Next.js 15 with `src/app/` layout computes rootDir as `src/` and searches there for middleware
- Default locale is `en` — this means `/de` redirects to `/en/de` (treated as path), then 404 on follow-through
- `@tailwindcss/postcss` was installed as a deviation fix (was missing, blocking CSS loading)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] middleware.ts placed in src/ instead of project root**
- **Found during:** Task 2 (dev server verification)
- **Issue:** RESEARCH.md said "Do NOT place middleware.ts inside src/ — must be at project root" — but this is incorrect for Next.js 15 projects with src/app/ layout. Next.js 15 computes `rootDir = path.join(appDir, '..') = src/` and only searches that directory for middleware files. Root-level middleware.ts is never detected.
- **Fix:** Moved middleware.ts from project root to src/middleware.ts; updated import from `'./src/i18n/routing'` to `'./i18n/routing'`
- **Files modified:** src/middleware.ts (new), middleware.ts (deleted)
- **Verification:** next build shows "ƒ Middleware 44 kB"; middleware-manifest.json shows middleware registered; / redirects to /en
- **Committed in:** c6b3ea5 (Task 2 commit)

**2. [Rule 3 - Blocking] Installed missing @tailwindcss/postcss**
- **Found during:** Task 2 (dev server startup)
- **Issue:** postcss.config.mjs references `@tailwindcss/postcss` but package was not installed — CSS loading failed with "Cannot find module '@tailwindcss/postcss'" error causing 500 on all routes
- **Fix:** Ran `npm install @tailwindcss/postcss`
- **Files modified:** package.json, package-lock.json
- **Verification:** Dev server serves CSS correctly; no module-not-found error
- **Committed in:** c6b3ea5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes essential for middleware to work and CSS to load. The middleware location finding is a correction to the research document which had the wrong guidance for Next.js 15 src/ layout projects.

## Issues Encountered
- next-intl middleware in Next.js 15 with src/ layout: middleware must be in src/middleware.ts, not project root. The Next.js build system sets rootDir = path.join(appDir, '..') = src/ and runs getFilesInDir(rootDir), so only files directly in src/ are candidates. The research doc had incorrect guidance.
- @tailwindcss/postcss was referenced in postcss.config.mjs but not in package.json dependencies.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- i18n infrastructure complete: locale routing, middleware, translation loading, navigation utilities all functional
- Phase 3+ UI components can use useTranslations('Common') and add new namespaces to messages/*.json
- Dialect content (content.json) remains in src/app/ untouched and is not routed through i18n translations (I18N-05)
- Ready for Phase 03 UI development

## Self-Check: PASSED

All created files confirmed present. Commit hashes bd21a5b and c6b3ea5 verified in git history. `next build` completes without errors and shows middleware 44 kB.

---
*Phase: 02-api-i18n-foundation*
*Completed: 2026-03-03*
