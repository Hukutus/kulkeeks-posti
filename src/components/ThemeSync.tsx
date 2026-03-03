'use client'

import { useEffect } from 'react'

export default function ThemeSync() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('posti-days:theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (e) {
      // localStorage may be unavailable (e.g. SSR, private mode restrictions)
    }
  })

  return null
}
