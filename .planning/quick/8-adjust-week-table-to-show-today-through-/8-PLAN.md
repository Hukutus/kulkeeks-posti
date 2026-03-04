---
phase: quick-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/delivery-utils.ts
  - src/lib/delivery-utils.test.ts
  - src/components/DeliveryDisplay.tsx
  - src/lib/get-delivery-dates.ts
  - src/app/api/delivery/route.ts
  - messages/en.json
  - messages/fi.json
  - messages/sv.json
  - messages/se.json
autonomous: true
requirements: [QUICK-8]

must_haves:
  truths:
    - "Week table starts with today, not Monday"
    - "Week table ends with the last date from the Posti API response"
    - "API responses are cached for 1 day (86400 seconds)"
    - "Week title reflects the new date range semantics"
  artifacts:
    - path: "src/lib/delivery-utils.ts"
      provides: "getDateRange function replacing getCurrentWeekISO"
      exports: ["getDateRange", "getTodayISO", "filterDeliveries", "isDeliveryDay"]
    - path: "src/lib/delivery-utils.test.ts"
      provides: "Tests for getDateRange"
      contains: "getDateRange"
    - path: "src/components/DeliveryDisplay.tsx"
      provides: "Updated week table using today-to-last-date range"
    - path: "src/lib/get-delivery-dates.ts"
      provides: "Cached fetch with next.revalidate"
    - path: "src/app/api/delivery/route.ts"
      provides: "Route handler with revalidation caching"
  key_links:
    - from: "src/components/DeliveryDisplay.tsx"
      to: "src/lib/delivery-utils.ts"
      via: "import getDateRange"
      pattern: "getDateRange"
    - from: "src/app/api/delivery/route.ts"
      to: "Posti API"
      via: "fetch with next.revalidate: 86400"
      pattern: "revalidate.*86400"
---

<objective>
Adjust the week table to show today through the last API date (instead of Mon-Sun of the current week), and cache Posti API responses for 1 day.

Purpose: The Posti API returns the next 5 postage dates, not the current week. The week table should reflect the actual date range from the API. API data only changes at midnight, so caching for 1 day avoids unnecessary requests.

Output: Updated delivery display, utility functions, API route with caching, and i18n keys.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/delivery-utils.ts
@src/lib/delivery-utils.test.ts
@src/components/DeliveryDisplay.tsx
@src/lib/get-delivery-dates.ts
@src/app/api/delivery/route.ts
@messages/en.json
@messages/fi.json
@messages/sv.json
@messages/se.json
</context>

<interfaces>
<!-- Key types and contracts the executor needs. -->

From src/lib/delivery-utils.ts (current exports to replace/update):
```typescript
export function getTodayISO(): string;           // KEEP as-is
export function getCurrentWeekISO(): string[];   // REPLACE with getDateRange
export function filterWeekDeliveries(deliveryDates: string[], weekISO: string[]): string[];  // REPLACE with filterDeliveries
export function isDeliveryDay(deliveryDates: string[], todayISO: string): boolean;           // KEEP as-is
```

From src/lib/get-delivery-dates.ts:
```typescript
export const DeliverySchema = z.array(z.object({ postalCode: z.string(), deliveryDates: z.array(z.string()) }));
export type DeliveryData = z.infer<typeof DeliverySchema>[number];
export async function getDeliveryDates(postalCode: string): Promise<{ success: true; data: DeliveryData } | { success: false; error: string }>;
```

