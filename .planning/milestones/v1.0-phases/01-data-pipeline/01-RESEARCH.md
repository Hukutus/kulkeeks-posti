# Phase 1: Data Pipeline - Research

**Researched:** 2026-03-03
**Domain:** Node.js build-time script — Statistics Finland XLSX download, ExcelJS parsing, Statistics Finland Classification API for Swedish municipality names, output JSON generation
**Confidence:** HIGH — URLs verified live, XLSX structure inspected from real files, API endpoints confirmed working

---

## Summary

Phase 1 is a standalone Node.js/TypeScript build-time script (no Next.js dependency). It downloads the Statistics Finland postal code XLSX, parses it with ExcelJS, fetches Swedish municipality names from the Statistics Finland Classification API, merges the data, and writes `public/data/postal-codes.json`. The result powers the autocomplete in Phase 4.

The single biggest risk — explicitly flagged in STATE.md as a blocker — is the Swedish municipality name data source. This is now fully resolved: the Statistics Finland Classification API (`api.stat.fi/classificationservice`) provides all 308 municipalities with Swedish names in a single GET request, requires no authentication, and is free. The XLSX does not contain Swedish municipality names, so this API call is mandatory.

The XLSX URL pattern `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx` is confirmed working for years 2024, 2025, and 2026. The year-fallback logic (try current year, fall back to prior year on 404) is straightforward. The XLSX structure is stable: headers are on row 3, data starts row 4, and the first worksheet is always used.

**Primary recommendation:** Use ExcelJS to parse the XLSX (headers on row 3, data from row 4), fetch Swedish municipality names from the Statistics Finland Classification API with `lang=sv`, join on the 3-digit municipality code, and write a flat JSON array to `public/data/postal-codes.json`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Build-time script parses Statistics Finland XLSX and outputs postal codes JSON | ExcelJS 4.4.0 reads the XLSX; `tsx` runs the TypeScript script; `prebuild` npm lifecycle writes to `public/data/postal-codes.json` |
| DATA-02 | Script extracts: postal_code, postal_area_name (fi), postal_area_name_sv, municipality_name | XLSX columns 1–5 (row 3 headers): Postinumeroalue, Postinumeroalueen nimi, Postinumeroalueen nimi (sv), Kunta (code), Kunnan nimi. Swedish municipality name comes from the Classification API joined on municipality code. |
| DATA-03 | Script dynamically uses the current year in the XLSX download URL | Confirmed URL pattern: `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx`. 2024, 2025, 2026 all return 200. 2027 returns 404. Year-fallback logic: try `new Date().getFullYear()`, fall back to `year - 1` on non-200 response. |
| DATA-04 | Swedish municipality names are sourced and included in the postal codes dataset | Statistics Finland Classification API: `https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_{year}0101/classificationItems?content=data&meta=max&lang=sv&format=json` returns all 308 municipalities with Swedish names. No empty entries confirmed. Join on 3-digit municipality code. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| exceljs | 4.4.0 | Parse Statistics Finland XLSX | Actively maintained (Dec 2024 release). TypeScript types included. Reads `.xlsx` files reliably. Alternative xlsx/SheetJS has been stuck at 0.18.5 since March 2022. |
| tsx | latest (~4.x) | Run TypeScript scripts directly in Node.js | Zero-config TypeScript execution — no separate compile step. Standard for Next.js project scripts. `npx tsx scripts/generate-postal-codes.ts` runs directly. |
| node `fetch` (built-in) | Node 18+ | Download XLSX and fetch Classification API | Node 18+ (required by Next.js) ships native fetch. No polyfill needed. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.9.x (bundled with Next.js) | Type safety for the script | Always — Next.js project already has TypeScript configured. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| exceljs | xlsx (SheetJS) | xlsx is more widely documented but unmaintained since 2022. exceljs is the safer long-term choice for a project that will re-run this script annually. |
| Statistics Finland Classification API | DVV municipality register, manual lookup table | DVV data is not clearly accessible as a free API. The Classification API is official, free, no auth, and has been available since before 2020. Manual lookup tables go stale. |
| Native `fetch` | `axios`, `node-fetch` | node-fetch is a polyfill for Node < 18; axios adds a dependency. Native fetch is sufficient. |

**Installation:**
```bash
npm install -D exceljs tsx
```

---

