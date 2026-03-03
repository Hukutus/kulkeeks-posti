# Phase 4: Postal Code UX + Deployment - Research

**Researched:** 2026-03-03
**Domain:** Browser Geolocation API, reverse geocoding (Digitransit/Nominatim), client-side autocomplete search, Next.js 15 server/client component architecture, localStorage persistence, Vercel deployment
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POST-01 | App requests browser geolocation on first visit to determine postal code | `navigator.geolocation.getCurrentPosition()` in a `'use client'` component; call on mount via `useEffect` only when no postal code in `localStorage`; proxy lat/lon through `/api/geocode` Route Handler to Digitransit reverse geocoding API |
| POST-02 | If geolocation is denied, user sees an autocomplete dropdown to search postal codes | Headless UI Combobox v2.2.9; `@headlessui/react` + Fuse.js 7.1.0 for fuzzy client-side search against the 3,018-entry `postal-codes.json` loaded as a static import; show when no postal code resolved |
| POST-03 | Autocomplete searches across postal code, area name (fi), area name (sv), and municipality name | Fuse.js `keys` option: `['postal_code', 'postal_area_name', 'postal_area_name_sv', 'municipality_name']`; threshold ~0.3 for reasonable fuzzy tolerance |
| POST-04 | Autocomplete groups results by municipality, then postal areas nested underneath | Group filtered Fuse.js results by `municipality_name` before rendering; render municipality name as `<li>` heading + child postal areas as `<ComboboxOption>` items |
| POST-05 | App remembers selected postal code in localStorage for return visits | `useEffect` on mount reads `localStorage.getItem('postalCode')`; skip geolocation prompt if value present; write on selection; both operations guarded inside `useEffect` (not during SSR) |
| POST-06 | User can re-check geolocation or select a different postal code at any time | "Change postal code" button always visible; clicking it clears current postal code state, clears `localStorage`, re-renders the selection UI (geolocation prompt + autocomplete fallback) |
</phase_requirements>

---

## Summary

Phase 4 introduces the first interactive (client-side) component to the app. The current `page.tsx` is a pure async Server Component that hardcodes postal code `'00100'`. This phase replaces that hardcode with a **PostalCodeProvider** pattern: a `'use client'` component that owns postal code state, reads from localStorage on mount, triggers geolocation on first visit, and renders the delivery content only once a postal code is resolved.

The critical architectural decision is that `page.tsx` **cannot** remain a pure Server Component once it depends on client-state (postal code from localStorage or geolocation). The recommended pattern is a thin server `page.tsx` that renders a `<PostalCodeGate>` client component. `PostalCodeGate` owns all postal code state and, once it has a resolved code, uses the existing `/api/delivery` Route Handler (already built in Phase 2) to fetch delivery data client-side — or alternatively passes the code up so a Server Component can re-fetch. The simplest architecture is full client-side data fetching inside `PostalCodeGate` using the `/api/delivery` Route Handler, which avoids the complexity of server component re-rendering for dynamic state.

The two major external dependencies are: (1) **Digitransit Geocoding API** for reverse geocoding lat/lon → Finnish postal code — requires a free subscription key from `portal-api.digitransit.fi`, must be proxied through a Next.js Route Handler to keep the key server-side; (2) **Nominatim** as a fallback option (no key required, but autocomplete use is policy-forbidden, so it is only suitable for the one-time reverse geocode call per session). Digitransit is preferred because it returns a `postalcode` field from Finnish national data sources and is specifically tuned for Finland.

Vercel deployment is straightforward: connect GitHub repo, auto-detect Next.js, one-click deploy. The `prebuild` script (`npm run generate-postal-codes`) runs automatically before `next build` — but since `public/data/postal-codes.json` is committed to the repo (Phase 1 decision), Vercel does not need network access to Statistics Finland during build. The main deployment considerations are setting the `TZ=Europe/Helsinki` environment variable (for correct Finnish date logic) and the Digitransit API subscription key.

