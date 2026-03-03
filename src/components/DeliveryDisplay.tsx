'use client'

// Stub for Task 1 build verification — replaced in Task 2
type Props = {
  postalCode: string
  onChangeCode: () => void
}

export default function DeliveryDisplay({ postalCode, onChangeCode }: Props) {
  return (
    <div>
      <p>{postalCode}</p>
      <button onClick={onChangeCode}>Change</button>
    </div>
  )
}
