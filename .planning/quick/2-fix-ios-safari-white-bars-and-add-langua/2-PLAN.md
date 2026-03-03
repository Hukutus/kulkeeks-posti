---
phase: quick
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/[locale]/layout.tsx
  - src/app/[locale]/globals.css
  - src/app/[locale]/page.tsx
  - src/components/DeliveryDisplay.tsx
  - src/components/SettingsBar.tsx
  - messages/en.json
  - messages/fi.json
  - messages/sv.json
autonomous: true
requirements: []
must_haves:
  truths:
    - "No white bars visible on iOS Safari - background color fills entire viewport including safe areas"
    - "User can switch language between fi/en/sv using small icon buttons"
    - "User can toggle dark/light theme using a small icon button"
    - "Settings buttons are positioned next to the postal code area under the week table"
  artifacts:
    - path: "src/app/[locale]/layout.tsx"
      provides: "viewport-fit=cover meta, dark class on html, theme script"
    - path: "src/app/[locale]/globals.css"
      provides: "Safe area CSS, body background"
    - path: "src/components/SettingsBar.tsx"
      provides: "Language and theme toggle buttons"
    - path: "src/components/DeliveryDisplay.tsx"
      provides: "SettingsBar integrated below postal code area"
  key_links:
    - from: "src/components/SettingsBar.tsx"
      to: "next-intl routing"
      via: "useRouter/usePathname from @/i18n/navigation"
      pattern: "router\\.replace.*locale"
    - from: "src/app/[locale]/layout.tsx"
      to: "html element"
      via: "dark class toggle and viewport meta"
      pattern: "viewport-fit.*cover"
---

<objective>
Fix iOS Safari white bars by ensuring the background color fills the entire viewport (including safe areas), and add small language/theme toggle icon buttons positioned next to the postal code options area.

Purpose: Eliminate visual glitch on iOS Safari and give users control over language and theme.
Output: Polished full-bleed mobile experience with language/theme preferences.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/[locale]/layout.tsx
@src/app/[locale]/globals.css
@src/app/[locale]/page.tsx
@src/components/DeliveryDisplay.tsx
@src/components/PostalCodeGate.tsx
@src/i18n/routing.ts
@src/i18n/navigation.ts
@messages/en.json
@messages/fi.json
@messages/sv.json

<interfaces>
From src/i18n/navigation.ts:
```typescript
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

From src/i18n/routing.ts:
```typescript
export const routing = defineRouting({
  locales: ['fi', 'en', 'sv'],
  defaultLocale: 'en',
})
```

Current locale route structure: /[locale]/ (e.g., /fi/, /en/, /sv/)
Locales available: fi, en, sv
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix iOS Safari white bars with viewport-fit and safe area CSS</name>
  <files>src/app/[locale]/layout.tsx, src/app/[locale]/globals.css, src/app/[locale]/page.tsx</files>
  <action>
**layout.tsx changes:**

1. Export a `viewport` object from layout.tsx (Next.js 15+ way to set viewport meta). This replaces any meta viewport tag:
```typescript
import type { Viewport } from 'next'

export const viewport: Viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}
```
This generates `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` which tells iOS Safari the page handles safe areas.

2. Add `bg-stone-50 dark:bg-stone-950` classes to the `<html>` element so the background behind safe areas matches the page. Keep existing `lang` and `className` attributes.

3. Add the same background classes `bg-stone-50 dark:bg-stone-950` to the `<body>` element as well, and add `min-h-dvh` (dynamic viewport height - works better than min-h-screen on iOS Safari).

**globals.css changes:**

Add safe area padding to body so content doesn't overlap notch/home indicator:
```css
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**page.tsx changes:**