**Primary recommendation:** Build as two plans. Plan 04-01: `PostalCodeGate` client component with geolocation + localStorage + delivery data display. Plan 04-02: autocomplete combobox UI + "change postal code" control + Vercel deployment. The geolocation flow and persistence must work before the autocomplete can be usefully tested.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` / `useEffect` | Built into React 19 (already installed) | Client state for postal code, geolocation status, loading | Built-in; no dependency needed |
| `navigator.geolocation` | Web Platform API | Request user position in browser | Native browser API; no library needed |
| `localStorage` | Web Platform API | Persist selected postal code across sessions | Native browser API; no library needed |
| `@headlessui/react` | 2.2.9 | Accessible combobox (autocomplete) component | Designed for Tailwind CSS projects; React 19 compatible; accessible keyboard nav out of the box; actively maintained; supports virtual scrolling |
| `fuse.js` | 7.1.0 | Client-side fuzzy search for autocomplete | 3,018 postal codes fit comfortably in memory; ~7ms first search, <1.5ms subsequent; searches multiple fields simultaneously; widely used pattern for small-to-medium static datasets |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `postal-codes.json` (already in `/public/data/`) | — | Source data for autocomplete | Import directly in the client component; 3,018 entries, ~250KB before bundling — consider dynamic import if bundle size is a concern |
| Digitransit Geocoding API | External (free, key required) | Reverse geocode lat/lon → Finnish postal code | One call per session when user grants geolocation; proxy via Next.js Route Handler to hide API key |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Digitransit for reverse geocoding | Nominatim (OpenStreetMap) | Nominatim requires no key and returns `postcode` field; usage policy allows one-time user-triggered reverse geocode BUT explicitly forbids autocomplete — safe for POST-01 only; Digitransit is more accurate for Finland (uses Finnish national data); Nominatim is a viable fallback if Digitransit registration is problematic |
| `@headlessui/react` Combobox | shadcn/ui Combobox (Radix-based) | shadcn/ui is not installed in the project; would add Radix dependencies; Headless UI is the natural choice for a Tailwind-first project |
| Fuse.js | Simple `includes()` filter | `includes()` is faster but only matches exact substrings from start; Fuse.js matches partial substrings and handles typos (threshold 0.3); Finnish postal area names contain special characters (ä, ö) that users may type without accents |
| Client-side data fetch via `/api/delivery` | Server Component re-render after code selection | Re-rendering a Server Component after client state change requires URL parameter routing (e.g., `?postalCode=00100`) which triggers full server re-render; simpler architecture is a client-side fetch after code is resolved |

**Installation:**
```bash
npm install @headlessui/react fuse.js
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── [locale]/
│       └── page.tsx                    # MODIFY: thin server shell, renders <PostalCodeGate>
├── components/
│   ├── PostalCodeGate.tsx             # NEW 'use client': owns postal code state + delivery display
│   ├── PostalCodeSelector.tsx         # NEW 'use client': geolocation prompt + autocomplete combobox
│   └── DeliveryDisplay.tsx            # NEW or EXTRACT from page.tsx: renders YES/NO + week view (can be server or client)
└── app/
    └── api/
        ├── delivery/route.ts          # EXISTING (Phase 2) — unchanged
        └── geocode/route.ts           # NEW: proxies Digitransit reverse geocode, hides API key
```

### Pattern 1: PostalCodeGate — Client-Side Orchestrator

**What:** A `'use client'` component that owns all postal code state. On mount, reads localStorage. If code found, shows delivery content immediately. If not, triggers geolocation. If geolocation denied or fails, shows autocomplete.

**When to use:** The root of the interactive subtree; imported in `page.tsx`.

**Example:**
```typescript
// Source: Next.js docs — server/client components pattern
// src/components/PostalCodeGate.tsx
'use client'

import { useState, useEffect } from 'react'
import PostalCodeSelector from './PostalCodeSelector'
import DeliveryDisplay from './DeliveryDisplay'

