---
phase: quick
plan: 4
type: execute
wave: 1
depends_on: []
files_modified:
  - src/i18n/routing.ts
  - src/components/SettingsBar.tsx
  - messages/se.json
autonomous: true
requirements: []

must_haves:
  truths:
    - "User can select SE from the locale switcher and see the app in Northern Sami"
    - "All UI strings display in Northern Sami (Davvisamegiella) when se locale is active"
    - "Navigating to /se/ path renders the app in Northern Sami"
  artifacts:
    - path: "messages/se.json"
      provides: "Northern Sami translations"
      contains: "Poastabottut"
    - path: "src/i18n/routing.ts"
      provides: "se locale in routing config"
      contains: "'se'"
    - path: "src/components/SettingsBar.tsx"
      provides: "SE button in locale switcher"
      contains: "'se'"
  key_links:
    - from: "src/i18n/routing.ts"
      to: "src/i18n/request.ts"
      via: "routing.locales includes 'se', request.ts dynamically imports messages/se.json"
      pattern: "locales.*se"
    - from: "src/components/SettingsBar.tsx"
      to: "src/i18n/navigation.ts"
      via: "router.replace with locale 'se'"
      pattern: "locales.*se"
---

<objective>
Add Northern Sami (se) as a 4th locale to the app.

Purpose: Expand language support to include Davvisamegiella (Northern Sami), a Sami language spoken in northern Finland, Norway, and Sweden.
Output: Working Northern Sami locale with translations, routing, and UI switcher support.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@messages/en.json (English translations - reference for all keys)
@messages/fi.json (Finnish translations - reference for style)
@src/i18n/routing.ts (locale config)
@src/components/SettingsBar.tsx (locale switcher UI)

<interfaces>
From src/i18n/routing.ts:
```typescript
export const routing = defineRouting({
  locales: ['fi', 'en', 'sv'],  // Add 'se' here
  defaultLocale: 'en',
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
})
```

From src/components/SettingsBar.tsx:
```typescript
const locales = ['fi', 'en', 'sv'] as const  // Add 'se' here
type Locale = (typeof locales)[number]
```

From src/i18n/request.ts (no changes needed - dynamic import):
```typescript
messages: (await import(`../../messages/${locale}.json`)).default
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Northern Sami translations and register locale</name>
  <files>messages/se.json, src/i18n/routing.ts, src/components/SettingsBar.tsx</files>
  <action>
1. Create messages/se.json with Northern Sami (Davvisamegiella) translations matching the exact same JSON structure as en.json. Use authentic Northern Sami translations:

```json
{
  "Common": {
    "loading": "Viehka...",
    "error": "Meattahus",
    "title": "Posti Days",
    "description": "Juogadago Posti poasta odne?"
  },
  "Delivery": {
    "errorTitle": "Ii sahtten darkistit juogadeami",
    "weekTitle": "Dán vahku",
    "postalCode": "Poastanummir",
    "yes": "De",
    "no": "Ii",
    "today": "Odne"
  },
  "PostalCode": {
    "allowLocation": "Dohkket sajadatbeasama gahtat din poastanummira",
    "locationDenied": "Sajadatbeassan hilgojuvvui",
    "locationError": "Ii sahtten mearridit sajadaga",
    "tryAgain": "Geahččal oddasis",
    "enterPostalCode": "Biija poastanummira",
    "searchPlaceholder": "Poastanummir dahje guovlu...",
    "searchManually": "Dahje oza ieš",
    "changeCode": "Molso poastanummira",
    "useLocation": "Geavat dalaš sajadaga",
    "submit": "Oza"
  }
}
```

2. In src/i18n/routing.ts, add 'se' to the locales array:
   Change: `locales: ['fi', 'en', 'sv']` to `locales: ['fi', 'en', 'sv', 'se']`

3. In src/components/SettingsBar.tsx, add 'se' to the locales array:
   Change: `const locales = ['fi', 'en', 'sv'] as const` to `const locales = ['fi', 'en', 'sv', 'se'] as const`

No changes needed to request.ts (dynamic import handles it), proxy.ts/middleware (derives from routing), or navigation.ts (derives from routing).
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npx next build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - messages/se.json exists with all keys matching en.json structure
    - routing.ts locales array includes 'se'
    - SettingsBar.tsx locales array includes 'se'
    - App builds without errors
    - Navigating to /se/ path renders Northern Sami translations
  </done>
</task>

</tasks>

<verification>
- `npx next build` succeeds without errors
- messages/se.json has identical key structure to en.json (same keys in Common, Delivery, PostalCode)
- The string 'se' appears in both src/i18n/routing.ts locales array and src/components/SettingsBar.tsx locales array
</verification>

<success_criteria>
- Northern Sami locale is selectable via SE button in the settings bar
- All UI strings display in Northern Sami when se locale is active
- The /se/ URL path works correctly via next-intl routing
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-northern-sami-language-support/4-SUMMARY.md`
</output>