## Architecture Patterns

### Recommended Project Structure

```
posti-days/
├── scripts/
│   └── generate-postal-codes.ts    # The entire Phase 1 deliverable
├── public/
│   └── data/
│       └── postal-codes.json       # Generated output (committed to repo)
└── package.json                    # prebuild script wires this in
```

### Pattern 1: Year-Fallback XLSX Download

**What:** Try downloading the current year's XLSX URL. If the response is not 200 (Statistics Finland hasn't published the year's file yet), fall back to the prior year. Log which year was used.

**When to use:** Every time the script runs. The fallback handles the January gap before Statistics Finland publishes the new year's file.

**Example:**
```typescript
// Source: verified against live URL behavior (2027 → 404, 2026/2025/2024 → 200)
async function downloadXlsx(): Promise<ArrayBuffer> {
  const currentYear = new Date().getFullYear()
  for (const year of [currentYear, currentYear - 1]) {
    const url = `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_${year}_fi.xlsx`
    const response = await fetch(url)
    if (response.ok) {
      console.log(`Using Statistics Finland XLSX: year ${year}`)
      return response.arrayBuffer()
    }
    console.warn(`XLSX for year ${year} not available (${response.status}), trying prior year...`)
  }
  throw new Error('Could not download Statistics Finland XLSX for current or prior year')
}
```

### Pattern 2: ExcelJS XLSX Parsing (Headers on Row 3)

**What:** The XLSX has a merged-cell title on row 1, a note on row 2, and the actual column headers on row 3. Data starts at row 4. Use `sheet.worksheets[0]` (first worksheet) — do not look up by sheet name, as the name differs between years (`postinumero-kunta-avain 2025` vs `taul1` in 2026).

**When to use:** When iterating all postal code entries.

**Example:**
```typescript
// Source: verified against real 2025 and 2026 XLSX files
import ExcelJS from 'exceljs'

async function parseXlsx(buffer: ArrayBuffer): Promise<PostalCodeRow[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]  // Use index, NOT name — name changes by year

  const rows: PostalCodeRow[] = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 4) return  // Skip rows 1 (title), 2 (note), 3 (headers)
    const postalCode = String(row.getCell(1).value ?? '').trim()
    const areaNameFi = String(row.getCell(2).value ?? '').trim()
    const areaNameSv = String(row.getCell(3).value ?? '').trim()
    const municipalityCode = String(row.getCell(4).value ?? '').padStart(3, '0')
    const municipalityNameFi = String(row.getCell(5).value ?? '').trim()
    if (postalCode) {
      rows.push({ postalCode, areaNameFi, areaNameSv, municipalityCode, municipalityNameFi })
    }
  })
  return rows
}
```

### Pattern 3: Fetch Swedish Municipality Names from Statistics Finland Classification API

**What:** The Classification API returns Swedish names for all 308 municipalities in one request. Join on the 3-digit municipality code.

**When to use:** After parsing the XLSX. The XLSX has `Kunta` (municipality code, 3 digits e.g. `"091"`) and `Kunnan nimi` (Finnish name). There is NO Swedish municipality name column in the XLSX.

**Key detail:** The classification ID includes the year in the format `kunta_1_{YEAR}0101`. Use the same year that the XLSX was downloaded from to ensure alignment.

**Example:**
```typescript
// Source: verified against live API — 308 municipalities, 0 empty Swedish names
async function fetchSwedishMunicipalityNames(year: number): Promise<Map<string, string>> {
  const url = `https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_${year}0101/classificationItems?content=data&meta=max&lang=sv&format=json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch Swedish municipality names: ${response.status}`)
  }
  const items: ClassificationItem[] = await response.json()
  const map = new Map<string, string>()
  for (const item of items) {
    const code = item.code.padStart(3, '0')
    const name = item.classificationItemNames?.[0]?.name ?? ''
    if (name) map.set(code, name)
  }
  return map
}
```

### Pattern 4: Output JSON Structure and npm Script Wiring

**What:** Write a flat JSON array to `public/data/postal-codes.json`. Register the script as `generate-postal-codes` and also wire as `prebuild` in `package.json`.

