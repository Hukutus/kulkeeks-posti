import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fi', 'en', 'sv', 'se'],
  defaultLocale: 'en',
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365, // 1 year (I18N-04)
  },
})
