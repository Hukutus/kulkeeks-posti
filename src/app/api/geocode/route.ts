import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lon = request.nextUrl.searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing required parameters: lat and lon' },
      { status: 400 }
    )
  }

  const apiKey = process.env.DIGITRANSIT_API_KEY

  try {
    const url = `https://api.digitransit.fi/geocoding/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1`
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['digitransit-subscription-key'] = apiKey
    }

    const res = await fetch(url, { headers, cache: 'no-store' })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Geocoding service returned status ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const postalCode = data?.features?.[0]?.properties?.postalcode

    if (!postalCode) {
      return NextResponse.json(
        { error: 'No postal code found for location' },
        { status: 404 }
      )
    }

    return NextResponse.json({ postalCode })
  } catch {
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 502 }
    )
  }
}
