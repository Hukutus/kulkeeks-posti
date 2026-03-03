# Pitfalls Research

**Domain:** Finnish postal delivery status web app (Next.js + geolocation + i18n + external API + XLSX data pipeline)
**Researched:** 2026-03-03
**Confidence:** HIGH (official Next.js docs, MDN, verified against current versions)

---

## Critical Pitfalls

### Pitfall 1: localStorage Access During SSR Causes Hydration Mismatch

**What goes wrong:**
Reading `localStorage` (saved postal code, saved language) during Server Component rendering or in a Client Component's render body causes a ReferenceError on the server (`window is not defined`) and a hydration mismatch. The server renders "no postal code known" while the client immediately knows one from storage — React detects the HTML difference and throws a hydration error.

**Why it happens:**
`localStorage` is a browser-only API. Next.js App Router pre-renders Client Components to HTML on the server. Any code that runs during initial render and touches `window`, `localStorage`, or `navigator` will fail silently or throw. Developers see it working in development (where HMR masks it) but production builds expose the bug.

**How to avoid:**
- Only access `localStorage` inside `useEffect(() => {}, [])` — this runs only on the client after hydration
- Use a mounted/hydrated state guard: render a neutral initial state on server, update to persisted value in useEffect
- Pattern: `const [postalCode, setPostalCode] = useState<string | null>(null)` with `useEffect(() => { setPostalCode(localStorage.getItem('postalCode')) }, [])`
- Never pass localStorage values as initial useState values directly

**Warning signs:**
- Console error: "Hydration failed because the initial UI does not match what was rendered on the server"
- Console error: "window is not defined" during build or in server logs
- App works in `next dev` but fails after `next build && next start`

**Phase to address:**
Data persistence / postal code selection phase — define the localStorage access pattern before building any components that need it.

---

### Pitfall 2: Geolocation Blocked by Permissions-Policy Header

**What goes wrong:**
Setting a `Permissions-Policy` HTTP header that includes `geolocation=()` or forgetting to explicitly allow geolocation will silently block the browser Geolocation API — `navigator.geolocation` may be undefined or `getCurrentPosition()` will call the error callback with a PERMISSION_DENIED code even if the user would have allowed it.

**Why it happens:**
Next.js security header recommendations (and many copy-paste security configs) include `Permissions-Policy: geolocation=()` to block geolocation as a "secure default." This app needs geolocation, making this restriction a bug, not a feature. The official Next.js security headers docs show `geolocation=()` as the example value.

**How to avoid:**
- Explicitly permit geolocation in the policy: `Permissions-Policy: geolocation=(self)`
- Test geolocation in a deployed environment (Vercel preview), not just `localhost`
- Audit `next.config.js` headers section after any copy-paste from security guides

**Warning signs:**
- Geolocation works in local dev but not on Vercel deployment
- Error code 1 (PERMISSION_DENIED) even before the browser shows a permission prompt
- `navigator.permissions.query({ name: 'geolocation' })` returns `denied` before the user has been asked

**Phase to address:**
Geolocation implementation phase — verify the Permissions-Policy header is not blocking geolocation before shipping.

---

### Pitfall 3: Geolocation Requires HTTPS (Secure Context) — Fails on HTTP

**What goes wrong:**
`navigator.geolocation` is undefined or entirely unavailable on non-HTTPS origins. The feature check `"geolocation" in navigator` returns false. The UI falls back to the manual postal code picker with no explanation, and the user has no idea geolocation was attempted.

**Why it happens:**
The Geolocation API is restricted to secure contexts (HTTPS) by all modern browsers. Local development on `localhost` is treated as a secure context and works fine, creating a false sense of security. Any HTTP preview URL, ngrok misconfiguration, or staging environment on HTTP will silently lose geolocation.

**How to avoid:**
- All deployment and preview environments must use HTTPS — Vercel handles this automatically
- In error handling, distinguish between "no geolocation support" (API absent) and "user denied" (error code 1)
- For local testing over a network (not localhost), use `ngrok` with HTTPS or Vercel preview deployments

**Warning signs:**
- `navigator.geolocation` is `undefined`
- Geolocation silently does nothing when opening the app over HTTP
- Automated tests on `http://localhost` pass, but real deployment on a non-HTTPS staging URL fails

**Phase to address:**
Geolocation implementation phase — document that all testing must happen on HTTPS or localhost.

