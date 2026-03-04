const FINNISH_TZ = 'Europe/Helsinki'

/**
 * Returns today's date as YYYY-MM-DD string in Finnish time (Europe/Helsinki).
 * Uses Intl.DateTimeFormat to handle UTC+2/UTC+3 (DST) correctly on Vercel.
 */
export function getTodayISO(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FINNISH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = parts.find((p) => p.type === 'year')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  const day = parts.find((p) => p.type === 'day')!.value
  return `${year}-${month}-${day}`
}

/**
 * Returns an array of consecutive ISO date strings (YYYY-MM-DD) from startISO through endISO inclusive.
 * If endISO is before startISO, returns just [startISO].
 * @param startISO - Start date as YYYY-MM-DD string
 * @param endISO - End date as YYYY-MM-DD string
 */
export function getDateRange(startISO: string, endISO: string): string[] {
  const startMidnight = new Date(`${startISO}T00:00:00Z`)
  const endMidnight = new Date(`${endISO}T00:00:00Z`)

  if (endMidnight <= startMidnight && startISO !== endISO) {
    return [startISO]
  }

  const dates: string[] = []
  const current = new Date(startMidnight)

  while (current <= endMidnight) {
    const year = current.getUTCFullYear()
    const month = String(current.getUTCMonth() + 1).padStart(2, '0')
    const day = String(current.getUTCDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

/**
 * Filters an array of delivery date strings to only those within the given date range.
 * @param deliveryDates - Array of YYYY-MM-DD date strings from the API
 * @param dateRange - Array of YYYY-MM-DD date strings representing the date range
 * @returns Filtered array containing only dates present in dateRange
 */
export function filterDeliveries(deliveryDates: string[], dateRange: string[]): string[] {
  const rangeSet = new Set(dateRange)
  return deliveryDates.filter((date) => rangeSet.has(date))
}

/**
 * Returns true if todayISO is present in the delivery dates array.
 * @param deliveryDates - Array of YYYY-MM-DD delivery date strings
 * @param todayISO - Today's date as YYYY-MM-DD string
 */
export function isDeliveryDay(deliveryDates: string[], todayISO: string): boolean {
  return deliveryDates.includes(todayISO)
}