const STORAGE_KEY = 'postalCode'

export default function PostalCodeGate() {
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'resolved' | 'selecting'>('loading')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setPostalCode(saved)
      setStatus('resolved')
    } else {
      // First visit: trigger geolocation
      setStatus('selecting')
    }
  }, [])

  const handleCodeSelected = (code: string) => {
    localStorage.setItem(STORAGE_KEY, code)
    setPostalCode(code)
    setStatus('resolved')
  }

  const handleChangeCode = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPostalCode(null)
    setStatus('selecting')
  }

  if (status === 'loading') return <LoadingState />
  if (status === 'selecting') return (
    <PostalCodeSelector onCodeSelected={handleCodeSelected} />
  )
  return (
    <DeliveryDisplay postalCode={postalCode!} onChangeCode={handleChangeCode} />
  )
}
```

### Pattern 2: Geolocation → Reverse Geocode → Postal Code

**What:** Request browser geolocation, send lat/lon to a Next.js Route Handler proxy, which calls Digitransit reverse geocoding API with the subscription key, returns the postal code.

**When to use:** On `PostalCodeSelector` mount when no saved code exists.

**Example:**
```typescript
// src/app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lon = request.nextUrl.searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  const apiKey = process.env.DIGITRANSIT_API_KEY
  const url = `https://api.digitransit.fi/geocoding/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1`

  try {
    const res = await fetch(url, {
      headers: apiKey ? { 'digitransit-subscription-key': apiKey } : {},
    })
    const data = await res.json()
    const postalCode = data?.features?.[0]?.properties?.postalcode
    if (!postalCode) {
      return NextResponse.json({ error: 'No postal code found for location' }, { status: 404 })
    }
    return NextResponse.json({ postalCode })
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 })
  }
}
```

```typescript
// Client usage in PostalCodeSelector.tsx
useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
      if (res.ok) {
        const { postalCode } = await res.json()
        onCodeSelected(postalCode)
      } else {
        setGeoState('denied') // show autocomplete fallback
      }
    },
    () => setGeoState('denied'), // permission denied or error
    { timeout: 10000 }
  )
}, [])
```

### Pattern 3: Fuse.js Fuzzy Search Over Postal Codes

**What:** Create a `Fuse` instance once (on component mount or module load) over the 3,018 postal code entries. Search across all text fields on each keystroke. Limit results for performance.

**When to use:** In the autocomplete combobox `onChange` handler.

**Example:**
```typescript
// Source: fuse.js docs — https://www.fusejs.io/api/options.html
import Fuse from 'fuse.js'
import postalCodes from '../../public/data/postal-codes.json'

// Create index once (module-level for reuse)
const fuse = new Fuse(postalCodes, {
  keys: ['postal_code', 'postal_area_name', 'postal_area_name_sv', 'municipality_name', 'municipality_name_sv'],
  threshold: 0.3,         // 0 = exact, 1 = match anything; 0.3 is reasonable for Finnish names
  includeScore: false,
  minMatchCharLength: 2,
  limit: 50,              // Cap results for rendering performance
})

// In component:
const results = query.length >= 2 ? fuse.search(query).map(r => r.item) : []
```

### Pattern 4: Grouped Combobox Results (Municipality → Postal Areas)

**What:** Group Fuse.js results by `municipality_name` before rendering. Headless UI Combobox v2 does not have a built-in grouping API — implement grouping manually by rendering municipality name headings as non-option elements between `ComboboxOption` elements.

**When to use:** Rendering autocomplete dropdown (POST-04).

**Example:**
```typescript
// Group results by municipality
type PostalEntry = { postal_code: string; postal_area_name: string; municipality_name: string; /* ... */ }

function groupByMunicipality(entries: PostalEntry[]) {
  const map = new Map<string, PostalEntry[]>()
  for (const entry of entries) {
    if (!map.has(entry.municipality_name)) map.set(entry.municipality_name, [])
    map.get(entry.municipality_name)!.push(entry)
  }
  return map
}

