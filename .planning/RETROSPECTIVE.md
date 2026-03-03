# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-03
**Phases:** 4 | **Plans:** 7 | **Sessions:** 1

### What Was Built
- Postal code data pipeline parsing Statistics Finland XLSX with Swedish municipality names via Classification API (3,018 entries)
- Posti API proxy with Zod validation and structured error responses
- next-intl locale routing for fi/en/sv with Accept-Language auto-detection
- Delivery status page with Caveat handwriting font, color-coded YES/NO, random dialect humor, and locale-aware week view
- Geolocation + Fuse.js autocomplete postal code resolution with localStorage persistence
- Production deployment at posti-days.vercel.app

### What Worked
- Single-day build from zero to production — the 4-phase dependency chain (data → API → UI → UX+deploy) kept each phase focused and independently testable
- TDD pattern for utility functions caught issues early (delivery-utils, postal code parsing)
- Atomic commits per task made it easy to trace what changed and why
- Phase research before planning surfaced critical issues (middleware location, Swedish name sourcing) before they became blockers
- Checkpoint review in Phase 3 caught Finnish umlaut bugs and UI clutter early

### What Was Inefficient
- Phase 4 Plan 02 took 62 min (vs 2-15 min for other plans) — deployment troubleshooting (Next.js CVE block, TZ env var reservation) was the main time sink
- REQUIREMENTS.md checkbox sync fell behind — POST-01, POST-05, POST-06 showed unchecked despite being implemented. The audit caught this but it should have been updated during execution
- getDeliveryDates wrapper became orphaned when Route Handler was built with inline fetch — duplication could have been avoided if Plan 02-01 had been more opinionated about the consumption pattern

### Patterns Established
- Year-fallback download pattern for Statistics Finland data (try current year, fall back to previous)
- Intl.DateTimeFormat with explicit timezone for server-side date computation (Vercel TZ workaround)
- Module-level lazy caching for large JSON datasets in client components
- localStorage orchestration pattern: useEffect reads on mount, handlers write, status state drives conditional rendering
- Geocode proxy pattern: client sends lat/lon, server appends API key

### Key Lessons
1. **Vercel reserves TZ env var** — always use Intl.DateTimeFormat with explicit timezone for server-side date logic
2. **Next.js middleware location depends on project structure** — with src/app/ layout, middleware must be in src/, not project root
3. **Check Vercel CVE blocks before deploying** — upgrading Next.js versions may be required and can cascade to other dependencies
4. **Keep REQUIREMENTS.md checkboxes in sync during execution** — don't rely on end-of-milestone audit to catch documentation drift
5. **Statistics Finland XLSX sheet names change between years** — always use worksheet index, never name

### Cost Observations
- Model mix: balanced profile (mix of opus/sonnet/haiku across agents)
- Sessions: 1 continuous session
- Notable: Entire MVP built in ~6 hours of active development — research + plan + execute cycle kept context windows efficient

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 4 | Initial build — established all core patterns |

### Cumulative Quality

| Milestone | Tests | Coverage | Key Metric |
|-----------|-------|----------|------------|
| v1.0 | 39 | Utility functions covered | 25/26 requirements satisfied, 1 waived |

### Top Lessons (Verified Across Milestones)

1. Phase research before planning prevents mid-execution surprises
2. Single-day MVP builds are achievable with focused dependency chains
