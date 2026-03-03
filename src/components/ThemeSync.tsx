'use client'

import { useEffect } from 'react'

function applyTheme() {
  try {
    const stored = localStorage.getItem('posti-days:theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored === 'dark' || (stored !== 'light' && prefersDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
    document.documentElement.style.removeProperty('background-color')
  } catch (e) {
    // localStorage may be unavailable (e.g. SSR, private mode restrictions)
  }
}

export default function ThemeSync() {
  useEffect(() => {
    applyTheme()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => applyTheme()
    mq.addEventListener('change', onSystemChange)

    const onThemeSync = () => applyTheme()
    window.addEventListener('theme-sync', onThemeSync)

    return () => {
      mq.removeEventListener('change', onSystemChange)
      window.removeEventListener('theme-sync', onThemeSync)
    }
  }, [])

  return null
}
