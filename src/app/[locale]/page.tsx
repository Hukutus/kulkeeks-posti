import { setRequestLocale } from 'next-intl/server'
import PostalCodeGate from '@/components/PostalCodeGate'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col items-center px-4 py-12 sm:py-16">
      <PostalCodeGate />
    </main>
  )
}
