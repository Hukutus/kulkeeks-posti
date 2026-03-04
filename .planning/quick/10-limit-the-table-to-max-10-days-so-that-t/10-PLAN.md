---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/delivery-utils.ts
  - src/lib/delivery-utils.test.ts
  - src/components/DeliveryDisplay.tsx
autonomous: true
requirements: [QUICK-10]
must_haves:
  truths:
    - "The week table never shows more than 10 rows on any device"
    - "The date range starts from today and shows up to 10 consecutive days"
    - "If the API returns fewer than 10 future days, all are shown"
  artifacts:
    - path: "src/lib/delivery-utils.ts"
      provides: "getDateRange with optional maxDays parameter"
      contains: "maxDays"
    - path: "src/lib/delivery-utils.test.ts"
      provides: "Tests for maxDays cap behavior"
      contains: "maxDays"
    - path: "src/components/DeliveryDisplay.tsx"
      provides: "Passes maxDays=10 to getDateRange"
      contains: "10"
  key_links:
    - from: "src/components/DeliveryDisplay.tsx"
      to: "src/lib/delivery-utils.ts"
      via: "getDateRange(todayISO, lastDate, 10)"
      pattern: "getDateRange.*10"
---

<objective>
Limit the upcoming deliveries table to a maximum of 10 rows so the page does not scroll on phone screens.

Purpose: The Posti API can return delivery dates spanning 2+ weeks. Showing all of them creates a long table that forces vertical scrolling on mobile devices, degrading the compact single-screen experience.

Output: `getDateRange` accepts an optional `maxDays` cap, DeliveryDisplay passes `10`, tests verify the cap.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/delivery-utils.ts
@src/lib/delivery-utils.test.ts
@src/components/DeliveryDisplay.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add maxDays parameter to getDateRange and update tests</name>
  <files>src/lib/delivery-utils.ts, src/lib/delivery-utils.test.ts</files>
  <behavior>
    - getDateRange('2026-03-04', '2026-03-20') returns 17 days (existing behavior unchanged when no maxDays)
    - getDateRange('2026-03-04', '2026-03-20', 10) returns exactly 10 days (2026-03-04 through 2026-03-13)
    - getDateRange('2026-03-04', '2026-03-06', 10) returns 3 days (fewer than cap, all shown)
    - getDateRange('2026-03-04', '2026-03-04', 10) returns 1 day (single day, under cap)
    - getDateRange('2026-03-04', '2026-03-03', 10) returns [2026-03-04] (end before start fallback unchanged)
    - All existing tests continue to pass (no maxDays = no cap)
  </behavior>
  <action>
    1. In src/lib/delivery-utils.ts, add an optional third parameter `maxDays?: number` to `getDateRange`.
    2. After the while loop that builds the dates array, if `maxDays` is provided and `dates.length > maxDays`, slice to `dates.slice(0, maxDays)`.
    3. In src/lib/delivery-utils.test.ts, add a new `describe('getDateRange with maxDays')` block with tests matching the behavior specs above.
    4. Run tests to confirm all pass.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx tsx --test src/lib/delivery-utils.test.ts</automated>
  </verify>
  <done>getDateRange accepts optional maxDays parameter that caps the returned array length. All existing tests pass, new tests for maxDays pass.</done>
</task>

<task type="auto">
  <name>Task 2: Pass maxDays=10 in DeliveryDisplay component</name>
  <files>src/components/DeliveryDisplay.tsx</files>
  <action>
    In src/components/DeliveryDisplay.tsx, on line 113 where `getDateRange(todayISO, lastDate)` is called, change it to `getDateRange(todayISO, lastDate, 10)` so the table never renders more than 10 rows.

    No other changes needed. The rest of the component (filterDeliveries, weekDeliverySet, rendering) works unchanged since they operate on whatever dateRange contains.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npm run build</automated>
  </verify>
  <done>DeliveryDisplay passes maxDays=10 to getDateRange. Build succeeds. The table will show at most 10 rows regardless of how many dates the Posti API returns.</done>
</task>

</tasks>

<verification>
- All existing tests pass: `npx tsx --test src/lib/delivery-utils.test.ts`
- New maxDays tests pass
- Build succeeds: `npm run build`
- In DeliveryDisplay.tsx, getDateRange is called with third argument 10
</verification>

<success_criteria>
- The getDateRange utility supports an optional maxDays cap
- DeliveryDisplay limits the table to 10 days maximum
- All tests pass, build succeeds
- No scrolling needed on phone screens for the delivery table
</success_criteria>

<output>
After completion, create `.planning/quick/10-limit-the-table-to-max-10-days-so-that-t/10-SUMMARY.md`
</output>
