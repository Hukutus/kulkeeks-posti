# Milestones

## v1.0 MVP (Shipped: 2026-03-03)

**Phases completed:** 4 phases, 7 plans, ~14 tasks
**Timeline:** 1 day (~6 hours active development)
**Lines of code:** 1,373 TypeScript/TSX/CSS
**Commits:** 45
**Production:** https://posti-days.vercel.app

**Delivered:** A Next.js web app that instantly tells Finnish users whether Posti delivers mail today, presented through the lens of Finnish dialect humor with geolocation and autocomplete postal code resolution.

**Key accomplishments:**
1. Built postal code data pipeline parsing Statistics Finland XLSX with Swedish municipality names via Classification API — 3,018 entries validated
2. Created Posti API proxy with Zod validation eliminating CORS — structured error responses, no 500 crashes
3. Set up next-intl locale routing for Finnish, English, and Swedish with Accept-Language auto-detection
4. Built delivery status page with Caveat handwriting font, color-coded YES/NO, random dialect humor, and locale-aware week view
5. Implemented geolocation + Fuse.js autocomplete with localStorage persistence and change-code control
6. Deployed to production at posti-days.vercel.app with Digitransit geocoding and Next.js 15.5.12

**Tech stack:** Next.js 15.5.12, React 19, TypeScript, Tailwind CSS 4, next-intl, Zod, Headless UI, Fuse.js, ExcelJS

**Known gaps (from audit):**
- DISP-04: Dialect name/region not rendered (waived by user for cleaner UI)
- I18N-03: No language-switcher UI component (URL path switching works, no in-app control)

**Git range:** 0fbc006 → ceb9d49

---