**Example:**
```typescript
// Output JSON structure (one entry per postal code):
interface PostalCodeEntry {
  postal_code: string           // e.g. "00100"
  postal_area_name: string      // Finnish: "Helsinki keskusta - Etu-Töölö"
  postal_area_name_sv: string   // Swedish: "Helsingfors centrum - Främre Tölö"
  municipality_name: string     // Finnish: "Helsinki"
  municipality_name_sv: string  // Swedish: "Helsingfors"
}
```

```json
// package.json scripts section:
{
  "scripts": {
    "generate-postal-codes": "tsx scripts/generate-postal-codes.ts",
    "prebuild": "npm run generate-postal-codes",
    "build": "next build"
  }
}
```

### Anti-Patterns to Avoid

- **Accessing the XLSX by worksheet name:** Sheet name is `"postinumero-kunta-avain 2025"` in the 2025 file but `"taul1"` in the 2026 file. Always use `workbook.worksheets[0]` (first worksheet by index).
- **Treating row 1 as headers:** The real column headers are on row 3. Row 1 is a merged title cell, row 2 is a methodology note. Data starts at row 4.
- **Using municipality code as a string without padding:** The XLSX value is e.g. `"091"` but must be treated as a 3-digit padded string to match the Classification API `code` field.
- **Importing the output JSON as a module:** The JSON will be ~200–300 KB. Import it in a client component and Webpack/Turbopack bundles it into the JS payload. Use `fetch('/data/postal-codes.json')` in the client instead.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XLSX parsing | Custom binary parser | ExcelJS | XLSX is a ZIP of XML files; cell types, merged cells, and formula evaluation make hand-rolling a months-long project |
| Swedish municipality name lookup | Hardcoded mapping table or web scraping | Statistics Finland Classification API | Municipalities change names; the official API is always current. A hardcoded table will silently go stale after municipal mergers. |
| TypeScript script runner | Compile with `tsc` then `node dist/` | `tsx` | Two-step compile + run creates drift; `tsx` runs TypeScript directly with zero config |

**Key insight:** Both data sources (XLSX and Classification API) are official, free, no-auth, and stable. Don't try to consolidate or replace them — they serve different data that the project genuinely needs from both.

---

## Common Pitfalls

### Pitfall 1: XLSX Year Rollover — 404 Before Statistics Finland Publishes New File

**What goes wrong:** Script runs in early January, tries year N, gets 404, crashes the build.

**Why it happens:** Statistics Finland does not publish the new year's XLSX on January 1st. The exact publication date varies by year. In 2026 (the current year at time of writing), the 2026 file IS available as of March 2026, but this may not be true in January.

**How to avoid:** Implement the year-fallback loop: try `currentYear`, then `currentYear - 1`. Log which year was used so it's visible in build output. Do NOT silently fall back.

**Warning signs:** Script exits with a fetch error or 404 in January/February during a new calendar year.

---

### Pitfall 2: Swedish Municipality Names Missing or Empty in Output

**What goes wrong:** Output JSON has null or empty `municipality_name_sv` fields. Autocomplete shows blank municipality group headers in Swedish UI.

**Why it happens:** The XLSX has no Swedish municipality name column. If the Classification API call is skipped, commented out, or fails silently, the merge step produces empty strings.

**How to avoid:**
- After writing the JSON, validate that no entry has a missing `municipality_name_sv`.
- Add a guard: throw an error if any municipality code from the XLSX does not have a matching Swedish name from the API.
- The API is reliable: 308 municipalities, all have Swedish names, tested live.

**Warning signs:** `grep -c '"municipality_name_sv":""' public/data/postal-codes.json` returns non-zero.

---

### Pitfall 3: Worksheet Name Mismatch Between Years

**What goes wrong:** Script works with 2025 XLSX (sheet name `"postinumero-kunta-avain 2025"`) but silently fails or reads the wrong sheet with the 2026 XLSX (sheet name `"taul1"`).

**Why it happens:** Statistics Finland does not guarantee a stable sheet name. Confirmed different names between the 2025 and 2026 files.

**How to avoid:** Always use `workbook.worksheets[0]` (first worksheet by array index), never look up by name.

**Warning signs:** `rowCount` is 0 or 1; no postal codes emitted; no error thrown.

---

### Pitfall 4: Municipality Code Padding Mismatch

**What goes wrong:** XLSX has `"091"` but the Classification API returns `code: "091"`. If either side loses leading zeros (e.g. parsed as number `91`), the join silently misses municipalities.

