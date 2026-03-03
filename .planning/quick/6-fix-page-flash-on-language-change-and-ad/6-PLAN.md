---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/SettingsBar.tsx
  - src/components/ThemeSync.tsx
  - src/app/[locale]/layout.tsx
autonomous: true
requirements: [FLASH-01, SYSTEM-THEME-01]
must_haves:
  truths:
    - "Switching locale does not cause any white flash in dark mode"
    - "Theme toggle cycles through light, dark, and system"
    - "System theme follows OS prefers-color-scheme in real time"
    - "Theme preference persists across locale changes and page refreshes"
  artifacts:
    - path: "src/components/SettingsBar.tsx"
      provides: "3-state theme toggle (light/dark/system) and flash-free locale switching"
    - path: "src/components/ThemeSync.tsx"
      provides: "Theme sync with system theme listener"
    - path: "src/app/[locale]/layout.tsx"
      provides: "Inline script supporting system theme"
  key_links:
    - from: "src/components/SettingsBar.tsx"
      to: "localStorage posti-days:theme"
      via: "toggleTheme writes 'light'|'dark'|'system'"
    - from: "src/components/ThemeSync.tsx"
      to: "matchMedia prefers-color-scheme"
      via: "addEventListener for system theme changes"
    - from: "src/app/[locale]/layout.tsx"
      to: "inline script"
      via: "reads localStorage and matchMedia before paint"
---

<objective>
Fix page flash on language change and add system theme option.

Purpose: Eliminate the white flash visible in dark mode when switching locales, and add a "system" theme option that follows OS preference. Both improve polish and user experience.

Output: Updated SettingsBar.tsx, ThemeSync.tsx, and layout.tsx with flash-free locale switching and 3-state theme toggle.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/SettingsBar.tsx
@src/components/ThemeSync.tsx
@src/app/[locale]/layout.tsx
@src/app/[locale]/globals.css

<interfaces>
From src/i18n/navigation.ts:
```typescript
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
```

From src/i18n/routing.ts:
```typescript
export const routing = defineRouting({
  locales: ['fi', 'en', 'sv', 'se'],
  defaultLocale: 'en',
})
```

Current inline theme script in layout.tsx (line 44):
```javascript
(function(){try{var t=localStorage.getItem('posti-days:theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();
```

Current ThemeSync.tsx reads localStorage 'posti-days:theme' — values 'dark' or absent.
Current SettingsBar.tsx toggles between dark/light only, uses `document.documentElement.classList` to add/remove 'dark'.

Tailwind dark mode configured via class strategy: `@custom-variant dark (&:where(.dark, .dark *));` in globals.css.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix locale flash and add system theme support</name>
  <files>src/app/[locale]/layout.tsx, src/components/ThemeSync.tsx, src/components/SettingsBar.tsx</files>
  <action>
**Root cause of flash:** `router.replace(pathname, { locale: newLocale })` from next-intl triggers a server navigation. The new HTML arrives without the `dark` class, causing a brief white flash before the inline script or ThemeSync restores it.

**Fix the flash in SettingsBar.tsx `switchLocale`:**
1. Before calling `router.replace()`, set a CSS transition blocker. The cleanest approach: wrap the locale switch with `React.startTransition` so React keeps showing the old UI while the new locale page loads. Import `useTransition` from React:
   ```typescript
   const [isPending, startTransition] = useTransition()
   ```
   Then in `switchLocale`:
   ```typescript
   function switchLocale(newLocale: Locale) {
     startTransition(() => {
       router.replace(pathname, { locale: newLocale })
     })
   }
   ```
   This keeps the old page visible during navigation, preventing flash.

2. Additionally, as a belt-and-suspenders safeguard, add a `beforeunload`-style approach: in the `switchLocale` function, BEFORE calling `router.replace`, explicitly set `document.documentElement.style.backgroundColor` to match the current theme (dark mode = stone-950 `#0c0a09`, light mode = stone-50 `#fafaf9`). This ensures even if React does a brief swap, the background color is already set. Clear this inline style in ThemeSync after hydration.

**Update the inline script in layout.tsx to handle 'system' value:**
Replace the inline script with one that handles three states:
```javascript
(function(){try{var t=localStorage.getItem('posti-days:theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();
```
Logic: if stored theme is 'dark', apply dark. If stored theme is 'light', don't. If stored theme is 'system' OR null/absent (default to system), check `matchMedia`. This means 'system' and no-preference both follow OS — which is the correct default behavior.

**Update ThemeSync.tsx:**
1. Read stored theme from localStorage. Determine the effective theme based on stored value:
   - `'dark'` -> apply dark
   - `'light'` -> remove dark
   - `'system'` or null -> follow `matchMedia('(prefers-color-scheme: dark)')`
2. Add a `matchMedia` change listener that fires when the OS theme changes. When the stored theme is `'system'` (or absent), toggle the `dark` class on `<html>` accordingly. Clean up the listener on unmount.
3. Export a custom event or use a simple window event (`'theme-change'`) so SettingsBar can notify ThemeSync when the user toggles theme. Or simpler: use a `storage` event pattern — but since both are same-page, use a custom event: `window.dispatchEvent(new Event('theme-sync'))`.
4. Listen for `'theme-sync'` custom events to re-read localStorage and re-apply.
5. Also clear any inline `backgroundColor` style set by the flash-prevention safeguard: `document.documentElement.style.removeProperty('background-color')`.
6. The useEffect should have NO dependency array (runs every render) — this matches the current behavior and is intentional for catching navigations. Actually, change this to use proper dependency tracking: run the sync logic on mount and on custom events, not every render.

