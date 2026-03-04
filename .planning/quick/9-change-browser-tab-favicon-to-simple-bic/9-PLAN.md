---
phase: quick-9
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/icon.svg
autonomous: true
requirements: [QUICK-9]

must_haves:
  truths:
    - "Browser tab shows a bicycle icon in Posti orange (#FF6200)"
    - "Favicon renders crisply at 16x16 and 32x32 sizes"
    - "App builds without errors after favicon is added"
  artifacts:
    - path: "src/app/icon.svg"
      provides: "SVG favicon with bicycle silhouette in Posti orange"
  key_links:
    - from: "src/app/icon.svg"
      to: "Next.js App Router metadata"
      via: "Next.js automatic favicon detection from app directory"
      pattern: "icon\\.svg in src/app/"
---

<objective>
Add a simple bicycle SVG favicon in Posti orange (#FF6200) to the browser tab.

Purpose: Give the app a recognizable brand identity in the browser tab instead of the default Next.js icon or no icon.
Output: A single SVG favicon file at src/app/icon.svg, automatically picked up by Next.js App Router.
</objective>

<execution_context>
@/Users/topisalonen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/topisalonen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

Next.js App Router convention: placing `icon.svg` in the `src/app/` directory automatically registers it as the site favicon. No metadata configuration needed -- Next.js handles the `<link rel="icon">` tag generation.

Current state: No favicon exists. The `src/app/` directory contains `[locale]/` and `api/` subdirectories only.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create bicycle SVG favicon and verify build</name>
  <files>src/app/icon.svg</files>
  <action>
Create `src/app/icon.svg` with a simple, recognizable bicycle silhouette icon.

Requirements:
- SVG with viewBox="0 0 32 32" for optimal favicon sizing
- Fill color: #FF6200 (Posti orange)
- Simple bicycle silhouette that reads clearly at 16x16 pixels
- The bicycle should be a minimalist side-view silhouette: two wheels (circles with stroke), frame (lines connecting seat to handlebars to pedal area), handlebars, and seat
- Keep paths simple -- no fine details that disappear at small sizes. Use stroke-based rendering (stroke="#FF6200", fill="none") for the frame/wheels to maintain clarity at tiny sizes
- No background (transparent)

Next.js App Router will automatically detect this file and generate the appropriate `<link rel="icon" type="image/svg+xml">` tag. No changes to layout.tsx needed.

After creating the SVG, verify the app builds without errors:
- Run `npm run build` to confirm no build failures
- The build output should show the icon.svg being processed

Definition of Done checklist from CLAUDE.md:
- WCAG 2.2 AA: SVG favicons do not have WCAG requirements (decorative, not in page DOM)
- Unit tests: Not applicable for a static SVG asset
- Build: Must pass without errors
  </action>
  <verify>
    <automated>cd /Users/topisalonen/Projects/posti-days && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
- src/app/icon.svg exists with a bicycle silhouette in #FF6200
- `npm run build` completes without errors
- Next.js automatically serves the favicon (visible in browser tab when running locally)
  </done>
</task>

</tasks>

<verification>
- File src/app/icon.svg exists and contains valid SVG markup
- SVG uses #FF6200 as its color
- SVG viewBox is set for favicon-appropriate dimensions
- `npm run build` passes without errors
</verification>

<success_criteria>
Browser tab displays a recognizable bicycle icon in Posti orange. The app builds and deploys without errors.
</success_criteria>

<output>
After completion, create `.planning/quick/9-change-browser-tab-favicon-to-simple-bic/9-SUMMARY.md`
</output>