// In JSX (inside ComboboxOptions):
{Array.from(groupByMunicipality(results)).map(([municipality, entries]) => (
  <li key={municipality}>
    {/* Municipality heading — not a ComboboxOption, just visual grouping */}
    <div className="px-3 py-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">
      {municipality}
    </div>
    {entries.map((entry) => (
      <ComboboxOption key={entry.postal_code} value={entry}>
        {({ focus }) => (
          <div className={`px-4 py-1.5 text-sm ${focus ? 'bg-stone-100 dark:bg-stone-800' : ''}`}>
            <span className="font-mono text-stone-400 mr-2">{entry.postal_code}</span>
            {entry.postal_area_name}
          </div>
        )}
      </ComboboxOption>
    ))}
  </li>
))}
```

### Pattern 5: localStorage Access in Next.js 15 Client Components

**What:** localStorage is a browser-only API and throws during SSR. In `'use client'` components, it must only be accessed inside `useEffect` (after hydration).

**When to use:** Any read or write to localStorage in a Next.js Client Component.

**Example:**
```typescript
'use client'
import { useState, useEffect } from 'react'

export default function Component() {
  const [value, setValue] = useState<string | null>(null)

  // Read: safe after mount
  useEffect(() => {
    const saved = localStorage.getItem('myKey')
    setValue(saved)
  }, [])

  // Write: safe in event handlers or effects
  const handleSelect = (newValue: string) => {
    localStorage.setItem('myKey', newValue)
    setValue(newValue)
  }

  // Return null during SSR (value is null before hydration)
  if (value === null) return null
  return <div>{value}</div>
}
```

### Pattern 6: Delivery Data Fetch Client-Side via /api/delivery

**What:** Once `PostalCodeGate` has a postal code, fetch delivery data client-side using the existing `/api/delivery` Route Handler. This avoids restructuring the server component tree.

**When to use:** In `DeliveryDisplay` or `PostalCodeGate` after postal code is resolved.

**Example:**
```typescript
'use client'
import { useState, useEffect } from 'react'

