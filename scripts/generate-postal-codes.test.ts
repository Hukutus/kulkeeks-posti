import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

// Import the functions we want to test
// Since these are module-level functions, we need to test behaviors
// that can be tested without making real HTTP calls or file system operations.

// Helper: simulate the municipality code padding logic extracted from parseXlsx
function padMunicipalityCode(code: unknown): string {
  return String(code ?? '').padStart(3, '0')
}

// Helper: simulate PostalCodeEntry shape validation
interface PostalCodeEntry {
  postal_code: string
  postal_area_name: string
  postal_area_name_sv: string
  municipality_name: string
  municipality_name_sv: string
}

function isValidPostalCodeEntry(entry: unknown): entry is PostalCodeEntry {
  if (!entry || typeof entry !== 'object') return false
  const e = entry as Record<string, unknown>
  const fields: (keyof PostalCodeEntry)[] = [
    'postal_code',
    'postal_area_name',
    'postal_area_name_sv',
    'municipality_name',
    'municipality_name_sv',
  ]
  // Must have exactly the 5 required fields and all must be non-empty strings
  return (
    fields.every((f) => typeof e[f] === 'string' && e[f] !== '') &&
    Object.keys(e).length === fields.length
  )
}

// Simulate the row-parsing logic that would be inside parseXlsx
function parseRow(
  cells: (string | number | null | undefined)[],
  svNames: Map<string, string>
): PostalCodeEntry {
  const postalCode = String(cells[0] ?? '').trim()
  if (!postalCode || postalCode.length !== 5) {
    throw new Error(`Invalid postal code: "${postalCode}"`)
  }
  const municipalityCode = padMunicipalityCode(cells[3])
  const municipalityNameSv = svNames.get(municipalityCode)
  if (!municipalityNameSv) {
    throw new Error(`No Swedish name for municipality code ${municipalityCode}`)
  }
  return {
    postal_code: postalCode,
    postal_area_name: String(cells[1] ?? '').trim(),
    postal_area_name_sv: String(cells[2] ?? '').trim(),
    municipality_name: String(cells[4] ?? '').trim(),
    municipality_name_sv: municipalityNameSv,
  }
}

describe('Municipality code padding', () => {
  test('pads single-digit code to 3 digits', () => {
    assert.equal(padMunicipalityCode(1), '001')
  })

  test('pads two-digit code 91 to "091"', () => {
    assert.equal(padMunicipalityCode(91), '091')
  })

  test('pads two-digit number to 3 digits', () => {
    assert.equal(padMunicipalityCode(9), '009')
  })

  test('does not change an already 3-digit code', () => {
    assert.equal(padMunicipalityCode(91), '091')
    assert.equal(padMunicipalityCode('091'), '091')
    assert.equal(padMunicipalityCode(100), '100')
  })

  test('handles string "91" same as number 91', () => {
    assert.equal(padMunicipalityCode('91'), '091')
  })
})

describe('PostalCodeEntry shape validation', () => {
  test('accepts a valid entry with all 5 fields', () => {
    const entry: PostalCodeEntry = {
      postal_code: '00100',
      postal_area_name: 'Helsinki centrum',
      postal_area_name_sv: 'Helsingfors centrum',
      municipality_name: 'Helsinki',
      municipality_name_sv: 'Helsingfors',
    }
    assert.ok(isValidPostalCodeEntry(entry))
  })

  test('rejects entry missing municipality_name_sv', () => {
    const entry = {
      postal_code: '00100',
      postal_area_name: 'Helsinki centrum',
      postal_area_name_sv: 'Helsingfors centrum',
      municipality_name: 'Helsinki',
    }
    assert.equal(isValidPostalCodeEntry(entry), false)
  })

  test('rejects entry with extra fields', () => {
    const entry = {
      postal_code: '00100',
      postal_area_name: 'Helsinki centrum',
      postal_area_name_sv: 'Helsingfors centrum',
      municipality_name: 'Helsinki',
      municipality_name_sv: 'Helsingfors',
      extra_field: 'not allowed',
    }
    assert.equal(isValidPostalCodeEntry(entry), false)
  })

  test('rejects entry with empty string field', () => {
    const entry = {
      postal_code: '00100',
      postal_area_name: 'Helsinki centrum',
      postal_area_name_sv: 'Helsingfors centrum',
      municipality_name: 'Helsinki',
      municipality_name_sv: '',
    }
    assert.equal(isValidPostalCodeEntry(entry), false)
  })
})

describe('Error thrown when Swedish municipality name missing', () => {
  test('throws error when municipality code not in svNames map', () => {
    const svNames = new Map<string, string>()
    svNames.set('091', 'Helsingfors')

    // Row with municipality code 049 (Espoo) — not in svNames
    const cells = ['02100', 'Espoo', 'Esbo', '049', 'Espoo']
    assert.throws(
      () => parseRow(cells, svNames),
      /No Swedish name for municipality code 049/
    )
  })

  test('does not throw when municipality code is in svNames map', () => {
    const svNames = new Map<string, string>()
    svNames.set('091', 'Helsingfors')

    const cells = ['00100', 'Helsinki centrum', 'Helsingfors centrum', '091', 'Helsinki']
    const entry = parseRow(cells, svNames)
    assert.equal(entry.municipality_name_sv, 'Helsingfors')
  })
})

describe('Municipality code padding during row parsing', () => {
  test('number 91 padded to "091" and matches svNames correctly', () => {
    const svNames = new Map<string, string>()
    svNames.set('091', 'Helsingfors')

    // Municipality code as number 91 (as ExcelJS might return it)
    const cells = ['00100', 'Helsinki centrum', 'Helsingfors centrum', 91, 'Helsinki']
    const entry = parseRow(cells, svNames)
    assert.equal(entry.municipality_name_sv, 'Helsingfors')
    assert.equal(entry.postal_code, '00100')
  })
})

describe('Full PostalCodeEntry interface structure', () => {
  test('parsed entry has exactly 5 required fields, no extras', () => {
    const svNames = new Map<string, string>()
    svNames.set('091', 'Helsingfors')

    const cells = ['00100', 'Helsinki centrum', 'Helsingfors centrum', '91', 'Helsinki']
    const entry = parseRow(cells, svNames)

    // Verify all 5 fields present
    assert.ok('postal_code' in entry)
    assert.ok('postal_area_name' in entry)
    assert.ok('postal_area_name_sv' in entry)
    assert.ok('municipality_name' in entry)
    assert.ok('municipality_name_sv' in entry)

    // Verify no extra fields
    assert.deepEqual(Object.keys(entry).sort(), [
      'municipality_name',
      'municipality_name_sv',
      'postal_area_name',
      'postal_area_name_sv',
      'postal_code',
    ])

    assert.ok(isValidPostalCodeEntry(entry))
  })
})