Change `min-h-screen` to `min-h-dvh` on the `<main>` element (dvh = dynamic viewport height, which accounts for iOS Safari's collapsing address bar). Keep all other classes.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>Build succeeds. The html and body elements have bg-stone-50/dark:bg-stone-950. viewport-fit=cover is set via Next.js viewport export. Safe area env() padding is applied to body. min-h-dvh used instead of min-h-screen.</done>
</task>

<task type="auto">
  <name>Task 2: Add language and theme toggle buttons below the week table</name>
  <files>src/components/SettingsBar.tsx, src/components/DeliveryDisplay.tsx, messages/en.json, messages/fi.json, messages/sv.json</files>
  <action>
**Create src/components/SettingsBar.tsx:**

A `'use client'` component that renders a small row of icon buttons for language switching and theme toggling. Should be visually minimal -- same style as the postal code area (text-xs, text-stone-400).

1. **Language buttons:** Show locale codes (FI / EN / SV) separated by slashes. The current locale is slightly bolder/highlighted (text-stone-600 dark:text-stone-300), others are text-stone-400 dark:text-stone-500 and clickable. Use `useLocale()` from `next-intl` to get current locale and `useRouter()` + `usePathname()` from `@/i18n/navigation` to switch. On click, call `router.replace(pathname, { locale: newLocale })`.

2. **Theme toggle:** A single small button showing a sun icon (in dark mode) or moon icon (in light mode). Use simple inline SVG icons (no icon library needed). On click:
   - Read current state from `document.documentElement.classList.contains('dark')`
   - Toggle `dark` class on `document.documentElement`
   - Save preference to `localStorage` key `'posti-days:theme'` as `'dark'` or `'light'`

3. Layout: `flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500`. Put language options first, then a `·` separator, then the theme toggle. All buttons should be `cursor-pointer` with hover states matching the existing `hover:text-stone-600 dark:hover:text-stone-300` pattern.

**Update layout.tsx for theme persistence:**

Add an inline script BEFORE children in the `<body>` to prevent flash of wrong theme. This script reads localStorage and applies `dark` class immediately:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  (function(){
    try {
      var t = localStorage.getItem('posti-days:theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch(e) {}
  })();
`}} />
```

Also add `suppressHydrationWarning` to the `<html>` element (because the script may add `dark` class before React hydrates).

Also ensure the Tailwind config respects the `dark` class selector. In globals.css, add:
```css
@custom-variant dark (&:where(.dark, .dark *));
```
This tells Tailwind v4 to use class-based dark mode instead of media query.

**Update DeliveryDisplay.tsx:**

Import `SettingsBar` and render it BELOW the existing postal code/change control div (the one at line 173). Add it as a sibling:
```tsx
{/* Settings — language & theme */}
<div className="mt-2">
  <SettingsBar />
</div>
```

**Update message files (en.json, fi.json, sv.json):**

No new translation keys needed -- the locale codes (FI/EN/SV) and icons are universal. No text to translate.
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>Build succeeds. SettingsBar component renders language toggle (FI/EN/SV) and theme toggle (sun/moon icon) below the postal code area. Clicking a language code switches locale via next-intl router. Clicking theme icon toggles dark class on html and persists to localStorage. Theme is restored on page load without flash via inline script. Dark mode uses class-based variant, not media query.</done>
</task>

</tasks>

<verification>
1. `npx next build` succeeds without errors
2. `npx next dev` -- visit localhost:3000, verify:
   - Language toggle appears below postal code area
   - Clicking FI/EN/SV changes the locale (URL changes to /fi, /en, /sv)
   - Theme toggle switches between light and dark mode
   - Theme persists across page refresh
   - No flash of wrong theme on load
3. iOS Safari check: viewport-fit=cover in page source, no white bars at top/bottom
</verification>

<success_criteria>
- iOS Safari renders without white bars -- background color fills safe areas
- Language toggle (FI/EN/SV) works and switches locale
- Theme toggle works with sun/moon icon, persists to localStorage
- No theme flash on page load
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-ios-safari-white-bars-and-add-langua/2-SUMMARY.md`
</output>