export default function DeliveryDisplay({ postalCode }: { postalCode: string }) {
  const [data, setData] = useState<DeliveryData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/delivery?postalCode=${postalCode}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json[0]) // DeliverySchema returns array
      })
      .catch(() => setError('Posti API unavailable'))
  }, [postalCode])

  // ... render loading/error/delivery states
}
```

### Pattern 7: Vercel Deployment Setup

**What:** Connect GitHub repo to Vercel, auto-deploy on push, configure environment variables.

**When to use:** Phase 4 final task.

**Steps:**
1. Push project to GitHub (if not already)
2. Visit vercel.com → "Add New Project" → "Import Git Repository"
3. Vercel auto-detects Next.js; build command: `npm run build` (runs `prebuild` → `generate-postal-codes` → `next build`)
4. Set Environment Variables in Vercel dashboard:
   - `DIGITRANSIT_API_KEY` = `<key from portal-api.digitransit.fi>` (server-only, no `NEXT_PUBLIC_` prefix)
   - `TZ` = `Europe/Helsinki` (server-side date math for Finnish timezone)
5. Deploy → get production URL

### Anti-Patterns to Avoid

- **Accessing localStorage during SSR render:** `localStorage.getItem()` outside `useEffect` throws `ReferenceError: localStorage is not defined` during server render. Always wrap in `useEffect`.
- **Exposing Digitransit API key with NEXT_PUBLIC_ prefix:** `NEXT_PUBLIC_DIGITRANSIT_API_KEY` would bundle the key into client JavaScript. Keep it as `DIGITRANSIT_API_KEY` (server-only) and proxy through a Route Handler.
- **Calling geolocation without HTTPS:** `navigator.geolocation` is blocked on insecure origins. On localhost (treated as secure context) it works; on production it requires HTTPS — Vercel provides HTTPS automatically.
- **Nominatim for autocomplete use:** Nominatim's usage policy explicitly forbids autocomplete. The public Nominatim instance bans clients that use it for autocomplete. Use Fuse.js with local data instead.
- **Loading all 3,018 postal codes on every keystroke:** Create the `Fuse` instance once at module level or in a `useMemo` — not inside the `onChange` handler. Building the Fuse index is the expensive operation.
- **Using `dynamic import` with `ssr: false` for PostalCodeGate without handling the loading state:** `dynamic(() => import('./PostalCodeGate'), { ssr: false })` suppresses hydration mismatch warnings but shows blank content until hydration. Prefer showing a loading skeleton during the `status === 'loading'` phase instead.
- **Not handling geolocation timeout:** `navigator.geolocation.getCurrentPosition` can hang indefinitely on some browsers if the user ignores the permission prompt. Always pass `{ timeout: 10000 }` as the options parameter.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible combobox with keyboard navigation | Custom `<input>` + `<ul>` with manual key handlers | `@headlessui/react` Combobox | Arrow keys, Enter, Escape, Home/End, aria-activedescendant, screen reader announcements — 200+ lines of accessibility work |
| Fuzzy text search across 4 fields | Custom substring matching loops | Fuse.js 7.1.0 | Handles typos, partial matches, unicode normalization, multi-field weighting; Finnish postal names have ä/ö/å that users may type without diacritics |
| Geolocation → postal code mapping | Maintain your own geocoding dataset | Digitransit Geocoding API (proxied) | Finland-specific data from National Land Survey + Population Register; returns `postalcode` directly |
| API key protection in browser | Obscure key in client JS | Next.js Route Handler proxy | Server-side env vars are never in client bundle; Route Handler is the correct Next.js pattern for this (established in Phase 2 with Posti proxy) |

**Key insight:** The autocomplete problem looks simple but has significant hidden complexity: keyboard accessibility, focus management, screen reader support, and unicode-aware search. Headless UI + Fuse.js handle all of this; the project only needs to supply data and styling.

---

## Common Pitfalls

### Pitfall 1: Hydration Mismatch with localStorage

**What goes wrong:** Component renders null or loading state on server, then immediately shows postal code content on client. React logs hydration mismatch warnings or worse — flickers on first paint.

**Why it happens:** The server cannot know the client's localStorage value, so it renders without it. The client hydrates with a different value.

**How to avoid:** Initialize postal code state as `null` in `useState`. Render a neutral loading/skeleton state when `null`. Only show content after the `useEffect` fires and reads localStorage. This ensures server HTML and initial client HTML are identical (both show loading state).

**Warning signs:** React console warning `Hydration failed because the server rendered HTML didn't match the client.`

### Pitfall 2: Geolocation Permission Is Sticky

**What goes wrong:** During development testing, a user grants or denies permission once. The browser remembers. Testing the "denied" flow requires manually resetting permissions in browser DevTools.

**Why it happens:** Browsers cache geolocation permission decisions per origin.

**How to avoid:** Test permission denial by going to browser site settings and resetting location permission. Document this in the plan's verification steps. The app must handle both states gracefully.

**Warning signs:** Cannot repro the "autocomplete fallback" flow after testing geolocation once.

### Pitfall 3: Digitransit API Key Registration Delay

**What goes wrong:** Digitransit's portal (`portal-api.digitransit.fi`) requires registration. If the account isn't created before development, the geocode proxy fails with 401/403.

**Why it happens:** Digitransit requires subscription key since April 2023. The API returns responses without a key during grace periods, but rate limits are enforced.

**How to avoid:** Register for a Digitransit subscription key as the first task of this phase. Alternatively, implement Nominatim as a fallback for reverse geocoding (one-time call, not autocomplete — acceptable under their policy) so development can proceed without the Digitransit key.

**Warning signs:** `/api/geocode` returns 401 or empty features array in production.

### Pitfall 4: Postal Codes JSON Bundle Size

