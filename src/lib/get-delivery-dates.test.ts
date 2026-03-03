import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { getDeliveryDates, DeliverySchema } from './get-delivery-dates.js'

const VALID_RESPONSE = [
  {
    postalCode: '00100',
    deliveryDates: ['2026-03-03', '2026-03-04', '2026-03-05'],
  },
]

describe('getDeliveryDates', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })

  test('Test 1: returns success with data when upstream returns valid JSON', async () => {
    global.fetch = async () =>
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 })

    const result = await getDeliveryDates('00100')
    assert.equal(result.success, true)
    if (!result.success) throw new Error('Expected success')
    assert.equal(result.data.postalCode, '00100')
    assert.deepEqual(result.data.deliveryDates, ['2026-03-03', '2026-03-04', '2026-03-05'])

    global.fetch = originalFetch
  })

  test('Test 2: returns failure when upstream returns non-200', async () => {
    global.fetch = async () => new Response('Not Found', { status: 404 })

    const result = await getDeliveryDates('00100')
    assert.equal(result.success, false)
    if (result.success) throw new Error('Expected failure')
    assert.ok(typeof result.error === 'string')
    assert.ok(result.error.length > 0)

    global.fetch = originalFetch
  })

  test('Test 3: returns failure when upstream returns malformed JSON (Zod fails)', async () => {
    const malformed = [{ postalCode: '00100', wrongField: 'bad' }]
    global.fetch = async () =>
      new Response(JSON.stringify(malformed), { status: 200 })

    const result = await getDeliveryDates('00100')
    assert.equal(result.success, false)
    if (result.success) throw new Error('Expected failure')
    assert.ok(typeof result.error === 'string')

    global.fetch = originalFetch
  })

  test('Test 4: returns failure when upstream returns empty array []', async () => {
    global.fetch = async () =>
      new Response(JSON.stringify([]), { status: 200 })

    const result = await getDeliveryDates('00100')
    assert.equal(result.success, false)
    if (result.success) throw new Error('Expected failure')
    assert.ok(typeof result.error === 'string')

    global.fetch = originalFetch
  })

  test('Test 5: returns failure when fetch throws (network error)', async () => {
    global.fetch = async () => {
      throw new Error('Network error')
    }

    const result = await getDeliveryDates('00100')
    assert.equal(result.success, false)
    if (result.success) throw new Error('Expected failure')
    assert.ok(typeof result.error === 'string')

    global.fetch = originalFetch
  })
})

describe('DeliverySchema', () => {
  test('Test 6: validates correct shape', () => {
    const result = DeliverySchema.safeParse(VALID_RESPONSE)
    assert.equal(result.success, true)
    if (!result.success) throw new Error('Expected valid parse')
    assert.equal(result.data.length, 1)
    assert.equal(result.data[0].postalCode, '00100')
    assert.deepEqual(result.data[0].deliveryDates, ['2026-03-03', '2026-03-04', '2026-03-05'])
  })

  test('Test 6b: rejects when deliveryDates field is missing', () => {
    const invalid = [{ postalCode: '00100' }]
    const result = DeliverySchema.safeParse(invalid)
    assert.equal(result.success, false)
  })

  test('Test 6c: rejects when postalCode field is missing', () => {
    const invalid = [{ deliveryDates: ['2026-03-03'] }]
    const result = DeliverySchema.safeParse(invalid)
    assert.equal(result.success, false)
  })

  test('Test 6d: rejects non-array input', () => {
    const result = DeliverySchema.safeParse({ postalCode: '00100', deliveryDates: [] })
    assert.equal(result.success, false)
  })
})
