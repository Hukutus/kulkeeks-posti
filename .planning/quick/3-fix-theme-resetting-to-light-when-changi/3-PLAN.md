---
phase: quick-3
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ThemeSync.tsx
  - src/app/[locale]/layout.tsx
autonomous: true
requirements: [BUGFIX-THEME-LOCALE]

must_haves:
  truths:
    - "Theme persists as dark when user switches locale while in dark mode"
    - "Theme persists as light when user switches locale while in light mode"
    - "Theme toggle still works correctly after a locale switch"
    - "Initial page load still applies theme from localStorage without flash"
  artifacts:
    - path: "src/components/ThemeSync.tsx"
      provides: "Client component that syncs dark class from localStorage on mount/navigation"
    - path: "src/app/[locale]/layout.tsx"
      provides: "Layout with ThemeSync component and inline script for FOUC prevention"
  key_links:
    - from: "src/components/ThemeSync.tsx"
      to: "document.documentElement.classList"
      via: "useEffect syncing dark class from localStorage"
      pattern: "useEffect.*localStorage.*dark"
    - from: "src/app/[locale]/layout.tsx"
      to: "src/components/ThemeSync.tsx"
      via: "component import in body"
      pattern: "ThemeSync"
---

<objective>
Fix bug where the dark/light theme resets to light mode when the user changes language (locale).

Purpose: The inline theme restoration script in layout.tsx only runs on full page loads. When next-intl's router.replace() triggers a client-side navigation for locale changes, React re-renders the layout and reconciles the `<html>` element's className back to the server-rendered value (which lacks the `dark` class). The `dark` class gets stripped and the inline script does not re-run because it is not a client-side navigation event.

Output: A ThemeSync client component that keeps the `dark` class in sync with localStorage across client-side navigations, plus preserved inline script for FOUC prevention on initial loads.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/[locale]/layout.tsx
@src/components/SettingsBar.tsx
@src/app/[locale]/globals.css
@src/i18n/routing.ts
@src/i18n/navigation.ts

<interfaces>
<!-- Key code the executor needs to understand -->

From src/app/[locale]/layout.tsx (line 41-43):
The `<html>` tag has className `${caveat.variable} bg-stone-50 dark:bg-stone-950` (no `dark` class).
An inline `<script>` adds `dark` class from localStorage on page load.
The `suppressHydrationWarning` is on `<html>` to prevent mismatch warnings.

From src/components/SettingsBar.tsx (line 38-51):
```typescript
function switchLocale(newLocale: Locale) {
  router.replace(pathname, { locale: newLocale })
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  if (isDark) {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('posti-days:theme', 'light')
  } else {
    document.documentElement.classList.add('dark')
    localStorage.setItem('posti-days:theme', 'dark')
  }
}
```

From src/app/[locale]/globals.css (line 3):
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Dark mode uses the `.dark` class strategy (not media query).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ThemeSync client component</name>
  <files>src/components/ThemeSync.tsx</files>
  <action>
Create a new client component `ThemeSync.tsx` that ensures the `dark` class on `<html>` stays in sync with localStorage across client-side navigations.

The component should:
1. Be a `'use client'` component that renders `null` (no visual output).
2. Use `useEffect` (no dependency array -- must run on every render/navigation) to read `localStorage.getItem('posti-days:theme')` and sync the `dark` class on `document.documentElement`:
   - If stored theme is `'dark'`, OR if no stored theme and `window.matchMedia('(prefers-color-scheme: dark)').matches`, add `dark` class.
   - Otherwise, remove `dark` class.
3. This logic mirrors the inline script but runs on every client-side navigation, not just initial page load.

Keep it minimal -- under 20 lines. No props needed.

IMPORTANT: Use an empty dependency array `[]` would NOT work because it only runs once after mount. We need it to run after every render triggered by locale navigation. However, using no dependency array causes unnecessary runs. The better approach: use `useEffect` with the `usePathname()` hook from next-intl as a dependency -- this changes on locale switch, triggering the sync exactly when needed.

Actually, the simplest and most robust approach: use `useEffect` with NO dependency array. The cost is negligible (just reading localStorage and checking a classList) and it guarantees the class is always correct after any re-render.
  </action>
  <verify>
    <automated>test -f src/components/ThemeSync.tsx && grep -q "use client" src/components/ThemeSync.tsx && grep -q "localStorage" src/components/ThemeSync.tsx && grep -q "dark" src/components/ThemeSync.tsx && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>ThemeSync.tsx exists as a client component that reads theme from localStorage and syncs the dark class on document.documentElement on every render.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate ThemeSync into layout and verify</name>
  <files>src/app/[locale]/layout.tsx</files>
  <action>
In `src/app/[locale]/layout.tsx`:

1. Import ThemeSync: `import ThemeSync from '@/components/ThemeSync'`
2. Add `<ThemeSync />` inside the `<body>` tag, right after the existing inline `<script>` tag and before `<NextIntlClientProvider>`.

KEEP the existing inline `<script>` tag -- it prevents FOUC (flash of unstyled content) on initial full page loads by running synchronously before paint. ThemeSync handles the client-side navigation case that the inline script cannot cover.

Do NOT modify the `<html>` className -- it should remain as-is. The inline script and ThemeSync will manage the `dark` class dynamically.

Do NOT modify SettingsBar.tsx -- its toggleTheme function correctly sets localStorage and classList; the issue is only that React re-renders strip the classList change during locale navigation.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>Layout imports and renders ThemeSync. Build succeeds. Theme persists across locale changes because ThemeSync re-applies the dark class after every client-side navigation re-render.</done>
</task>

</tasks>

<verification>
1. `npx next build` completes without errors
2. Manual test: Open app, toggle to dark mode, switch locale -- dark mode persists
3. Manual test: Refresh page in dark mode -- no flash of light mode (inline script still works)
4. Manual test: Toggle theme after locale switch -- toggle still works correctly
</verification>

<success_criteria>
- Dark mode persists when switching between fi/en/sv locales
- Light mode persists when switching between fi/en/sv locales
- No flash of incorrect theme on initial page load
- Theme toggle continues to work after locale switches
- Build succeeds with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-fix-theme-resetting-to-light-when-changi/3-SUMMARY.md`
</output>
