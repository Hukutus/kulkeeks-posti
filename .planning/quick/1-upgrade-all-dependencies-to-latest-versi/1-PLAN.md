---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
autonomous: true
requirements: [QUICK-01]

must_haves:
  truths:
    - "All dependencies are at their latest stable versions"
    - "The app builds without errors"
    - "The app runs in dev mode without errors"
    - "Lint passes without new errors"
  artifacts:
    - path: "package.json"
      provides: "Updated dependency versions"
    - path: "package-lock.json"
      provides: "Resolved dependency tree"
  key_links:
    - from: "package.json"
      to: "next.config.ts"
      via: "next and next-intl plugin compatibility"
      pattern: "next-intl/plugin"
---

<objective>
Upgrade all project dependencies to their latest stable versions and verify the app still builds and runs correctly.

Purpose: The project uses a vulnerable version of Next.js (^15.3.1). All dependencies should be brought to latest stable versions to address security vulnerabilities and get latest features/fixes.
Output: Updated package.json and package-lock.json with all dependencies at latest stable versions, verified by successful build and lint.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@package.json
@next.config.ts
@tsconfig.json

Current dependencies to upgrade:
- next: ^15.3.1 (vulnerable)
- react/react-dom: ^19.0.0
- next-intl: ^4.8.3
- @headlessui/react: ^2.2.9
- @tailwindcss/postcss: ^4.2.1
- tailwindcss: ^4
- zod: ^4.3.6
- fuse.js: ^7.1.0
- eslint: ^9, eslint-config-next: ^15.3.1
- typescript: ^5
- tsx: ^4.19.2
- exceljs: ^4.4.0
- Plus type packages

Package manager: npm (package-lock.json)
App uses: Next.js App Router, next-intl for i18n, Tailwind CSS v4, Headless UI, Zod validation
</context>

<tasks>

<task type="auto">
  <name>Task 1: Upgrade all dependencies to latest versions</name>
  <files>package.json, package-lock.json</files>
  <action>
    1. Run `npx npm-check-updates -u` to update all dependency version ranges in package.json to latest
    2. Run `npm install` to resolve and install the updated dependencies
    3. If any peer dependency conflicts occur, resolve them by aligning versions (e.g., eslint-config-next version must match next version)
    4. Check for any major version bumps that could be breaking:
       - next: If jumped to 16.x, check Next.js 16 migration guide for breaking changes
       - next-intl: If jumped to 5.x, check for API changes in the plugin setup (next.config.ts uses `createNextIntlPlugin`)
       - zod: Already on v4, check if any v5 exists
       - tailwindcss: Already on v4, check if v5 exists
       - @headlessui/react: If jumped to 3.x, check for component API changes
       - react/react-dom: If jumped to 20.x, check migration
    5. If a major version bump has known breaking changes that affect this codebase, pin to latest minor of current major instead
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npm ls --depth=0 2>&1 | head -30</automated>
  </verify>
  <done>All dependencies updated to latest stable versions in package.json, npm install succeeds without errors, no unresolved peer dependency warnings</done>
</task>

<task type="auto">
  <name>Task 2: Fix any breaking changes and verify the app works</name>
  <files>package.json, package-lock.json</files>
  <action>
    1. Run `npx next build` to verify the production build succeeds
    2. If build fails due to breaking API changes from upgraded dependencies:
       - For next-intl: Check if `createNextIntlPlugin` API changed, update next.config.ts if needed
       - For @headlessui/react: Check if component imports changed in PostalCodeSelector.tsx
       - For zod: Check if validation API changed in any route handlers or lib files
       - For tailwindcss v4: Check if PostCSS plugin config changed
       - Apply minimal fixes to source files as needed
    3. Run `npx next lint` to verify no new lint errors
    4. Run `npx tsc --noEmit` to verify TypeScript compilation succeeds
    5. If there are existing tests, run them: `npx vitest run 2>/dev/null || npx jest 2>/dev/null || echo "No test runner configured"`
    6. Verify dev server starts: start `npx next dev`, wait for ready message, then stop it

    Key files that may need updates if APIs changed:
    - next.config.ts (next-intl plugin)
    - src/middleware.ts (next-intl middleware)
    - src/components/PostalCodeSelector.tsx (headlessui Combobox)
    - src/app/api/delivery/route.ts (zod validation)
    - src/lib/get-delivery-dates.ts (core logic)
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Build succeeds, lint passes, TypeScript compiles without errors, no runtime errors on dev server startup</done>
</task>

</tasks>

<verification>
1. `npm run build` exits with code 0
2. `npx next lint` exits with code 0
3. `npx tsc --noEmit` exits with code 0
4. `npm ls --depth=0` shows no unmet peer dependencies
5. All dependency versions in package.json are at latest stable
</verification>

<success_criteria>
- All dependencies in package.json are at their latest stable versions
- No known security vulnerabilities in Next.js or other dependencies
- Production build succeeds without errors
- TypeScript compilation and linting pass
- The app is functionally unchanged (same behavior, just updated deps)
</success_criteria>

<output>
After completion, create `.planning/quick/1-upgrade-all-dependencies-to-latest-versi/1-SUMMARY.md`
</output>
