---
phase: quick
plan: 5
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/[locale]/globals.css
  - src/app/[locale]/page.tsx
  - src/app/[locale]/layout.tsx
  - src/components/DeliveryDisplay.tsx
  - src/components/PostalCodeSelector.tsx
  - src/components/PostalCodeGate.tsx
  - src/components/SettingsBar.tsx
  - messages/en.json
  - messages/fi.json
  - messages/sv.json
  - messages/se.json
autonomous: true
requirements: [WCAG-AA]

must_haves:
  truths:
    - "All text meets WCAG 2.2 AA contrast ratios (4.5:1 normal, 3:1 large) in both light and dark mode"
    - "All interactive elements have visible focus indicators when navigated via keyboard"
    - "All interactive elements meet 24x24 CSS pixel minimum touch target size"
    - "Screen readers announce page structure, delivery status, and dynamic content changes"
    - "Skip navigation link is present and functional"
    - "Proper heading hierarchy exists (h1 visible on page)"
    - "Animations respect prefers-reduced-motion"
  artifacts:
    - path: "src/components/DeliveryDisplay.tsx"
      provides: "Accessible delivery display with live regions, heading hierarchy, sr-only text"
    - path: "src/components/SettingsBar.tsx"
      provides: "Touch-target-sized interactive controls with focus indicators"
    - path: "src/components/PostalCodeSelector.tsx"
      provides: "Accessible combobox with loading status and focus indicators"
    - path: "src/app/[locale]/globals.css"
      provides: "Skip nav styles, focus-visible utilities, reduced-motion overrides"
  key_links:
    - from: "src/app/[locale]/page.tsx"
      to: "src/components/PostalCodeGate.tsx"
      via: "Skip nav target and h1 heading"
      pattern: "id=\"main-content\""
    - from: "src/components/DeliveryDisplay.tsx"
      to: "screen readers"
      via: "aria-live region for delivery status"
      pattern: "aria-live|role=\"status\""
---

<objective>
Make the Posti Days page fully WCAG 2.2 AA accessible.

Purpose: Ensure the app is usable by people with disabilities -- keyboard-only users, screen reader users, users with low vision, and users with motion sensitivities.

Output: All components updated with proper contrast, focus indicators, touch targets, ARIA attributes, heading hierarchy, skip navigation, and reduced motion support.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/app/[locale]/globals.css
@src/app/[locale]/layout.tsx
@src/app/[locale]/page.tsx
@src/components/DeliveryDisplay.tsx
@src/components/PostalCodeSelector.tsx
@src/components/PostalCodeGate.tsx
@src/components/SettingsBar.tsx
@messages/en.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix color contrast, focus indicators, touch targets, and reduced motion</name>
  <files>
    src/app/[locale]/globals.css
    src/components/DeliveryDisplay.tsx
    src/components/PostalCodeSelector.tsx
    src/components/SettingsBar.tsx
  </files>
  <action>
**Color contrast fixes (all must meet 4.5:1 for normal text, 3:1 for large text):**

In DeliveryDisplay.tsx:
- Replace `text-stone-400 dark:text-stone-500` on "change code" button with `text-stone-500 dark:text-stone-400` and hover states `hover:text-stone-700 dark:hover:text-stone-200`
- Replace `text-stone-400 dark:text-stone-500` on postal code label div with `text-stone-500 dark:text-stone-400`
- Replace `text-stone-400 dark:text-stone-500` on week "Today" badge with `text-stone-500 dark:text-stone-400`
- Replace `text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500` on week title h2 with `text-stone-500 dark:text-stone-400`
- For non-delivery day labels: replace `text-stone-400 dark:text-stone-500` with `text-stone-500 dark:text-stone-400`
- For error detail text: replace `text-stone-500 dark:text-stone-400` -- this is acceptable, keep as is
- Loading state "..." text: replace `text-stone-300 dark:text-stone-700` with `text-stone-400 dark:text-stone-500` (decorative, but still improve)

In PostalCodeSelector.tsx:
- Replace `text-stone-400 dark:text-stone-500` on "search manually" and "try again"/"use location" buttons with `text-stone-500 dark:text-stone-400` and hover `hover:text-stone-700 dark:hover:text-stone-200`
- Replace `text-stone-500 dark:text-stone-400` on location status text -- acceptable, keep
- Municipality group header: replace `text-stone-500` with `text-stone-600 dark:text-stone-400`

In SettingsBar.tsx:
- Replace base `text-stone-400 dark:text-stone-500` on container div with `text-stone-500 dark:text-stone-400`
- Inactive locale buttons: add `hover:text-stone-700 dark:hover:text-stone-200`
- Active locale: `text-stone-700 dark:text-stone-200` (was `text-stone-600 dark:text-stone-300`)