Full ThemeSync implementation:
```typescript
'use client'
import { useEffect } from 'react'

function applyTheme() {
  try {
    const stored = localStorage.getItem('posti-days:theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
    document.documentElement.style.removeProperty('background-color')
  } catch (e) {
    // localStorage may be unavailable
  }
}

export default function ThemeSync() {
  useEffect(() => {
    applyTheme()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => applyTheme()
    mq.addEventListener('change', onSystemChange)

    const onThemeSync = () => applyTheme()
    window.addEventListener('theme-sync', onThemeSync)

    return () => {
      mq.removeEventListener('change', onSystemChange)
      window.removeEventListener('theme-sync', onThemeSync)
    }
  }, [])

  return null
}
```

**Update SettingsBar.tsx theme toggle:**
1. Add a `MonitorIcon` SVG component for the system theme state (a monitor/desktop icon). Use a simple monitor SVG:
   ```typescript
   function MonitorIcon() {
     return (
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
         <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
         <line x1="8" y1="21" x2="16" y2="21" />
         <line x1="12" y1="17" x2="12" y2="21" />
       </svg>
     )
   }
   ```

2. Change `toggleTheme` to cycle through 3 states: light -> dark -> system -> light. Read the CURRENT stored value from localStorage to determine next state:
   ```typescript
   function toggleTheme() {
     const current = localStorage.getItem('posti-days:theme')
     let next: string
     if (current === 'light') {
       next = 'dark'
     } else if (current === 'dark') {
       next = 'system'
     } else {
       // 'system' or null -> light
       next = 'light'
     }
     localStorage.setItem('posti-days:theme', next)

     // Apply immediately
     const shouldBeDark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
     document.documentElement.classList.toggle('dark', shouldBeDark)

     // Notify ThemeSync
     window.dispatchEvent(new Event('theme-sync'))
   }
   ```

3. Update the theme button to show 3 states. Use React state to track the current theme preference (not just the dark class). Add `useState` initialized from localStorage:
   ```typescript
   const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('system')
   ```
   Initialize in a useEffect reading from localStorage. Update `themePref` in `toggleTheme` alongside localStorage.

4. Update the button's icon rendering:
   - `themePref === 'light'` -> show MoonIcon (clicking will go to dark)
   - `themePref === 'dark'` -> show MonitorIcon (clicking will go to system)
   - `themePref === 'system'` -> show SunIcon (clicking will go to light)

5. Update the aria-label to reflect the current state and what clicking will do:
   - light: "Theme: light, switch to dark"
   - dark: "Theme: dark, switch to system"
   - system: "Theme: system, switch to light"

6. **Flash prevention in switchLocale:** Wrap `router.replace` in `startTransition` as described above. Also set background color before navigation:
   ```typescript
   function switchLocale(newLocale: Locale) {
     const isDark = document.documentElement.classList.contains('dark')
     document.documentElement.style.backgroundColor = isDark ? '#0c0a09' : '#fafaf9'
     startTransition(() => {
       router.replace(pathname, { locale: newLocale })
     })
   }
   ```

7. Add `useTransition` and `useState` to the React imports. Add `useEffect` for initializing `themePref` from localStorage on mount.

**WCAG compliance (per CLAUDE.md Definition of Done):**
- The theme button must have a descriptive aria-label that includes both current state and action
- The three SVG icons must have `aria-hidden="true"` (already present in current icons)
- If `isPending` from useTransition, consider adding `aria-busy="true"` to the locale buttons or visually indicating loading (optional, low priority -- the transition should be near-instant)
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - Theme toggle cycles through light -> dark -> system -> light with appropriate icons (Moon, Monitor, Sun)
    - System theme follows OS prefers-color-scheme and updates in real time when OS theme changes
    - Locale switching uses startTransition to prevent page flash
    - Inline script in layout.tsx handles 'system' stored value
    - ThemeSync listens for both OS theme changes and custom theme-sync events
    - All theme button states have descriptive aria-labels
    - localStorage stores 'light', 'dark', or 'system' under key 'posti-days:theme'
  </done>
</task>

</tasks>

<verification>
1. Build succeeds: `npx next build` completes without errors
2. Manual testing checklist:
   - In dark mode, switch locale — NO white flash visible
   - Theme toggle cycles: light (moon icon) -> dark (monitor icon) -> system (sun icon)
   - In "system" mode, changing OS appearance immediately toggles theme
   - Refresh page in each theme mode — correct theme applied without flash
   - Switch locale in each theme mode — theme preserved, no flash
</verification>

<success_criteria>
- Zero visual flash when switching locales in dark mode
- Three-state theme toggle (light/dark/system) working with correct icons
- System theme reacts to OS preference changes in real time
- Theme persists correctly across locale switches and page refreshes
- Build passes, no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/6-fix-page-flash-on-language-change-and-ad/6-SUMMARY.md`
</output>
