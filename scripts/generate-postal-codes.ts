import ExcelJS from 'exceljs'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface PostalCodeEntry {
  postal_code: string           // "00100"
  postal_area_name: string      // "Helsinki keskusta - Etu-Töölö"
  postal_area_name_sv: string   // "Helsingfors centrum - Främre Tölö"
  municipality_name: string     // "Helsinki"
  municipality_name_sv: string  // "Helsingfors"
}

interface ClassificationItem {
  code: string
  classificationItemNames: Array<{ lang: string; langName: string; name: string }>
}

/**
 * Downloads the Statistics Finland XLSX postal code file.
 * Tries the current year first; falls back to the prior year if not available.
 * Returns both the ArrayBuffer and the year that was successfully downloaded.
 */
async function downloadXlsx(): Promise<{ buffer: ArrayBuffer; year: number }> {
  const currentYear = new Date().getFullYear()
  for (const year of [currentYear, currentYear - 1]) {
    const url = `https://stat.fi/media/uploads/tup/paavo/alueryhmittely_posnro_${year}_fi.xlsx`
    const res = await fetch(url)
    if (res.ok) {
      console.log(`Downloaded Statistics Finland XLSX for year ${year}`)
      return { buffer: await res.arrayBuffer(), year }
    }
    console.warn(`XLSX for year ${year} returned ${res.status}, trying prior year...`)
  }
  throw new Error('Statistics Finland XLSX unavailable for current and prior year')
}

/**
 * Fetches Swedish municipality names from the Statistics Finland Classification API.
 * Uses the same year as the XLSX download to ensure municipality code alignment.
 * Returns a Map from 3-digit padded municipality code to Swedish name.
 */
async function fetchSwedishMunicipalityNames(year: number): Promise<Map<string, string>> {
  const url = `https://api.stat.fi/classificationservice/open/api/classifications/v2/classifications/kunta_1_${year}0101/classificationItems?content=data&meta=max&lang=sv&format=json`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Swedish municipality Classification API returned ${res.status}`)
  }
  const items: ClassificationItem[] = await res.json()
  const map = new Map<string, string>()
  for (const item of items) {
    const code = item.code.padStart(3, '0')
    const name = item.classificationItemNames?.[0]?.name ?? ''
    if (name) map.set(code, name)
  }
  console.log(`Fetched ${map.size} Swedish municipality names for year ${year}`)
  return map
}

/**
 * Parses the XLSX buffer and merges with Swedish municipality names.
 *
 * XLSX structure (stable across years):
 *   Row 1: Merged title cell
 *   Row 2: Methodology note
 *   Row 3: Column headers
 *   Row 4+: Data rows
 *
 * Column layout:
 *   1: postal_code (5-char string)
 *   2: postal_area_name (Finnish)
 *   3: postal_area_name_sv (Swedish)
 *   4: municipality code (3-digit string; may be returned as number by ExcelJS)
 *   5: municipality_name (Finnish)
 *
 * NOTE: Always access worksheet by index [0], never by name — sheet name changes between years.
 * NOTE: ExcelJS .xlsx.load() accepts ArrayBuffer directly (not .loadFromBuffer()).
 */
async function parseXlsx(buffer: ArrayBuffer, svNames: Map<string, string>): Promise<PostalCodeEntry[]> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  // Use index 0, NOT sheet name — name differs between years (e.g. "taul1" vs "postinumero-kunta-avain 2025")
  const sheet = workbook.worksheets[0]

  const entries: PostalCodeEntry[] = []

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // Skip rows 1-3: title, note, headers
    if (rowNumber < 4) return

    const postalCode = String(row.getCell(1).value ?? '').trim()

    // Skip rows without a valid 5-character postal code
    if (!postalCode || postalCode.length !== 5) return

    // Municipality code from column 4 — may be a number (e.g. 91), pad to 3 digits
    const municipalityCode = String(row.getCell(4).value ?? '').padStart(3, '0')

    const municipalityNameSv = svNames.get(municipalityCode)
    if (!municipalityNameSv) {
      throw new Error(
        `No Swedish municipality name found for code "${municipalityCode}" (postal code ${postalCode}). ` +
        `Verify that the Classification API year matches the XLSX year.`
      )
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

/**
 * Main entrypoint: downloads XLSX, fetches Swedish municipality names,
 * parses and merges data, writes public/data/postal-codes.json.
 */
async function main() {
  console.log('Starting postal code data generation...')

  const { buffer, year } = await downloadXlsx()
  const svNames = await fetchSwedishMunicipalityNames(year)
  const entries = await parseXlsx(buffer, svNames)

  console.log(`Parsed ${entries.length} postal code entries`)

  const outDir = join(process.cwd(), 'public', 'data')
  await mkdir(outDir, { recursive: true })

  const outPath = join(outDir, 'postal-codes.json')
  await writeFile(outPath, JSON.stringify(entries, null, 2), 'utf-8')

  console.log(`Written to ${outPath}`)
  console.log('Done.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