**Focus indicators (all interactive elements):**

Add to globals.css a focus-visible utility approach. Since this project uses Tailwind v4, add focus-visible styles directly via Tailwind classes on each interactive element rather than global overrides.

On ALL buttons in DeliveryDisplay.tsx, PostalCodeSelector.tsx, SettingsBar.tsx:
- Add `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:focus-visible:outline-stone-400 focus-visible:rounded-sm` (use `focus-visible:` not `focus:` to avoid showing on mouse click)
- On the ComboboxInput: already has `focus:ring-2` -- change to `focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400` and remove the existing `focus:outline-none focus:ring-2 focus:ring-stone-400`
- On the GitHub link in SettingsBar: add the same focus-visible outline classes

**Touch targets (minimum 24x24 CSS pixels):**

In SettingsBar.tsx:
- Each locale button: add `min-h-[44px] min-w-[44px] inline-flex items-center justify-center` (44px is better than 24px minimum for mobile usability, and the WCAG 2.2 target size enhanced is 44px)
- Actually, 44px buttons would look too large in the compact settings bar. Instead: add `p-2` (8px each side) to each button to ensure at least 24x24 effective target. The text is ~14px so with 8px padding each side that gives ~30px which exceeds 24px minimum.
- Theme toggle button: add `p-2` padding for touch target. The SVG is 14x14, padding-2 (8px) each side = 30x30px target.
- GitHub link: add `p-2` padding.
- Remove the `gap-2` on the container and let the padding on buttons create natural spacing, or keep gap-1 for visual spacing. Adjust so the row still looks compact.
- Wrap the button area: change from `gap-2` to `gap-0` since buttons now have their own padding.

In DeliveryDisplay.tsx:
- "Change postal code" buttons: add `p-2 -m-2` to increase touch target without changing visual layout (negative margin compensates the padding). Or simply add `py-1 px-2` for at least 24px height.

In PostalCodeSelector.tsx:
- "Search manually" / "Try again" / "Use location" buttons: add padding `py-2 px-3` for adequate touch targets.
- ComboboxOption items: `py-2` is already 8px top+bottom + text height, should be fine (verify visually).

**Reduced motion:**

In globals.css, add:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Alternatively, in the components: replace `animate-pulse` with `motion-safe:animate-pulse` in:
- DeliveryDisplay.tsx (loading "..." text)
- PostalCodeSelector.tsx (loading dot)
- PostalCodeGate.tsx (loading dot)

Use the Tailwind class approach (`motion-safe:animate-pulse`) as it is cleaner. Replace ALL occurrences of `animate-pulse` with `motion-safe:animate-pulse`.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
- All secondary text uses at minimum text-stone-500/dark:text-stone-400 (passing 4.5:1 on stone-50/stone-950 backgrounds)
- Every button, link, and input has focus-visible outline styles
- All interactive elements have at least 24x24px touch target via padding
- animate-pulse replaced with motion-safe:animate-pulse everywhere
  </done>
</task>

<task type="auto">
  <name>Task 2: Add skip navigation, heading hierarchy, ARIA landmarks, live regions, and screen reader text</name>
  <files>
    src/app/[locale]/layout.tsx
    src/app/[locale]/page.tsx
    src/app/[locale]/globals.css
    src/components/DeliveryDisplay.tsx
    src/components/PostalCodeSelector.tsx
    src/components/PostalCodeGate.tsx
    src/components/SettingsBar.tsx
    messages/en.json
    messages/fi.json
    messages/sv.json
    messages/se.json
  </files>
  <action>
**Skip navigation link:**

In layout.tsx, add as first child of `<body>` (after the inline script, before ThemeSync):
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:dark:bg-stone-900 focus:text-stone-900 focus:dark:text-stone-100 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-2 focus:outline-stone-500"
>
  Skip to content
