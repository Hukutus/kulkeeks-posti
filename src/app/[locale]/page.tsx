import { setRequestLocale, getTranslations } from 'next-intl/server'
import PostalCodeGate from '@/components/PostalCodeGate'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'Common' })

  return (
    <main id="main-content" tabIndex={-1} className="min-h-dvh bg-stone-50 dark:bg-stone-950 flex flex-col items-center px-4 py-12 sm:py-16 focus:outline-none">
      <h1 className="sr-only">{t('title')}</h1>
      <PostalCodeGate />
    </main>
  )
}
