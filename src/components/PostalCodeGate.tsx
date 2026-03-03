'use client'

import { useEffect, useState } from 'react'
import PostalCodeSelector from './PostalCodeSelector'
import DeliveryDisplay from './DeliveryDisplay'

const STORAGE_KEY = 'posti-days:postalCode'

type Status = 'loading' | 'resolved' | 'selecting'

export default function PostalCodeGate() {
  const [postalCode, setPostalCode] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostalCode(saved)
      setStatus('resolved')
    } else {
      setStatus('selecting')
    }
  }, [])

  const handleCodeSelected = (code: string) => {
    localStorage.setItem(STORAGE_KEY, code)
    setPostalCode(code)
    setStatus('resolved')
  }

  const handleChangeCode = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPostalCode(null)
    setIsChanging(true)
    setStatus('selecting')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div
          className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500 animate-pulse"
          aria-hidden="true"
        />
      </div>
    )
  }

  if (status === 'selecting') {
    return <PostalCodeSelector onCodeSelected={handleCodeSelected} skipGeolocation={isChanging} />
  }

  return (
    <DeliveryDisplay
      postalCode={postalCode!}
      onChangeCode={handleChangeCode}
    />
  )
}
