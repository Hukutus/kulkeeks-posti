'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  onCodeSelected: (code: string) => void
}

type GeoState = 'requesting' | 'denied' | 'error'

export default function PostalCodeSelector({ onCodeSelected }: Props) {
  const t = useTranslations('PostalCode')
  const [geoState, setGeoState] = useState<GeoState>('requesting')
  const [manualCode, setManualCode] = useState('')
  const [manualError, setManualError] = useState('')

  const requestGeolocation = () => {
    setGeoState('requesting')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
          if (res.ok) {
            const data = await res.json()
            if (data.postalCode) {
              onCodeSelected(data.postalCode)
            } else {
              setGeoState('error')
            }
          } else {
            setGeoState('error')
          }
        } catch {
          setGeoState('error')
        }
      },
      () => {
        setGeoState('denied')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    requestGeolocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = manualCode.trim()
    if (!/^\d{5}$/.test(trimmed)) {
      setManualError('Please enter a valid 5-digit postal code')
      return
    }
    setManualError('')
    onCodeSelected(trimmed)
  }

  if (geoState === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div
          className="w-3 h-3 rounded-full bg-stone-400 dark:bg-stone-500 animate-pulse"
          aria-hidden="true"
        />
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center max-w-xs">
          {t('allowLocation')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8 max-w-xs mx-auto">
      <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
        {geoState === 'denied' ? t('locationDenied') : t('locationError')}
      </p>

      <form onSubmit={handleManualSubmit} className="w-full flex flex-col gap-3">
        <label className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {t('enterPostalCode')}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
            placeholder="00100"
            className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm text-stone-700 dark:text-stone-300 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600"
          />
          <button
            type="submit"
            className="rounded-xl bg-stone-700 dark:bg-stone-600 text-white px-4 py-2 text-sm font-medium hover:bg-stone-600 dark:hover:bg-stone-500 transition-colors"
          >
            {t('submit')}
          </button>
        </div>
        {manualError && (
          <p className="text-xs text-red-500 dark:text-red-400">{manualError}</p>
        )}
        <p className="text-xs text-stone-400 dark:text-stone-500 italic">
          Autocomplete coming in next update
        </p>
      </form>

      <button
        onClick={requestGeolocation}
        className="text-sm text-stone-400 dark:text-stone-500 underline hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
      >
        {t('tryAgain')}
      </button>
    </div>
  )
}
