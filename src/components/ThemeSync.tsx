'use client'

import { useEffect } from 'react'

function resolveTheme(): boolean {
  try {
    const stored = localStorage.getItem('posti-days:theme')
    return stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  } catch {
    return false
  }
}

function applyTheme() {
  const shouldBeDark = resolveTheme()
  document.documentElement.classList.toggle('dark', shouldBeDark)

  // Update the theme-lock style tag so background persists through React reconciliation
  const lock = document.getElementById('theme-lock')
  if (lock) {
    lock.textContent = shouldBeDark
      ? 'html,body{background-color:#0c0a09!important}'
      : 'html,body{background-color:#fafaf9!important}'
  }
}

export default function ThemeSync() {
  useEffect(() => {
    applyTheme()

    // Re-add dark class if React strips it during navigation reconciliation
    let adjusting = false
    const observer = new MutationObserver(() => {
      if (adjusting) return
      adjusting = true
      const shouldBeDark = resolveTheme()
      const isDark = document.documentElement.classList.contains('dark')
      if (shouldBeDark !== isDark) {
        document.documentElement.classList.toggle('dark', shouldBeDark)
      }
      adjusting = false
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    // Listen for OS preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => applyTheme()
    mq.addEventListener('change', onSystemChange)

    // Listen for manual theme toggle from SettingsBar
    window.addEventListener('theme-sync', applyTheme)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', onSystemChange)
      window.removeEventListener('theme-sync', applyTheme)
    }
  }, [])

  return null
}