**What goes wrong:** Importing `postal-codes.json` (3,018 entries, ~250KB) as a static import in a client component bundles it into the JavaScript sent to every user.

**Why it happens:** Client component imports are included in the client bundle. 250KB is non-trivial on slow mobile connections.

**How to avoid:** Two options: (1) use `dynamic import` inside the component so it's code-split and lazy-loaded when the autocomplete UI appears; (2) load it from `/data/postal-codes.json` via `fetch` on the client (the file is already in `/public/data/`). Option 2 is simpler and keeps the bundle lean, with the tradeoff of a network request on first autocomplete use (small: the JSON is on the same origin).

**Warning signs:** Lighthouse or Vercel analytics showing large first-load JS bundle; slow FCP on mobile.

### Pitfall 5: Geolocation Postal Code Not in postal-codes.json

**What goes wrong:** Digitransit returns a postal code that doesn't exist in `postal-codes.json` (e.g., P.O. Box codes, new codes added after the XLSX was processed). The Posti API may also return `[]` for such codes (established in Phase 2 decision).

**Why it happens:** The postal codes dataset is from Statistics Finland XLSX and may not cover all postal codes in Digitransit's data.

**How to avoid:** After reverse geocoding, validate the returned code against `postal-codes.json` before accepting it. If not found, treat as if geolocation failed and show the autocomplete fallback. The existing Posti API empty-array check (Phase 2: `parsed.data.length === 0` returns error) provides a second guard.

**Warning signs:** Delivery display shows "Unexpected Posti API response" for some geolocated users.

### Pitfall 6: Vercel Build Runs prebuild Script

**What goes wrong:** `npm run generate-postal-codes` (prebuild) attempts to download the Statistics Finland XLSX during Vercel build. If the URL changes or the network is unavailable, the build fails.

**Why it happens:** The `prebuild` npm hook runs before `next build`. The script fetches an XLSX from `stat.fi`.

**How to avoid:** This is NOT a problem in practice because `public/data/postal-codes.json` is committed to the repo (Phase 1 decision). The script runs and immediately finds the file exists... actually, the script always regenerates it. The mitigation: add a `--skip-if-exists` flag or verify the script won't fail if `stat.fi` is temporarily slow. More importantly: since the JSON is committed, consider making the Vercel build command `next build` directly (skipping the prebuild) by customizing the build command in Vercel project settings. Alternatively, add a try/catch in the script so it uses the committed file as fallback if the download fails.

**Warning signs:** Vercel build fails with a network error during postal code generation.

---

## Code Examples

Verified patterns from official sources:

### Headless UI Combobox v2 — Basic Structure

```typescript
// Source: https://headlessui.com/react/combobox (fetched 2026-03-03)
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import { useState } from 'react'

export function PostalCodeCombobox({ onSelect }: { onSelect: (code: string) => void }) {
  const [query, setQuery] = useState('')
  const results = query.length >= 2 ? fuse.search(query).map(r => r.item) : []

  return (
    <Combobox value={null} onChange={(entry) => entry && onSelect(entry.postal_code)}>
      <ComboboxInput
        className="w-full border rounded px-3 py-2"
        placeholder="Search postal code or area..."
        displayValue={() => query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ComboboxOptions anchor="bottom" className="mt-1 bg-white shadow rounded max-h-64 overflow-auto">
        {/* Grouped rendering — see Pattern 4 */}
      </ComboboxOptions>
    </Combobox>
  )
}
```

### Digitransit Reverse Geocode API

```
GET https://api.digitransit.fi/geocoding/v1/reverse?point.lat=60.170278&point.lon=24.9369448&size=1
Headers: digitransit-subscription-key: <YOUR_KEY>

Response:
{
  "features": [{
    "properties": {
      "name": "Mannerheimintie 30",
      "postalcode": "00100",
      "label": "Mannerheimintie 30, Helsinki",
      "locality": "Helsinki"
    }
  }]
}
```

