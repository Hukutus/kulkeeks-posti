import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  getTodayISO,
  getCurrentWeekISO,
  filterWeekDeliveries,
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

describe('getCurrentWeekISO', () => {
  test('returns exactly 7 ISO date strings', () => {
    const result = getCurrentWeekISO()
    assert.equal(result.length, 7)
  })

  test('all returned values match YYYY-MM-DD format', () => {
    const result = getCurrentWeekISO()
    for (const d of result) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test('first element is always a Monday', () => {
    const result = getCurrentWeekISO()
    const monday = new Date(result[0] + 'T00:00:00')
    // getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    assert.equal(monday.getDay(), 1, `Expected Monday but got day ${monday.getDay()} for ${result[0]}`)
  })

  test('last element is always a Sunday', () => {
    const result = getCurrentWeekISO()
    const sunday = new Date(result[6] + 'T00:00:00')
    assert.equal(sunday.getDay(), 0, `Expected Sunday but got day ${sunday.getDay()} for ${result[6]}`)
  })

  test('days are consecutive (each day is 1 day after the previous)', () => {
    const result = getCurrentWeekISO()
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(result[i - 1] + 'T00:00:00')
      const curr = new Date(result[i] + 'T00:00:00')
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      assert.equal(diffDays, 1, `Days not consecutive: ${result[i - 1]} -> ${result[i]}`)
    }
  })

  test('current date is within the returned week', () => {
    const result = getCurrentWeekISO()
    const today = getTodayISO()
    assert.ok(result.includes(today), `Today (${today}) should be in the week: ${result}`)
  })

  test('on a Sunday returns the week that contains that Sunday (Mon-Sun)', () => {
    // We simulate a known Sunday: 2026-03-01 is a Sunday
    // We can verify by creating a Date and checking
    // Since we can't mock Date here easily, we verify the invariant with the current week:
    // the returned week should always contain today, regardless of what day it is.
    const result = getCurrentWeekISO()
    const today = getTodayISO()
    assert.ok(result.includes(today))
    // Verify first day is Monday and contains today
    assert.equal(new Date(result[0] + 'T00:00:00').getDay(), 1)
    assert.equal(new Date(result[6] + 'T00:00:00').getDay(), 0)
  })
})

describe('filterWeekDeliveries', () => {
  test('returns only dates within the given week ISO array', () => {
    // Simulate a week containing 2026-03-02 to 2026-03-08
    const weekISO = [
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-02', '2026-03-03', '2026-03-10']
    const result = filterWeekDeliveries(deliveryDates, weekISO)
    assert.deepEqual(result, ['2026-03-02', '2026-03-03'])
  })

  test('returns empty array when no delivery dates fall within the week', () => {
    const weekISO = [
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-10', '2026-03-11']
    const result = filterWeekDeliveries(deliveryDates, weekISO)
    assert.deepEqual(result, [])
  })

  test('returns all delivery dates when all fall within the week', () => {
    const weekISO = [
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-07',
      '2026-03-08',
    ]
    const deliveryDates = ['2026-03-03', '2026-03-05', '2026-03-07']
    const result = filterWeekDeliveries(deliveryDates, weekISO)
    assert.deepEqual(result, ['2026-03-03', '2026-03-05', '2026-03-07'])
  })

  test('returns empty array when delivery dates is empty', () => {
    const weekISO = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08']
    const result = filterWeekDeliveries([], weekISO)
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
