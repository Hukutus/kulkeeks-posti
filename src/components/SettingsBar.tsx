'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useState, useEffect, useTransition } from 'react'

const locales = ['fi', 'en', 'sv', 'se'] as const
type Locale = (typeof locales)[number]
type ThemePref = 'light' | 'dark' | 'system'

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

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

export default function SettingsBar() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [themePref, setThemePref] = useState<ThemePref>('system')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('posti-days:theme') as ThemePref | null
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemePref(stored)
      } else {
        setThemePref('system')
      }
    } catch (e) {
      // localStorage may be unavailable
    }
  }, [])

  function switchLocale(newLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  function toggleTheme() {
    let next: ThemePref
    if (themePref === 'light') {
      next = 'dark'
    } else if (themePref === 'dark') {
      next = 'system'
    } else {
      // 'system' or initial -> light
      next = 'light'
    }

    try {
      localStorage.setItem('posti-days:theme', next)
    } catch (e) {
      // localStorage may be unavailable
    }

    // Apply immediately
    const shouldBeDark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', shouldBeDark)

    setThemePref(next)

    // Notify ThemeSync
    window.dispatchEvent(new Event('theme-sync'))
  }

  function getThemeAriaLabel(): string {
    if (themePref === 'light') return 'Theme: light, switch to dark'
    if (themePref === 'dark') return 'Theme: dark, switch to system'
    return 'Theme: system, switch to light'
  }

  return (
    <nav aria-label="Settings" className="flex items-center gap-0 text-xs text-stone-500 dark:text-stone-400">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className="px-1">/</span>}
          <button
            onClick={() => switchLocale(l)}
            aria-disabled={isPending}
            className={`cursor-pointer transition-colors p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:focus-visible:outline-stone-400 focus-visible:rounded-sm ${
              l === locale
                ? 'font-semibold text-stone-700 dark:text-stone-200'
                : 'hover:text-stone-700 dark:hover:text-stone-200'
            }`}
            aria-label={`Switch language to ${l.toUpperCase()}`}
            aria-current={l === locale ? 'true' : undefined}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
      <span aria-hidden="true" className="px-1">·</span>
      <button
        onClick={toggleTheme}
        className="cursor-pointer hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:focus-visible:outline-stone-400 focus-visible:rounded-sm"
        aria-label={getThemeAriaLabel()}
      >
        {themePref === 'light' && <MoonIcon />}
        {themePref === 'dark' && <MonitorIcon />}
        {themePref === 'system' && <SunIcon />}
      </button>
      <span aria-hidden="true" className="px-1">·</span>
      <a
        href="https://github.com/Hukutus/kulkeeks-posti"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:focus-visible:outline-stone-400 focus-visible:rounded-sm"
        aria-label="GitHub"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>
    </nav>
  )
}
