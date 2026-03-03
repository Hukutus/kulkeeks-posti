'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import {
  getTodayISO,
  getCurrentWeekISO,
  filterWeekDeliveries,
  isDeliveryDay,
} from '@/lib/delivery-utils'
import content from '../../content.json'
import SettingsBar from '@/components/SettingsBar'

type Dialect = (typeof content.dialects)[number]

type DeliveryData = {
  postalCode: string
  deliveryDates: string[]
}

type Props = {
  postalCode: string
  onChangeCode: () => void
}

export default function DeliveryDisplay({ postalCode, onChangeCode }: Props) {
  const t = useTranslations('Delivery')
  const tPostal = useTranslations('PostalCode')
  const format = useFormatter()

  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [dialect] = useState<Dialect>(
    () => content.dialects[Math.floor(Math.random() * content.dialects.length)]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    setDeliveryData(null)

    fetch(`/api/delivery?postalCode=${postalCode}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || data.error) {
          setError(data.error ?? 'Could not check delivery')
        } else {
          // API returns an array — take first element
          const first = Array.isArray(data) ? data[0] : data
          setDeliveryData(first)
        }
      })
      .catch(() => {
        setError('Could not check delivery')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [postalCode])

  const todayISO = getTodayISO()
  const weekISO = getCurrentWeekISO()

  if (loading) {
    return (
      <div className="max-w-sm w-full mx-auto text-center">
        <p className="font-handwriting text-3xl sm:text-4xl text-stone-700 dark:text-stone-300 leading-relaxed">
          {dialect.question}
        </p>
        <p className="font-handwriting text-7xl sm:text-8xl font-bold mt-6 mb-4 text-stone-300 dark:text-stone-700 animate-pulse whitespace-nowrap">
          ...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-sm w-full mx-auto text-center">
        <p className="font-handwriting text-3xl sm:text-4xl text-stone-700 dark:text-stone-300 leading-relaxed mb-6">
          {dialect.question}
        </p>
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
          <p className="text-lg font-semibold text-stone-700 dark:text-stone-300 mb-2">
            {t('errorTitle')}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">{error}</p>
        </div>
        <button
          onClick={onChangeCode}
          className="mt-6 text-sm text-stone-400 dark:text-stone-500 underline hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
        >
          {tPostal('changeCode')}
        </button>
      </div>
    )
  }

  const { deliveryDates } = deliveryData!
  const deliveryToday = isDeliveryDay(deliveryDates, todayISO)
  const weekDeliveries = filterWeekDeliveries(deliveryDates, weekISO)
  const weekDeliverySet = new Set(weekDeliveries)

  const answerColor = deliveryToday
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="max-w-sm w-full mx-auto text-center">
      {/* Dialect question */}
      <p className="font-handwriting text-3xl sm:text-4xl text-stone-700 dark:text-stone-300 leading-relaxed">
        {dialect.question}
      </p>

      {/* Main answer — largest element, primary information */}
      <p className={`font-handwriting text-7xl sm:text-8xl font-bold mt-6 mb-4 whitespace-nowrap ${answerColor}`}>
        {deliveryToday ? dialect.yes : dialect.no}
      </p>

      {/* Week view — compact secondary info */}
      <div className="mt-14 w-full bg-white/60 dark:bg-stone-900/60 rounded-xl px-4 py-3 border border-stone-200 dark:border-stone-800">
        <h2 className="text-xs font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-2">
          {t('weekTitle')}
        </h2>
        <ul className="space-y-0">
          {weekISO.map((iso) => {
            const isDelivery = weekDeliverySet.has(iso)
            const isToday = iso === todayISO
            const dateLabel = format.dateTime(new Date(iso + 'T12:00:00'), {
              weekday: 'short',
              day: 'numeric',
              month: 'numeric',
            })

            return (
              <li
                key={iso}
                className={`flex items-center gap-2 py-1 px-1.5 rounded ${
                  isToday ? 'bg-stone-100 dark:bg-stone-800' : ''
                }`}
              >
                <span
                  className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                    isDelivery
                      ? 'bg-green-500 dark:bg-green-400'
                      : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`flex-1 text-left text-xs capitalize ${
                    isDelivery
                      ? 'text-stone-600 dark:text-stone-300'
                      : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  {dateLabel}
                </span>
                {isToday && (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium shrink-0">
                    {t('today')}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Postal code + change control */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400 dark:text-stone-500">
        <span>{t('postalCode')} {postalCode}</span>
        <span aria-hidden="true">·</span>
        <button
          onClick={onChangeCode}
          className="underline hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
        >
          {tPostal('changeCode')}
        </button>
      </div>

      {/* Settings — language & theme */}
      <div className="mt-2 flex justify-center">
        <SettingsBar />
      </div>
    </div>
  )
}
