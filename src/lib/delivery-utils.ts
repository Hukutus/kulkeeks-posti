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
 * Returns an array of 7 ISO date strings (YYYY-MM-DD) from Monday to Sunday
 * of the current week in Finnish time. Uses Intl.DateTimeFormat to handle
 * UTC+2/UTC+3 (DST) correctly on Vercel.
 */
export function getCurrentWeekISO(): string[] {
  const now = new Date()

  // Get today's date components in Finnish timezone
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: FINNISH_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = fmt.formatToParts(now)
  const todayStr = `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}-${parts.find((p) => p.type === 'day')!.value}`
  const weekday = parts.find((p) => p.type === 'weekday')!.value // 'Mon', 'Tue', etc.

  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  }
  const mondayOffset = weekdayMap[weekday] ?? 0 // 0=Mon, 6=Sun

  // Work in UTC midnight of the Finnish "today" to avoid DST edge cases
  const todayMidnightUTC = new Date(`${todayStr}T00:00:00Z`)

  const week: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayMidnightUTC)
    d.setUTCDate(todayMidnightUTC.getUTCDate() - mondayOffset + i)
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getUTCDate()).padStart(2, '0')
    week.push(`${year}-${month}-${dayStr}`)
  }

  return week
}

/**
 * Filters an array of delivery date strings to only those within the given week.
 * @param deliveryDates - Array of YYYY-MM-DD date strings from the API
 * @param weekISO - Array of 7 YYYY-MM-DD date strings (Mon-Sun) from getCurrentWeekISO
 * @returns Filtered array containing only dates present in weekISO
 */
export function filterWeekDeliveries(deliveryDates: string[], weekISO: string[]): string[] {
  const weekSet = new Set(weekISO)
  return deliveryDates.filter((date) => weekSet.has(date))
}

/**
 * Returns true if todayISO is present in the delivery dates array.
 * @param deliveryDates - Array of YYYY-MM-DD delivery date strings
 * @param todayISO - Today's date as YYYY-MM-DD string
 */
export function isDeliveryDay(deliveryDates: string[], todayISO: string): boolean {
  return deliveryDates.includes(todayISO)
}
