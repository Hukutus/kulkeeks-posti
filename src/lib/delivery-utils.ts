/**
 * Returns today's date as YYYY-MM-DD string using local time.
 * Uses local date methods (not toISOString which returns UTC).
 */
export function getTodayISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns an array of 7 ISO date strings (YYYY-MM-DD) from Monday to Sunday
 * of the current week. Uses (dayOfWeek + 6) % 7 to convert JS day-of-week
 * (0=Sun, 1=Mon...) to Monday-indexed offset (0=Mon, 6=Sun).
 */
export function getCurrentWeekISO(): string[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = (dayOfWeek + 6) % 7 // 0=Mon, 1=Tue, ..., 6=Sun

  const monday = new Date(now)
  monday.setDate(now.getDate() - mondayOffset)

  const week: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    const year = day.getFullYear()
    const month = String(day.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day.getDate()).padStart(2, '0')
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
