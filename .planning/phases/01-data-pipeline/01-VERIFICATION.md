---
phase: 01-data-pipeline
verified: 2026-03-03T12:45:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 1: Data Pipeline Verification Report

**Phase Goal:** Build the data pipeline that fetches, parses, and merges postal code data from Statistics Finland into a single JSON file consumed by the front-end.
**Verified:** 2026-03-03T12:45:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Running `npm run generate-postal-codes` produces `public/data/postal-codes.json` without errors | VERIFIED | `package.json` wires `tsx scripts/generate-postal-codes.ts`; `public/data/postal-codes.json` exists with 3018 entries; script exits via `process.exit(1)` only on error |
| 2 | The JSON contains postal_code, postal_area_name, postal_area_name_sv, municipality_name, and municipality_name_sv for every entry | VERIFIED | `node` validation: 3018 entries, 0 with missing fields, 0 with empty `municipality_name_sv`; every entry has exactly 5 keys |
| 3 | The script tries the current year XLSX URL first, falls back to prior year on non-200 response | VERIFIED | `generate-postal-codes.ts` line 25: `for (const year of [currentYear, currentYear - 1])` with `if (res.ok) return`; throws only after both fail |
| 4 | Swedish municipality names are present and non-empty for every entry in the output | VERIFIED | 0 entries with empty `municipality_name_sv`; spot-check 00100 → `municipality_name_sv: "Helsingfors"` confirmed |
| 5 | The output contains ~3000+ postal code entries (matches Statistics Finland dataset) | VERIFIED | Actual entry count: 3018 (exceeds the 3000 threshold) |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/generate-postal-codes.ts` | Build-time postal code data generation script (min 60 lines) | VERIFIED | 145 lines; contains all 4 functions (`downloadXlsx`, `fetchSwedishMunicipalityNames`, `parseXlsx`, `main`) plus both interfaces |
| `public/data/postal-codes.json` | Generated postal code dataset containing `postal_code` | VERIFIED | 3018 entries; all 5 required fields present in every entry; no empty values |
| `package.json` | Project config with `generate-postal-codes` and `prebuild` scripts | VERIFIED | `"generate-postal-codes": "tsx scripts/generate-postal-codes.ts"` and `"prebuild": "npm run generate-postal-codes"` both present |

All three artifacts: **EXISTS**, **SUBSTANTIVE**, **WIRED**.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/generate-postal-codes.ts` | `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_{year}_fi.xlsx` | fetch with year-fallback loop | WIRED | Line 26: URL contains `alueryhmittely_posnro_${year}_fi.xlsx`; line 25 establishes the fallback `for` loop; `res.ok` check and `res.arrayBuffer()` response consumed |
| `scripts/generate-postal-codes.ts` | `https://api.stat.fi/classificationservice` | fetch for Swedish municipality names | WIRED | Line 43: full Classification API URL with `kunta_1_${year}0101/classificationItems`; response parsed into `Map<string, string>`; returned and consumed by `parseXlsx` |
| `package.json` | `scripts/generate-postal-codes.ts` | npm script wiring | WIRED | Line 10 of `package.json`: `"generate-postal-codes": "tsx scripts/generate-postal-codes.ts"`; also wired as `prebuild` so `next build` triggers it automatically |

All three key links: **WIRED**.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DATA-01 | 01-01-PLAN.md | Build-time script parses Statistics Finland XLSX and outputs postal codes JSON | SATISFIED | `generate-postal-codes.ts` uses ExcelJS to parse XLSX; `prebuild` script writes `public/data/postal-codes.json`; `tsx` runs the script at build time |
| DATA-02 | 01-01-PLAN.md | Script extracts: postal_code, postal_area_name (fi), postal_area_name_sv, municipality_name | SATISFIED | `parseXlsx` extracts all 5 fields from XLSX columns 1-5; `municipality_name_sv` joined from Classification API; 3018 entries all validated non-empty |
| DATA-03 | 01-01-PLAN.md | Script dynamically uses the current year in the XLSX download URL | SATISFIED | `downloadXlsx` uses `new Date().getFullYear()` and iterates `[currentYear, currentYear - 1]`; URL uses template literal with `${year}` |
| DATA-04 | 01-01-PLAN.md | Swedish municipality names are sourced and included in the postal codes dataset | SATISFIED | `fetchSwedishMunicipalityNames(year)` calls Classification API with `lang=sv`; result joined into every entry as `municipality_name_sv`; 0 empty values confirmed |

All 4 requirements: **SATISFIED**. No orphaned requirements (REQUIREMENTS.md traceability table maps DATA-01 through DATA-04 exclusively to Phase 1).

---

### Anti-Patterns Found

None. Scanned `scripts/generate-postal-codes.ts`, `scripts/generate-postal-codes.test.ts`, and `package.json` for:
- TODO/FIXME/XXX/HACK/PLACEHOLDER comments: none
- Empty implementations (`return null`, `return {}`, `return []`, `=> {}`): none
- Console.log-only function bodies: none (console.log calls are all informational, alongside real logic)

---

### Unit Tests

13 tests across 5 suites — all passed (0 failures, 0 skipped):

- Municipality code padding (5 tests): single-digit, two-digit number 91, string "91", already-padded, no-change-for-3-digit
- PostalCodeEntry shape validation (4 tests): valid entry accepted, missing field rejected, extra field rejected, empty string rejected
- Error thrown when Swedish municipality name missing (2 tests): throws on absent code, does not throw on present code
- Municipality code padding during row parsing (1 test): numeric 91 padded to "091" and matched correctly
- Full PostalCodeEntry interface structure (1 test): exactly 5 fields, no extras

---

### Human Verification Required

No items require human verification for this phase. All success criteria are programmatically verifiable:
- Entry count, field presence, and non-empty values checked directly against the JSON file
- Script source code directly inspected for year-fallback logic and worksheet-by-index access
- Unit tests executed and passed

The only aspect that cannot be verified without running the script live against the Statistics Finland servers (fetching the XLSX and Classification API) is whether the remote APIs are reachable — but the generated JSON committed to the repo provides direct evidence that the script ran successfully with real data (3018 entries, Helsingfors confirmed).

---

## Summary

Phase 1 goal is fully achieved. The data pipeline is complete and correct:

- `scripts/generate-postal-codes.ts` (145 lines) implements all four functions with proper year-fallback download, worksheet-by-index access, municipality code padding, Swedish name lookup with integrity check, and JSON output.
- `public/data/postal-codes.json` contains 3018 entries. Every entry has exactly the 5 required fields, all non-empty. Spot-check confirmed: 00100 maps to Helsinki / Helsingfors.
- `package.json` wires the script as both a standalone `generate-postal-codes` command and as a `prebuild` hook that runs automatically before `next build`.
- All 13 unit tests pass, covering the critical municipality code padding logic and error-on-missing-Swedish-name guard.
- All 4 requirements (DATA-01 through DATA-04) are satisfied with direct code evidence.

---

_Verified: 2026-03-03T12:45:00Z_
_Verifier: Claude (gsd-verifier)_