### localStorage Postal Code Persistence

```typescript
// Source: Next.js docs — Client Components and browser APIs
const STORAGE_KEY = 'posti-days:postalCode'

// Read (in useEffect only)
const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

// Write
localStorage.setItem(STORAGE_KEY, postalCode)

// Clear
localStorage.removeItem(STORAGE_KEY)
```

### Fuse.js Multi-Field Search

```typescript
// Source: https://www.fusejs.io/api/options.html
import Fuse from 'fuse.js'

const fuse = new Fuse(postalCodes, {
  keys: [
    { name: 'postal_code', weight: 2 },      // Exact code searches should score highest
    { name: 'postal_area_name', weight: 1 },
    { name: 'postal_area_name_sv', weight: 1 },
    { name: 'municipality_name', weight: 1 },
    { name: 'municipality_name_sv', weight: 0.5 },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
})
```

### Vercel Environment Variables for Next.js

```bash
# .env.local (local development — git-ignored)
DIGITRANSIT_API_KEY=your_key_here
TZ=Europe/Helsinki

# Vercel dashboard: Settings → Environment Variables
# DIGITRANSIT_API_KEY — Production + Preview + Development
# TZ — Production + Preview (set to Europe/Helsinki)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Headless UI v1 with `Combobox.Input`, `Combobox.Options` | Headless UI v2 with named exports `ComboboxInput`, `ComboboxOptions` | v2.0 (2024) | Import style changed; v2 required for React 19 support |
| Nominatim without key for Finnish geocoding | Digitransit with subscription key (since April 2023) | 03.04.2023 | Digitransit now requires registration at portal-api.digitransit.fi |
| Vercel function timeout 10s default | Vercel function timeout 10s (Hobby), configurable to 60s | — | No change needed; `/api/geocode` and `/api/delivery` calls are fast |
| `unstable_noStore()` for dynamic server components | `connection()` from `next/server` | Next.js 15.0.0 | Already handled in Phase 3; unchanged |

**Deprecated/outdated:**
- Headless UI v1 `Combobox.Input` dot-notation syntax: Replaced by named exports in v2. Use `import { ComboboxInput } from '@headlessui/react'`.
- Nominatim for any autocomplete use: Policy-forbidden; using it for autocomplete risks IP ban.

---

## Open Questions

1. **Digitransit API key requirement**
   - What we know: Digitransit requires a subscription key since April 2023; keys are free from `portal-api.digitransit.fi`; rate limits are enforced for misuse but reasonable for normal use.
   - What's unclear: Whether the API still works at all without a key (some reports suggest it works with degraded rate limits); exact registration flow.
   - Recommendation: Register for a key immediately at the start of this phase. If registration takes time, implement Nominatim as a fallback for the reverse geocode step (one call per session is compliant with Nominatim's policy).

2. **Postal codes.json bundle size strategy**
   - What we know: File is ~250KB, 3,018 entries; file is already in `/public/data/` and served as a static asset.
   - What's unclear: Whether to import it as a static module (bundle it) or fetch it from `/data/postal-codes.json` (lazy load, network request).
   - Recommendation: Fetch from `/data/postal-codes.json` on first autocomplete open. The file is on the same origin (Vercel CDN) so it's fast and doesn't inflate the initial JS bundle. Cache in module-level variable after first fetch.

3. **Server timezone on Vercel (TZ environment variable)**
   - What we know: Phase 3 used local date methods (`getFullYear`, `getMonth`, `getDate`) to avoid UTC drift. The server default on Vercel is UTC. Finland is UTC+2 (UTC+3 in summer).
   - What's unclear: Whether `TZ=Europe/Helsinki` works correctly for Next.js server components on Vercel.
   - Recommendation: Set `TZ=Europe/Helsinki` in Vercel environment variables as part of deployment. This is a known working pattern. Verify: the Phase 3 date logic already uses local date methods, so even without this env var it works correctly since it reads local time — this is LOW risk.

4. **Architecture: full client-side fetch vs. URL-param-driven server re-render**
   - What we know: Current `page.tsx` is a Server Component. Adding client-state-driven delivery fetching requires either (a) a client component that calls `/api/delivery` directly, or (b) pushing the postal code to the URL (`?postalCode=00100`) and having the Server Component read `searchParams`.
   - What's unclear: Option B would preserve SSR benefits but adds URL routing complexity; option A is simpler but requires more client-side code.
   - Recommendation: Use option A (client-side fetch via `PostalCodeGate`). The app is simple enough that SSR of the delivery data is not critical. The delivery status changes daily, not millisecond-to-millisecond. The simpler architecture is more maintainable.

---

## Validation Architecture

> Skipped — `workflow.nyquist_validation` is not enabled in `.planning/config.json`.

---

## Sources

### Primary (HIGH confidence)

- Headless UI v2 official docs — https://headlessui.com/react/combobox — fetched 2026-03-03. Confirmed v2.2.9 is current, React 19 compatible, named exports pattern, virtual scroll support, basic Combobox structure.
- Digitransit Geocoding API docs — https://digitransit.fi/en/developers/apis/3-geocoding-api/address-lookup/ — fetched 2026-03-03. Confirmed endpoint `api.digitransit.fi/geocoding/v1/reverse`, `postalcode` field in response, `point.lat`/`point.lon` parameters, subscription key header `digitransit-subscription-key`.
- Nominatim Usage Policy — https://operations.osmfoundation.org/policies/nominatim/ — fetched 2026-03-03. Confirmed: autocomplete is explicitly forbidden; one-time user-triggered reverse geocode is acceptable; 1 req/sec limit.
- Nominatim Reverse API — https://nominatim.org/release-docs/latest/api/Reverse/ — fetched 2026-03-03. Confirmed: `postcode` field in address response, `zoom` parameter for detail level.
- Vercel Hobby Plan docs — https://vercel.com/docs/plans/hobby — fetched 2026-03-03. Confirmed: free, 1M function invocations, 60s max function duration (configurable), 6,000 build minutes, 100 deployments/day.
- Fuse.js npm — https://www.npmjs.com/package/fuse.js — confirmed version 7.1.0 current, widely used (3,101 dependents).
- Next.js docs — server and client components — https://nextjs.org/docs/app/getting-started/server-and-client-components — confirms `'use client'` directive pattern, browser API access, `useEffect` requirement for localStorage.

### Secondary (MEDIUM confidence)

- Digitransit API key requirement since April 2023 — confirmed via WebSearch results citing official announcement; portal URL `portal-api.digitransit.fi` confirmed. No rate limits for normal use post-enforcement date.
- `@headlessui/react` v2.2.9 React 19 compatibility — confirmed via GitHub releases page (v2.2.1 addressed React 19 TanStack Virtual warnings, subsequent fixes non-breaking).
- Fuse.js search performance for 4,500 items: ~7ms first search, <1.5ms subsequent — cited from microfuzz comparison benchmark; applicable to 3,018 items.
- Vercel prebuild script execution — confirmed by WebSearch; npm `prebuild` hook runs before `npm run build` on Vercel.

### Tertiary (LOW confidence)

- Digitransit API still responding without key (degraded rate limits) — single source, unverified. Do not rely on this; register for a key.
- TZ=Europe/Helsinki working correctly on Vercel — common pattern per community reports but not in official Vercel docs. Low risk since Phase 3 date logic uses local methods.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from official docs/npm; versions confirmed current as of 2026-03-03
- Architecture: HIGH — Next.js server/client component patterns verified from official docs; localStorage `useEffect` pattern confirmed; geolocation proxy pattern confirmed
- Pitfalls: HIGH — hydration mismatch, localStorage SSR, geolocation permission stickiness are all well-documented Next.js/browser patterns; Nominatim autocomplete ban is from official policy page

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable libraries; re-verify Digitransit key requirements if encountering auth errors)
