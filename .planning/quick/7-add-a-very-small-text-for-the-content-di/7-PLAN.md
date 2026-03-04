---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/DeliveryDisplay.tsx
autonomous: true
requirements: [QUICK-7]
must_haves:
  truths:
    - "A small text label showing the dialect name appears below the question in all states (loading, error, success)"
    - "The dialect label is visually subtle and does not compete with the question or answer"
    - "The label is accessible (readable by screen readers)"
  artifacts:
    - path: "src/components/DeliveryDisplay.tsx"
      provides: "Dialect name label under question text"
      contains: "dialect.dialect"
  key_links:
    - from: "src/components/DeliveryDisplay.tsx"
      to: "content.json"
      via: "dialect object from content.dialects"
      pattern: "dialect\\.dialect"
---

<objective>
Add a very small text label showing the content dialect name (e.g., "Stadin slangi") under the question text in the DeliveryDisplay component.

Purpose: Give users context about which Finnish dialect variant they are seeing, adding a fun educational element.
Output: Updated DeliveryDisplay.tsx with dialect label in all three render states.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/DeliveryDisplay.tsx
@content.json

<interfaces>
<!-- The dialect object already has the `dialect` field with the dialect name -->
From content.json, each dialect entry:
```typescript
type Dialect = {
  dialect: string   // e.g., "Stadin slangi", "Savon murre"
  region: string    // e.g., "Pääkaupunkiseutu"
  question: string  // e.g., "Kulkeeks posti?"
  yes: string
  no: string
  comment: string | null
}
```

The `dialect` state variable in DeliveryDisplay.tsx already holds one random Dialect object.
The `dialect.dialect` field contains the name to display.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dialect name label under question in all render states</name>
  <files>src/components/DeliveryDisplay.tsx</files>
  <action>
In DeliveryDisplay.tsx, add a small dialect name label immediately after the question paragraph in all three render branches (loading, error, and success).

The label should render `dialect.dialect` (the dialect name string like "Stadin slangi") and optionally the region in parentheses.

Add the following element right after each `{dialect.question}` paragraph:

```tsx
<p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
  — {dialect.dialect}
</p>
```

There are 3 locations to update:

1. **Loading state** (around line 71): After the `<p>` containing `{dialect.question}`, add the dialect label paragraph.

2. **Error state** (around line 84): After the `<p>` containing `{dialect.question}`, add the dialect label paragraph.

3. **Success state** (around line 117): After the `<p>` containing `{dialect.question}`, add the dialect label paragraph. This one is inside the `role="status"` live region — the label should be placed after the question `<p>` but before the answer `<p>`.

Style details:
- Use `text-xs` for very small text size
- Use `text-stone-400 dark:text-stone-500` for subtle coloring that does not compete with the question or answer
- Use `mt-1` for a tiny gap between question and label
- Prefix with an em dash for visual elegance: `— {dialect.dialect}`
- The font should NOT use `font-handwriting` — use the default body font to visually distinguish it from the dialect content

Accessibility: The text is regular DOM content so screen readers will read it naturally. No additional ARIA attributes needed since it is decorative/informational context.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next lint && npx tsc --noEmit</automated>
  </verify>
  <done>All three render states (loading, error, success) show the dialect name in small text below the question. The label is visually subtle (text-xs, muted color) and accessible.</done>
</task>

</tasks>

<verification>
- `npx next lint` passes with no errors
- `npx tsc --noEmit` passes with no type errors
- Visual check: dialect name appears below question text in small, muted styling
</verification>

<success_criteria>
- The dialect name (e.g., "Stadin slangi", "Savon murre") is displayed as very small text under the question in all view states
- The label does not visually compete with the question or the yes/no answer
- No lint or type errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/7-add-a-very-small-text-for-the-content-di/7-SUMMARY.md`
</output>
