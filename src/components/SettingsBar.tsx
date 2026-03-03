'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'

const locales = ['fi', 'en', 'sv'] as const
type Locale = (typeof locales)[number]

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function SettingsBar() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale })
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('posti-days:theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('posti-days:theme', 'dark')
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          <button
            onClick={() => switchLocale(l)}
            className={`cursor-pointer transition-colors ${
              l === locale
                ? 'font-semibold text-stone-600 dark:text-stone-300'
                : 'hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            aria-label={`Switch language to ${l.toUpperCase()}`}
            aria-current={l === locale ? 'true' : undefined}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
      <span aria-hidden="true">·</span>
      <button
        onClick={toggleTheme}
        className="cursor-pointer hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        aria-label="Toggle dark/light theme"
      >
        <span className="hidden dark:inline"><SunIcon /></span>
        <span className="inline dark:hidden"><MoonIcon /></span>
      </button>
    </div>
  )
}