**Why it happens:** ExcelJS may return the cell value as a number (91) instead of a string ("091") depending on cell format. The Classification API consistently returns zero-padded strings.

**How to avoid:** Always convert the municipality code to string and call `.padStart(3, '0')` before using it as a map key.

**Warning signs:** Some municipalities have Swedish names, others don't; the count of matched entries is less than 308.

---

### Pitfall 5: Classification API Year Not Matching XLSX Year

**What goes wrong:** XLSX is downloaded for year 2025 (fallback), but Swedish names are fetched from `kunta_1_20260101`. If a municipality merged or changed Swedish name between years, the join either fails or maps wrong names.

**Why it happens:** Municipal mergers happen: Finland's municipality count changed between some years. The XLSX year and the Classification API year must match.

**How to avoid:** Track which year the XLSX was downloaded for, and use the same year in the Classification API URL: `kunta_1_{xlsxYear}0101`.

**Warning signs:** Fewer than 308 municipalities matched, or warning that a municipality code was not found in the Swedish names map.

---

## Code Examples

Verified patterns from official sources and live testing:

### Full Script Flow (Top-Level)
```typescript
// scripts/generate-postal-codes.ts
import ExcelJS from 'exceljs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface PostalCodeEntry {
  postal_code: string
  postal_area_name: string
  postal_area_name_sv: string
  municipality_name: string
  municipality_name_sv: string
}

interface ClassificationItem {
  code: string
  classificationItemNames: Array<{ lang: string; langName: string; name: string }>
}

async function downloadXlsx(): Promise<{ buffer: ArrayBuffer; year: number }> {
  const currentYear = new Date().getFullYear()
  for (const year of [currentYear, currentYear - 1]) {
    const url = `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_${year}_fi.xlsx`
    const res = await fetch(url)
    if (res.ok) {
      console.log(`Downloaded XLSX for year ${year}`)
      return { buffer: await res.arrayBuffer(), year }
    }
    console.warn(`XLSX year ${year} returned ${res.status}, trying ${year - 1}`)
  }
  throw new Error('Statistics Finland XLSX unavailable for current and prior year')
}

async function fetchSwedishMunicipalityNames(year: number): Promise<Map<string, string>> {
  const url = `https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_${year}0101/classificationItems?content=data&meta=max&lang=sv&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Swedish municipality API returned ${res.status}`)
  const items: ClassificationItem[] = await res.json()
  const map = new Map<string, string>()
  for (const item of items) {
    map.set(item.code.padStart(3, '0'), item.classificationItemNames?.[0]?.name ?? '')
  }
  return map
}

async function parseXlsx(buffer: ArrayBuffer, svNames: Map<string, string>): Promise<PostalCodeEntry[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]  // Index 0 — never use sheet name

  const entries: PostalCodeEntry[] = []
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 4) return  // Rows 1-3: title, note, headers
    const postalCode = String(row.getCell(1).value ?? '').trim()
    if (!postalCode || postalCode.length !== 5) return
    const municipalityCode = String(row.getCell(4).value ?? '').padStart(3, '0')
    const municipalityNameSv = svNames.get(municipalityCode)
    if (!municipalityNameSv) {
      throw new Error(`No Swedish name for municipality code ${municipalityCode}`)
    }
    entries.push({
      postal_code: postalCode,
      postal_area_name: String(row.getCell(2).value ?? '').trim(),
      postal_area_name_sv: String(row.getCell(3).value ?? '').trim(),
      municipality_name: String(row.getCell(5).value ?? '').trim(),
      municipality_name_sv: municipalityNameSv,
    })
  })
  return entries
}

async function main() {
  const { buffer, year } = await downloadXlsx()
  const svNames = await fetchSwedishMunicipalityNames(year)
  const entries = await parseXlsx(buffer, svNames)
  console.log(`Parsed ${entries.length} postal code entries`)
  const outDir = join(process.cwd(), 'public', 'data')
  await mkdir(outDir, { recursive: true })
  const outPath = join(outDir, 'postal-codes.json')
  await writeFile(outPath, JSON.stringify(entries, null, 2))
  console.log(`Written to ${outPath}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