</a>
```

In page.tsx, add `id="main-content"` and `tabIndex={-1}` to the `<main>` element so the skip link target is focusable:
```tsx
<main id="main-content" tabIndex={-1} className="...existing classes... focus:outline-none">
```

**Heading hierarchy:**

In DeliveryDisplay.tsx:
- Add a visually hidden `<h1>` at the top of the component: `<h1 className="sr-only">{t('pageTitle')}</h1>` where pageTitle = "Posti delivery status" or translated equivalent
- The dialect question paragraph can remain a `<p>` (it's decorative/fun)
- The week title is already `<h2>` -- good

In PostalCodeSelector.tsx:
- Add a visually hidden `<h1>`: `<h1 className="sr-only">{t('pageTitle')}</h1>` -- but we need to add this key to translations. Add a key `selectorTitle` to PostalCode namespace.

Actually, better approach: Add the `<h1>` in PostalCodeGate.tsx so it appears in both states. Add it as a sr-only heading:
```tsx
<h1 className="sr-only">{common title from translations}</h1>
```
Wait -- PostalCodeGate doesn't use translations directly. Simpler: add `<h1>` in each sub-component since they already have translation hooks.

Best approach: Add `<h1 className="sr-only">Posti Days</h1>` in page.tsx right before `<PostalCodeGate />`. This is static and doesn't need translation (it's the app name). The `<main>` wrapper in page.tsx is the right place.

**ARIA landmarks and live regions:**

In DeliveryDisplay.tsx:
- Wrap the main answer section (question + yes/no) in a `<div role="status" aria-live="polite">` so screen readers announce when the delivery status loads. This should wrap the question paragraph and the answer paragraph.
- Add `aria-label` to the week view section: wrap the week `<div>` with `<section aria-label={t('weekTitle')}>` or add `aria-labelledby` pointing to the h2.
- For each week day `<li>`, add sr-only text describing delivery status. After the date label span, add: `<span className="sr-only">{isDelivery ? t('deliveryDay') : t('noDeliveryDay')}</span>`. Add these translation keys.
- The color dots already have `aria-hidden="true"` -- good.

In PostalCodeSelector.tsx:
- The "requesting" loading state: wrap in `<div role="status" aria-live="polite">` so the status message is announced.
- The location denied/error message: wrap in `<div role="status" aria-live="polite">`.

In PostalCodeGate.tsx:
- The initial loading state: add `role="status"` and an sr-only text `<span className="sr-only">{loading text}</span>`. Since this component doesn't use translations, add a simple aria-label: `<div role="status" aria-label="Loading" className="...">`.

In SettingsBar.tsx:
- Wrap in `<nav aria-label="Settings">` instead of plain `<div>`. This provides a navigation landmark for the language and theme controls.
- The theme toggle already has an `aria-label` -- good. But it should reflect current state. Add `aria-pressed` for the theme toggle: not quite right since it's not a toggle in boolean sense. Instead, make the aria-label dynamic: "Switch to dark theme" / "Switch to light theme". This requires knowing the current theme state. Since the component reads from DOM: add a state variable `isDark` synced from the class. Actually, keep it simpler: the aria-label can be generic "Toggle theme" which is sufficient.

**Translation keys to add (all 4 locale files):**

In `Delivery` namespace:
- `"deliveryDay": "Delivery"` (en), `"Jakelu"` (fi), `"Utdelning"` (sv), `"Poasta"` (se)
- `"noDelivery": "No delivery"` (en), `"Ei jakelua"` (fi), `"Ingen utdelning"` (sv), `"Ii poasta"` (se)

In `PostalCode` namespace:
- No new keys needed (existing keys sufficient)

Read all 4 message files, add the keys to each.

**SR-only utility class:**

Tailwind v4 includes `sr-only` by default. Verify it works. If not, add to globals.css:
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
- Skip-to-content link exists as first focusable element, visible on focus, jumps to main content
- h1 "Posti Days" present on page (sr-only)
- Week view h2 "This week" present with proper hierarchy under h1
- Delivery status wrapped in aria-live="polite" region
- Each week day has sr-only text for delivery/no-delivery status
- SettingsBar wrapped in nav landmark with aria-label
- Loading states have role="status"
- All 4 locale files updated with new accessibility translation keys
- Build passes without errors
  </done>
</task>

</tasks>

<verification>
After both tasks complete:

1. `npx next build` passes without errors
2. Keyboard navigation: Tab through all interactive elements -- each shows visible focus ring
3. Skip nav: Press Tab on page load -- "Skip to content" link appears, Enter skips to main content
4. Screen reader: heading hierarchy is h1 > h2, delivery status is in a live region, week days have text status
5. Contrast: all text-stone classes are at minimum stone-500 on light (stone-50 bg) and stone-400 on dark (stone-950 bg)
6. Touch targets: all buttons have at least 24px effective size
7. Reduced motion: animate-pulse only runs when motion is not reduced
</verification>

<success_criteria>
- The page passes automated WCAG 2.2 AA checks for color contrast, heading hierarchy, ARIA landmarks, and form labels
- All interactive elements are keyboard accessible with visible focus indicators
- Screen readers can navigate the page structure and understand delivery status without visual cues
- Touch targets meet the 24x24px WCAG 2.2 minimum
- Animations respect prefers-reduced-motion
- Build passes, no regressions
</success_criteria>

<output>
After completion, create `.planning/quick/5-make-the-page-wcag-2-2-aa-accessible/5-SUMMARY.md`
</output>
