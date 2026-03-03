import { z } from 'zod'

export const DeliverySchema = z.array(
  z.object({
    postalCode: z.string(),
    deliveryDates: z.array(z.string()),
  })
)

export type DeliveryData = z.infer<typeof DeliverySchema>[number]

export async function getDeliveryDates(postalCode: string): Promise<
  | { success: true; data: DeliveryData }
  | { success: false; error: string }
> {
  try {
    const res = await fetch(
      `https://www.posti.fi/maildelivery-api-proxy/?q=${postalCode}`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      return { success: false, error: `Posti API error: ${res.status}` }
    }
    const raw = await res.json()
    const parsed = DeliverySchema.safeParse(raw)
    if (!parsed.success || parsed.data.length === 0) {
      return { success: false, error: 'Unexpected Posti API response' }
    }
    return { success: true, data: parsed.data[0] }
  } catch {
    return { success: false, error: 'Posti API unavailable' }
  }
}