### Verifying the Output
```bash
# Count entries
node -e "const d=require('./public/data/postal-codes.json'); console.log(d.length)"
# Check for empty Swedish municipality names
node -e "const d=require('./public/data/postal-codes.json'); const bad=d.filter(x=>!x.municipality_name_sv); console.log('Empty sv municipality names:', bad.length)"
# Spot-check a known bilingual city
node -e "const d=require('./public/data/postal-codes.json'); console.log(d.find(x=>x.postal_code==='00100'))"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| xlsx (SheetJS) for XLSX parsing | ExcelJS 4.4.0 | SheetJS community edition stalled at 0.18.5 since March 2022 | ExcelJS is the maintained alternative for new projects |
| `ts-node` for TypeScript scripts | `tsx` | 2022–2023 ecosystem shift | `tsx` is faster, ESM-compatible, and requires zero configuration |
| Compiling TypeScript scripts separately (`tsc`) | Direct `tsx` execution | Same shift as above | No `dist/` directory to manage, no tsconfig separate from the app |

**Deprecated/outdated:**
- `xlsx` (SheetJS community): No major npm releases since March 2022. Still works for basic cases, but lacks active maintenance and TypeScript improvements.
- `ts-node`: Still functional but `tsx` is the ecosystem preference for 2025+.

---

## Open Questions

1. **Should `public/data/postal-codes.json` be committed to the repo or gitignored?**
   - What we know: Both approaches are valid. Committing means CI/Vercel builds don't re-download XLSX on every deploy. Gitignoring means the file is always regenerated from the authoritative source.
   - What's unclear: Whether the project has a CI pipeline where re-downloading matters.
   - Recommendation: Commit the generated JSON for simplicity. Add a comment in the script that it can be regenerated with `npm run generate-postal-codes`. The file is ~200–300 KB — acceptable.

2. **What happens if the Statistics Finland Classification API is unavailable during the build?**
   - What we know: The API is a government service with no stated SLA. It has been stable historically.
   - What's unclear: Whether Vercel's build environment can reach `api.stat.fi` without issues.
   - Recommendation: If the JSON is committed to the repo, the `prebuild` step becomes optional (only needed for regeneration). This is the safest approach — the build doesn't fail due to an external API dependency.

---

## Sources

### Primary (HIGH confidence)

- Live HTTP check: `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx` — 2024, 2025, 2026 all return 200; 2027 returns 404. Verified 2026-03-03.
- Live XLSX inspection: Downloaded 2025 XLSX (295 KB), downloaded 2026 XLSX (247 KB). Both confirmed: headers on row 3, data from row 4, 5 relevant columns (postal code, area FI, area SV, municipality code, municipality FI). No Swedish municipality name column. Verified 2026-03-03.
- 2025 XLSX row count: 3029 total rows, 3026 data rows (postal code entries).
- 2026 XLSX row count: 3021 total rows. Sheet name `"taul1"` (differs from 2025).
- Statistics Finland Classification API: `https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_20260101/classificationItems?content=data&meta=max&lang=sv&format=json` returns 308 items, all with Swedish names, 0 empty. Verified 2026-03-03.
- Swedish name samples confirmed correct: Helsinki → Helsingfors, Espoo → Esbo, Tampere → Tammerfors, Oulu → Uleåborg, Turku → Åbo.
- Classification API year pattern confirmed: `kunta_1_20200101` through `kunta_1_20260101` all exist.
- ExcelJS `eachRow` iteration pattern with `includeEmpty: false` and `row.getCell(n)` verified against real files.

### Secondary (MEDIUM confidence)

- Statistics Finland Paavo service page (`stat.fi/tup/paavo/index_en.html`) — confirmed XLSX files available for 2015–2026, also confirmed new media.stat.fi URLs for XLSX (the old `stat.fi/media/uploads/tup/paavo/` pattern is confirmed live via HTTP checks).
- ExcelJS npm package — version 4.4.0, last published Dec 2024. Verified via npm.
- `tsx` package — verified as the standard TypeScript script runner in the existing project stack research (STACK.md).

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified live, ExcelJS confirmed working against real XLSX files
- Architecture: HIGH — URL behavior, XLSX structure, and API responses all verified from live sources in this session
- Pitfalls: HIGH — all pitfalls grounded in observed differences between the 2025 and 2026 XLSX files or confirmed API behavior

**Research date:** 2026-03-03
**Valid until:** 2027-03-03 (XLSX URL pattern is annual; check that Statistics Finland hasn't changed their URL scheme)