---

### Pitfall 4: Posti API Called Directly from the Browser (CORS / Rate Limiting)

**What goes wrong:**
Calling `https://www.posti.fi/maildelivery-api-proxy/` directly from the browser (client-side `fetch`) will likely fail with a CORS error if Posti does not set permissive CORS headers. Even if it works today, Posti can change CORS policy, add rate limiting by IP, or block non-browser-looking requests at any time.

**Why it happens:**
The Posti API is an undocumented proxy endpoint. Developers test it from curl or the browser address bar (where CORS doesn't apply), conclude it works, then wire it directly into their frontend `fetch()` call — only to discover browser CORS restrictions at runtime.

**How to avoid:**
- Always proxy the Posti API through a Next.js Route Handler (`app/api/delivery/route.ts`)
- The Route Handler calls Posti server-to-server (no CORS restrictions apply)
- The Route Handler can add error handling, input validation, and caching without exposing the upstream URL
- Pattern: `GET /api/delivery?postalCode=00100` → server calls Posti → returns normalized response

**Warning signs:**
- Browser console shows: "Access to fetch at 'https://www.posti.fi/...' has been blocked by CORS policy"
- Works in curl but fails in browser
- Direct Posti URL is written into a `'use client'` component

**Phase to address:**
API integration phase — implement the Route Handler proxy from the start, not as a retrofit.

---

### Pitfall 5: Next.js Route Handler Caching the Posti API Response Indefinitely

**What goes wrong:**
In Next.js App Router (v15+), `GET` Route Handlers are dynamically rendered by default, but `fetch()` calls inside them can be cached by the Data Cache if not explicitly opted out. Postal delivery dates change daily — stale cache means users see yesterday's delivery status as today's answer.

**Why it happens:**
Next.js extends `fetch()` with its Data Cache. A `fetch('https://posti.fi/...')` inside a Route Handler with no `cache` option will use the "auto" heuristic. During static rendering at build time this would cache forever. The rules are non-obvious and changed between Next.js 13, 14, and 15 (v15 changed GET handler default from static to dynamic — but this is easily confused by developers reading older documentation).

**How to avoid:**
- Explicitly opt out of caching for the Posti API call: `fetch(url, { cache: 'no-store' })`
- Add `export const dynamic = 'force-dynamic'` to the Route Handler as a belt-and-suspenders guard
- Verify behavior by checking timestamps in the response during development

**Warning signs:**
- API returns the same delivery dates after midnight
- Adding `console.log` in the Route Handler shows it only fires once, not per request
- Response has a future `Age` or `Cache-Control: max-age` header

**Phase to address:**
API integration phase — set `cache: 'no-store'` and `dynamic = 'force-dynamic'` at the time the Route Handler is created.

---

### Pitfall 6: XLSX Year Resolution Fails Silently at Year Rollover

**What goes wrong:**
The data script constructs the Statistics Finland XLSX URL using the current year (`alueryhmittely_posnro_{year}_fi.xlsx`). If the script runs in January before Statistics Finland publishes the new year's file, the URL 404s and the script either crashes, produces an empty JSON, or silently uses the previous year's data — breaking the build or shipping stale postal code data.

**Why it happens:**
Statistics Finland publishes the yearly postal code file at some point in the new year — not on January 1st. The exact publication date varies. A script that assumes "current year = valid file" is inherently fragile at year boundaries.

**How to avoid:**
- Script should try the current year URL first, and fall back to `currentYear - 1` on 404
- Add explicit HTTP status check: if response is not 200, retry with prior year
- Log which year's file was used so it's visible in build output
- If possible, check the Statistics Finland page to find publication dates for future years

**Warning signs:**
- Build fails in January with a 404 or fetch error
- `postal-codes.json` is empty or has zero entries after the script runs
- No error logged but the JSON file timestamp matches last year's build

**Phase to address:**
Data pipeline phase — implement year fallback logic when writing the XLSX download script.

---

### Pitfall 7: Swedish Municipality Names Missing from the XLSX and Left as Empty Strings

**What goes wrong:**
The Statistics Finland XLSX contains Swedish postal area names (`Postinumeroalueen nimi sv`) but does NOT contain Swedish municipality names. If the data script is built without sourcing Swedish municipality names separately, the autocomplete shows empty strings or Finnish names in the municipality grouping when the UI language is Swedish.

**Why it happens:**
The PROJECT.md explicitly calls this out as a known gap. Developers often treat it as a "nice to have" and defer it — then ship with blank Swedish municipality names. The autocomplete groups results by municipality, so blank group headers break the UX for Swedish-speaking users.

**How to avoid:**
- Plan the Swedish municipality name sourcing as a required part of the data pipeline phase, not an afterthought
- Source from Statistics Finland's municipality registry (`kuntarekisteri`) or DVV (Digital and Population Data Services Agency)
- The data pipeline script should explicitly fail if any municipality has no Swedish name (after sourcing)

**Warning signs:**
- `postal-codes.json` has entries where `municipality_name_sv` is null or empty string
- Switching UI to Swedish shows blank group headers in the autocomplete dropdown

**Phase to address:**
Data pipeline phase — Swedish municipality names must be sourced and merged before the data script is considered complete.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Call Posti API directly from browser | No Route Handler to maintain | CORS failure on any Posti policy change, no server-side caching | Never — proxy from day one |
| Hardcode current year in XLSX URL | Simpler script | Build breaks in January until manually fixed | Never — add year fallback logic |
| Access localStorage in render body | Simpler code | Hydration mismatch errors, broken SSR | Never — always use useEffect |
| Inline all i18n strings as hardcoded JSX | Fast initial build | Untranslatable strings scattered across components | MVP only if i18n is added in a later phase |
| Skip Swedish municipality name sourcing | Faster data pipeline | Swedish UI shows blank municipality groups | Never — this is a stated requirement |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Posti delivery API | Call from browser fetch(), assume CORS is open | Proxy through a Next.js Route Handler; call server-to-server |
| Posti delivery API | Assume response always contains `deliveryDates` array | Check for empty array (no delivery days in range), malformed response, and non-200 status |
| Statistics Finland XLSX | Assume file URL is stable and year is always current | Try current year, fall back to prior year on 404; log which was used |
| Browser Geolocation | Call `navigator.geolocation.getCurrentPosition()` without error handler | Always provide error callback; handle codes 1 (denied), 2 (unavailable), 3 (timeout) separately |
| Browser Geolocation | Use `enableHighAccuracy: true` | Not needed — postal code area precision; use default (faster, lower battery drain) |
| next-intl locale detection | Rely on middleware to always detect correct locale | localStorage-persisted preference must override Accept-Language on subsequent visits; implement preference read in middleware or client-side |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading full postal-codes.json (3,000+ entries) on every page | Slow initial page load, large JS bundle | Serve as a static JSON asset fetched only when autocomplete opens; don't import it into component bundle | From day one for mobile users |
| Geolocation without `maximumAge` option | Slow postal code detection on return visits | Pass `maximumAge: 300000` (5 min) to reuse recent position; user's postal code doesn't change per session | Any return visit on mobile |
| Searching all postal code fields on every keystroke | Janky autocomplete on low-end devices | Debounce input (300ms); limit displayed results to top 20 matches | With 3,000+ entries and fast typists |
| Re-rendering dialect text on every keystroke or state change | Unnecessary re-renders | Compute random dialect selection once on page load (useRef or useState with no deps), not in render path | Noticeable jank on low-end devices |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Setting `Permissions-Policy: geolocation=()` in security headers | Silently blocks geolocation for all users | Explicitly allow: `geolocation=(self)` |
| Reflecting postal code input directly into Posti API URL without validation | Potential SSRF if Posti URL construction is ever expanded | Validate input: postal codes are 5-digit numeric strings; reject anything else before proxying |
| Storing sensitive data in localStorage | Not a risk here — postal code is not sensitive | No action needed; postal codes are public data |
| Exposing Posti API endpoint via client-side code | Posti can rate-limit or block; URL can change without notice | Keep Posti URL only in server-side Route Handler (environment variable or hardcoded on server); never in client bundle |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state while geolocation resolves | App looks broken during the permission prompt + GPS lookup | Show "Detecting your location..." state immediately when geolocation is requested |
| No explanation when geolocation is denied | User doesn't know why postal code dropdown appeared | On geolocation error, show a brief message: "Location access denied — enter your postal code" |
| Autocomplete requires exact postal code number | Users who only know their neighborhood name can't find themselves | Search across postal_code, postal_area_name, AND municipality_name as stated in requirements |
| Dialect text re-randomizes on re-render | Jarring if any state update causes parent re-render | Fix dialect selection in a ref or useState with empty deps array so it's stable for the page session |
| "No delivery today" looks like an error | Red color alone can read as "something broke" | Pair color with clear text: "No mail today" not just a red indicator |
| Language switcher changes UI language but dialect changes too | Dialect is always Finnish (app personality); language controls only UI chrome | Keep dialect text independent of i18n locale; it renders from content.json regardless of selected language |

---

## "Looks Done But Isn't" Checklist

- [ ] **Geolocation error handling:** Often missing the timeout case (error code 3) — verify all three error codes (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT) are handled
- [ ] **API proxy Route Handler:** Often missing `{ cache: 'no-store' }` — verify the Posti response is never cached in production by checking response freshness after midnight
- [ ] **Postal code persistence:** Often missing the "user changes postal code" flow — verify that selecting a new postal code updates both localStorage and UI state
- [ ] **Swedish municipality names:** Often left as empty strings — verify no `municipality_name_sv` is null/empty in generated `postal-codes.json`
- [ ] **XLSX year fallback:** Often untested — verify data script succeeds when the current year's file is intentionally unavailable (mock 404 in a test run)
- [ ] **i18n language persistence:** Often missing — verify that selecting Swedish then refreshing the page loads Swedish (not browser default or English)
- [ ] **Delivery week display:** Often shows wrong week on Sunday night — verify week boundary logic using Finnish `fi-FI` locale week start (Monday)
- [ ] **Dialect randomization on page load:** Often re-randomizes on every re-render — verify dialect is stable for the duration of a page session
- [ ] **Autocomplete keyboard navigation:** Often missing — verify the dropdown is usable without a mouse (arrow keys, Enter, Escape)

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| localStorage hydration mismatch | LOW | Move all localStorage reads into useEffect; add mounted state guard |
| Geolocation blocked by Permissions-Policy | LOW | Update headers config; redeploy |
| Posti API called from browser (CORS) | MEDIUM | Add Route Handler proxy; update all client fetches to call /api/delivery |
| Stale Posti API responses cached | LOW | Add `cache: 'no-store'` and `dynamic = 'force-dynamic'` to Route Handler; redeploy |
| XLSX year rollover build failure | LOW | Add year fallback logic to data script; rerun script; commit updated JSON |
| Swedish municipality names missing | MEDIUM | Source Swedish names from Statistics Finland municipality registry; merge into data script; regenerate JSON |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| localStorage SSR hydration mismatch | Postal code persistence / state management phase | Build and run `next build && next start`; confirm no hydration errors in browser console |
| Geolocation blocked by Permissions-Policy | Geolocation implementation phase | Deploy to Vercel preview; test geolocation triggers correctly |
| Geolocation requires HTTPS | Geolocation implementation phase | All testing happens on `localhost` or HTTPS preview URLs |
| Posti API CORS / direct browser call | API integration phase | Confirm Posti API is only called from Route Handler, not client bundle (`grep` for posti.fi in client JS) |
| Route Handler caching Posti response | API integration phase | Check response freshness post-midnight on a deployed build |
| XLSX year rollover failure | Data pipeline phase | Simulate 404 for current year in script; confirm fallback to prior year works |
| Swedish municipality names missing | Data pipeline phase | Inspect generated JSON; confirm zero null `municipality_name_sv` entries |
| Dialect re-randomizes on re-render | UI / dialect display phase | Trigger several state changes (language switch, postal code update); confirm dialect text is stable |

---

## Sources

- Next.js official docs — Server and Client Components (verified 2026-02-27): https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js official docs — Caching in Next.js (verified 2026-02-27): https://nextjs.org/docs/app/guides/caching
- Next.js official docs — Route Handlers (verified 2026-02-27): https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js official docs — Custom Headers / Permissions-Policy (verified 2026-02-27): https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- Next.js official docs — Static Exports (verified 2026-02-27): https://nextjs.org/docs/app/guides/static-exports
- MDN — Using the Geolocation API (authoritative): https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API
- MDN — Secure Contexts (authoritative): https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
- PROJECT.md — Explicit callout of Swedish municipality names as a known gap
- Posti delivery API — live response verified: https://www.posti.fi/maildelivery-api-proxy/?q=00100

---
*Pitfalls research for: Finnish postal delivery status web app (posti-days)*
*Researched: 2026-03-03*