DeliveryDisplay.tsx currently uses:
- `getTodayISO()` - get today's date
- `getCurrentWeekISO()` - get Mon-Sun dates (to be replaced)
- `filterWeekDeliveries(deliveryDates, weekISO)` - filter API dates to range (to be replaced)
- `isDeliveryDay(deliveryDates, todayISO)` - check if today is delivery day
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Replace week utilities with date-range utilities and add API caching</name>
  <files>src/lib/delivery-utils.ts, src/lib/delivery-utils.test.ts, src/lib/get-delivery-dates.ts, src/app/api/delivery/route.ts</files>
  <behavior>
    - getDateRange(todayISO, lastDate): returns consecutive ISO date strings from todayISO through lastDate inclusive
    - getDateRange('2026-03-04', '2026-03-06') returns ['2026-03-04', '2026-03-05', '2026-03-06']
    - getDateRange('2026-03-04', '2026-03-04') returns ['2026-03-04'] (single day)
    - getDateRange('2026-03-04', '2026-03-03') returns ['2026-03-04'] (lastDate before today falls back to just today)
    - filterDeliveries(deliveryDates, dateRange): returns only dates from deliveryDates that are in dateRange (same logic as filterWeekDeliveries but renamed for clarity)
  </behavior>
  <action>
    1. In `src/lib/delivery-utils.ts`:
       - Add new function `getDateRange(startISO: string, endISO: string): string[]` that generates consecutive ISO dates from start to end (inclusive). If end is before start, return just [startISO].
       - Rename `filterWeekDeliveries` to `filterDeliveries` (same logic, just clearer name since it's no longer week-specific). Keep the old name as a re-export alias for backward compatibility during this change, or just update all consumers in Task 2.
       - KEEP `getTodayISO()` and `isDeliveryDay()` unchanged.
       - REMOVE `getCurrentWeekISO()` (no longer needed — the date range is computed from today + API data).

    2. In `src/lib/delivery-utils.test.ts`:
       - Remove all `getCurrentWeekISO` tests.
       - Add tests for `getDateRange` per the behavior spec above.
       - Rename `filterWeekDeliveries` tests to `filterDeliveries` (keep same test logic).
       - Keep `getTodayISO` and `isDeliveryDay` tests as-is.

    3. In `src/lib/get-delivery-dates.ts`:
       - Change `{ cache: 'no-store' }` to `{ next: { revalidate: 86400 } }` on the fetch call. This tells Next.js to cache the response for 24 hours (86400 seconds). Remove the `cache: 'no-store'` option entirely.

    4. In `src/app/api/delivery/route.ts`:
       - Remove `export const dynamic = 'force-dynamic'` (this prevents caching).
       - Add `export const revalidate = 86400` to enable ISR-style caching for this route handler. This means Next.js will serve cached responses for up to 24 hours before revalidating.
       - The upstream Posti API fetch inside the handler will also benefit from the `next.revalidate` set in get-delivery-dates.ts.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx tsx --test src/lib/delivery-utils.test.ts src/lib/get-delivery-dates.test.ts</automated>
  </verify>
  <done>getDateRange generates correct date ranges, filterDeliveries filters correctly, getCurrentWeekISO is removed, API caching is set to 86400 seconds in both the fetch call and route handler.</done>
</task>

<task type="auto">
  <name>Task 2: Update DeliveryDisplay to use today-to-last-date range and update i18n keys</name>
  <files>src/components/DeliveryDisplay.tsx, messages/en.json, messages/fi.json, messages/sv.json, messages/se.json</files>
  <action>
    1. In all 4 message files, update the `Delivery.weekTitle` key:
       - en.json: "This week" -> "Upcoming"
       - fi.json: "Tama viikko" -> "Tulossa"
       - sv.json: "Denna vecka" -> "Kommande"
       - se.json: "Dan vahku" -> "Boahttime"

    2. In `src/components/DeliveryDisplay.tsx`:
       - Update imports: replace `getCurrentWeekISO` and `filterWeekDeliveries` with `getDateRange` and `filterDeliveries` from `@/lib/delivery-utils`.
       - Remove the line `const weekISO = getCurrentWeekISO()`.
       - After destructuring `deliveryDates` from `deliveryData`, compute the date range:
         ```typescript
         const lastDate = deliveryDates.length > 0
           ? deliveryDates[deliveryDates.length - 1]
           : todayISO
         const dateRange = getDateRange(todayISO, lastDate)
         ```
       - Replace `filterWeekDeliveries(deliveryDates, weekISO)` with `filterDeliveries(deliveryDates, dateRange)`.
       - Replace `weekDeliverySet` to use the new filtered result.
       - In the JSX week table section, replace `weekISO.map((iso) => ...)` with `dateRange.map((iso) => ...)`.
       - The rest of the rendering logic (today highlight, delivery dot, date label, sr-only text) stays the same.
       - The section `aria-labelledby` and heading structure stay the same (the h2 still uses `t('weekTitle')` which now says "Upcoming" etc).

    3. Ensure WCAG 2.2 AA compliance is maintained: the existing aria-live region, sr-only labels, and semantic structure are preserved.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build</automated>
  </verify>
  <done>Week table shows dates from today through the last API date. Translation keys updated in all 4 locales. Build succeeds with no errors. Accessibility attributes preserved.</done>
</task>

</tasks>

<verification>
1. `npx tsx --test src/lib/delivery-utils.test.ts src/lib/get-delivery-dates.test.ts` - all tests pass
2. `npx next build` - build succeeds
3. `npx next dev` then visit localhost:3000 - week table shows today through last API date, not Mon-Sun
</verification>

<success_criteria>
- Week table starts with today's date, ends with the last date from the Posti API
- No hardcoded Mon-Sun week structure
- Posti API responses cached for 24 hours (86400s)
- All 4 locale files updated with new weekTitle
- All existing tests updated and passing
- Build succeeds
- WCAG 2.2 AA accessibility maintained
</success_criteria>

<output>
After completion, create `.planning/quick/8-adjust-week-table-to-show-today-through-/8-SUMMARY.md`
</output>
