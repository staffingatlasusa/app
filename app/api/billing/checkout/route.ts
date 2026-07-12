import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'

const APP = 'https://staffingatlas.online'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json() as { plan: PlanKey }
  if (!PLANS[plan]) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })

  const db = createAdminClient()
  const { data: company } = await db.from('companies')
    .select('id, name, stripe_customer_id')
    .eq('owner_id', user.id).maybeSingle()
  if (!company) return NextResponse.json({ error: 'No company found' }, { status: 404 })

  // Already subscribed? Plan changes must go through the billing portal —
  // a second Checkout would create a second, parallel subscription.
  const { data: full } = await db.from('companies')
    .select('stripe_subscription_id').eq('id', company.id).single()
  if (full?.stripe_subscription_id && company.stripe_customer_id) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: company.stripe_customer_id,
      return_url: `${APP}/settings`,
    })
    return NextResponse.json({ url: portal.url })
  }

  // Reuse the Stripe customer if one exists
  let customerId = company.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: company.name,
      metadata: { company_id: company.id },
    })
    customerId = customer.id
    await db.from('companies').update({ stripe_customer_id: customerId }).eq('id', company.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].price, quantity: 1 }],
    success_url: `${APP}/settings?billing=success`,
    cancel_url: `${APP}/settings?billing=cancelled`,
    metadata: { company_id: company.id, plan },
    subscription_data: { metadata: { company_id: company.id, plan } },
  })

  return NextResponse.json({ url: session.url })
}
