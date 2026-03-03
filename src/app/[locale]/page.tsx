import { connection } from 'next/server'
import { getTranslations, getFormatter, setRequestLocale } from 'next-intl/server'
import { getDeliveryDates } from '@/lib/get-delivery-dates'
import {
  getTodayISO,
  getCurrentWeekISO,
  filterWeekDeliveries,
  isDeliveryDay,
} from '@/lib/delivery-utils'
import content from '../../../content.json'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // MUST come before Math.random() to force per-request rendering
  await connection()

  const dialect = content.dialects[Math.floor(Math.random() * content.dialects.length)]

  // TODO Phase 4: replace with resolved postal code
  const result = await getDeliveryDates('00100')

  const t = await getTranslations('Delivery')
  const format = await getFormatter()

  const todayISO = getTodayISO()
  const weekISO = getCurrentWeekISO()

  if (!result.success) {
    return (
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full mx-auto text-center">
          <p className="font-handwriting text-3xl sm:text-4xl text-stone-700 dark:text-stone-300 leading-relaxed mb-6">
            {dialect.question}
          </p>
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
            <p className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t('errorTitle')}
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{result.error}</p>
          </div>
        </div>
      </main>
    )
  }

  const { deliveryDates } = result.data
  const deliveryToday = isDeliveryDay(deliveryDates, todayISO)
  const weekDeliveries = filterWeekDeliveries(deliveryDates, weekISO)
  const weekDeliverySet = new Set(weekDeliveries)

  const answerColor = deliveryToday
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center px-4 py-12 sm:py-16">
      <div className="max-w-sm w-full mx-auto text-center">
        {/* Dialect question */}
        <p className="font-handwriting text-3xl sm:text-4xl text-stone-700 dark:text-stone-300 leading-relaxed">
          {dialect.question}
        </p>

        {/* Main answer — largest element, primary information */}
        <p className={`font-handwriting text-7xl sm:text-8xl font-bold mt-4 ${answerColor}`}>
          {deliveryToday ? dialect.yes : dialect.no}
        </p>

        {/* Dialect metadata */}
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-3 italic">
          {dialect.dialect} — {dialect.region}
        </p>

        {/* Week view card */}
        <div className="mt-10 w-full bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-stone-200 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-3">
            {t('weekTitle')}
          </h2>
          <ul className="space-y-0.5">
            {weekISO.map((iso) => {
              const isDelivery = weekDeliverySet.has(iso)
              const isToday = iso === todayISO
              const dateLabel = format.dateTime(new Date(iso + 'T12:00:00'), {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })

              return (
                <li
                  key={iso}
                  className={`flex items-center gap-3 py-2 px-2 rounded-lg ${
                    isToday ? 'bg-stone-100 dark:bg-stone-800' : ''
                  }`}
                >
                  {/* Delivery indicator */}
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      isDelivery
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                    aria-hidden="true"
                  />

                  {/* Date label */}
                  <span
                    className={`flex-1 text-left text-sm capitalize ${
                      isDelivery
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {dateLabel}
                  </span>

                  {/* Today badge */}
                  {isToday && (
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium shrink-0">
                      {t('today')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </main>
  )
}
