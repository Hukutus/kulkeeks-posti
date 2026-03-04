import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  getTodayISO,
  getDateRange,
  filterDeliveries,
  isDeliveryDay,
} from './delivery-utils.js'

describe('getTodayISO', () => {
  test('returns a string matching YYYY-MM-DD format', () => {
    const result = getTodayISO()
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
  })

  test('returns local date not UTC (consistent with local Date methods)', () => {
    const result = getTodayISO()
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    assert.equal(result, expected)
  })
})

describe('getDateRange', () => {
  test('returns consecutive dates from start to end inclusive', () => {
    const result = getDateRange('2026-03-04', '2026-03-06')
    assert.deepEqual(result, ['2026-03-04', '2026-03-05', '2026-03-06'])
  })

  test('returns a single date when start equals end', () => {
    const result = getDateRange('2026-03-04', '2026-03-04')
    assert.deepEqual(result, ['2026-03-04'])
  })

  test('returns just the start date when end is before start', () => {
    const result = getDateRange('2026-03-04', '2026-03-03')
    assert.deepEqual(result, ['2026-03-04'])
  })

  test('all returned values match YYYY-MM-DD format', () => {
    const result = getDateRange('2026-03-04', '2026-03-10')
    for (const d of result) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('returns correct number of days', () => {
    const result = getDateRange('2026-03-04', '2026-03-10')
    assert.equal(result.length, 7)
  })

  test('days are consecutive (each day is 1 day after the previous)', () => {
    const result = getDateRange('2026-03-04', '2026-03-10')
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1] + 'T00:00:00Z')
      const curr = new Date(result[i] + 'T00:00:00Z')
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      assert.equal(diffDays, 1, `Days not consecutive: ${result[i - 1]} -> ${result[i]}`)
    }
  })
})

describe('filterDeliveries', () => {
  test('returns only dates within the given date range array', () => {
    const dateRange = [
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-04', '2026-03-05', '2026-03-10']
    const result = filterDeliveries(deliveryDates, dateRange)
    assert.deepEqual(result, ['2026-03-04', '2026-03-05'])
  })

  test('returns empty array when no delivery dates fall within the range', () => {
    const dateRange = [
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-10', '2026-03-11']
    const result = filterDeliveries(deliveryDates, dateRange)
    assert.deepEqual(result, [])
  })

  test('returns all delivery dates when all fall within the range', () => {
    const dateRange = [
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-05', '2026-03-07']
    const result = filterDeliveries(deliveryDates, dateRange)
    assert.deepEqual(result, ['2026-03-05', '2026-03-07'])
  })

  test('returns empty array when delivery dates is empty', () => {
    const dateRange = ['2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08']
    const result = filterDeliveries([], dateRange)
    assert.deepEqual(result, [])
  })
})

describe('isDeliveryDay', () => {
  test('returns true when todayISO is in the delivery dates array', () => {
    const result = isDeliveryDay(['2026-03-03', '2026-03-04'], '2026-03-03')
    assert.equal(result, true)
  })

  test('returns false when todayISO is NOT in the delivery dates array', () => {
    const result = isDeliveryDay(['2026-03-03', '2026-03-04'], '2026-03-05')
    assert.equal(result, false)
  })

  test('returns false when delivery dates array is empty', () => {
    const result = isDeliveryDay([], '2026-03-03')
    assert.equal(result, false)
  })

  test('returns true for the second date in the array', () => {
    const result = isDeliveryDay(['2026-03-03', '2026-03-04'], '2026-03-04')
    assert.equal(result, true)
  })
})
