import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil' as Stripe.LatestApiVersion,
})

export const PLANS = {
  starter:    { price: 'price_1TsCGNJwxpPkKkjMEjOXKiiC', label: 'Starter',    monthly: 99,  contractorLimit: 3 },
  growth:     { price: 'price_1TsCGOJwxpPkKkjMAjPtx46V', label: 'Growth',     monthly: 199, contractorLimit: 10 },
  enterprise: { price: 'price_1TsCGOJwxpPkKkjMdukiQKUV', label: 'Enterprise', monthly: 299, contractorLimit: 999999 },
} as const

export type PlanKey = keyof typeof PLANS

export function planFromPriceId(priceId: string): PlanKey | null {
  const entry = Object.entries(PLANS).find(([, p]) => p.price === priceId)
  return (entry?.[0] as PlanKey) ?? null
}
