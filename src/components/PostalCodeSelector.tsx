'use client'

import { useEffect, useRef, useState } from 'react'
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'

type Props = {
  onCodeSelected: (code: string) => void
}

type GeoState = 'requesting' | 'denied' | 'error'

type PostalEntry = {
  postal_code: string
  postal_area_name: string
  postal_area_name_sv: string
  municipality_name: string
  municipality_name_sv: string
  municipality_code: string
}

// Module-level cache so data loads only once per session
let cachedData: PostalEntry[] | null = null
let fuseInstance: Fuse<PostalEntry> | null = null

async function loadPostalCodes(): Promise<PostalEntry[]> {
  if (cachedData && fuseInstance) return cachedData

  const res = await fetch('/data/postal-codes.json')
  const data: PostalEntry[] = await res.json()

  fuseInstance = new Fuse(data, {
    keys: [
      { name: 'postal_code', weight: 2 },
      { name: 'postal_area_name', weight: 1 },
      { name: 'postal_area_name_sv', weight: 1 },
      { name: 'municipality_name', weight: 1 },
      { name: 'municipality_name_sv', weight: 0.5 },
    ],
    threshold: 0.3,
    minMatchCharLength: 2,
  })

  cachedData = data
  return data
}

function groupByMunicipality(entries: PostalEntry[]): Map<string, PostalEntry[]> {
  const map = new Map<string, PostalEntry[]>()
  for (const entry of entries) {
    const key = entry.municipality_name
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(entry)
  }
  return map
}

export default function PostalCodeSelector({ onCodeSelected }: Props) {
  const t = useTranslations('PostalCode')
  const [geoState, setGeoState] = useState<GeoState>('requesting')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PostalEntry[]>([])
  const loadedRef = useRef(false)

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

  const handleInputFocus = async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    await loadPostalCodes()
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.length >= 2 && fuseInstance) {
      const found = fuseInstance.search(value).slice(0, 50).map((r) => r.item)
      setResults(found)
    } else {
      setResults([])
    }
  }

  const handleSelect = (entry: PostalEntry | null) => {
    if (entry) {
      onCodeSelected(entry.postal_code)
    }
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
        <button
          onClick={() => setGeoState('denied')}
          className="text-xs text-stone-400 dark:text-stone-500 underline hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
        >
          {t('searchManually')}
        </button>
      </div>
    )
  }

  const grouped = groupByMunicipality(results)

  return (
    <div className="flex flex-col gap-4 py-8 w-full max-w-sm mx-auto">
      <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
        {geoState === 'denied' ? t('locationDenied') : t('locationError')}
      </p>

      <Combobox onChange={handleSelect}>
        <ComboboxInput
          aria-label={t('enterPostalCode')}
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={handleInputFocus}
          autoComplete="off"
          className="w-full border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-3 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        {results.length > 0 && (
          <ComboboxOptions
            anchor="bottom"
            className="mt-1 bg-white dark:bg-stone-900 shadow-lg rounded-xl max-h-64 overflow-auto border border-stone-200 dark:border-stone-800 w-[var(--input-width)] [--anchor-gap:4px] z-50"
          >
            {[...grouped.entries()].map(([municipality, entries]) => (
              <li key={municipality}>
                <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-3 py-1 bg-stone-50 dark:bg-stone-950 sticky top-0">
                  {municipality}
                </div>
                <ul>
                  {entries.map((entry) => (
                    <ComboboxOption
                      key={entry.postal_code}
                      value={entry}
                      className={({ focus }) =>
                        `px-3 py-2 cursor-pointer flex items-baseline gap-2 ${
                          focus ? 'bg-stone-100 dark:bg-stone-800' : ''
                        }`
                      }
                    >
                      <span className="font-mono text-stone-400 text-sm mr-1">
                        {entry.postal_code}
                      </span>
                      <span className="text-stone-700 dark:text-stone-300 text-sm">
                        {entry.postal_area_name}
                      </span>
                    </ComboboxOption>
                  ))}
                </ul>
              </li>
            ))}
          </ComboboxOptions>
        )}
      </Combobox>

      <button
        onClick={requestGeolocation}
        className="text-sm text-stone-400 dark:text-stone-500 underline hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer self-center"
      >
        {t('tryAgain')}
      </button>
    </div>
  )
}
