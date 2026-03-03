import type { Metadata, Viewport } from 'next'
import { Caveat } from 'next/font/google'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import ThemeSync from '@/components/ThemeSync'
import './globals.css'

const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Posti Days',
  description: 'Is Posti delivering mail today?',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params // params is Promise in Next.js 15

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html lang={locale} className={`${caveat.variable} bg-stone-50 dark:bg-stone-950`} suppressHydrationWarning>
      <body className="bg-stone-50 dark:bg-stone-950 min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('posti-days:theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
        <ThemeSync />
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
