import { NextRequest, NextResponse } from 'next/server'
import { DeliverySchema } from '@/lib/get-delivery-dates'

export const revalidate = 86400

export async function GET(request: NextRequest) {
  const postalCode = request.nextUrl.searchParams.get('postalCode')

  if (!postalCode || !/^\d{5}$/.test(postalCode)) {
    return NextResponse.json(
      { error: 'Invalid postal code. Must be a 5-digit number.' },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(
      `https://www.posti.fi/maildelivery-api-proxy/?q=${postalCode}`,
      { next: { revalidate: 86400 } }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Posti API returned status ${res.status}` },
        { status: 502 }
      )
    }

    const raw = await res.json()
    const parsed = DeliverySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Unexpected response shape from Posti API' },
        { status: 502 }
      )
    }

    return NextResponse.json(parsed.data)
  } catch {
    return NextResponse.json(
      { error: 'Posti API is unavailable' },
      { status: 502 }
    )
  }
}
