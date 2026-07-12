import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { stripe, planFromPriceId, PLANS, type PlanKey } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const db = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const companyId = session.metadata?.company_id
      const plan = (session.metadata?.plan ?? 'starter') as PlanKey
      if (!companyId) break
      await db.from('companies').update({
        plan,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', companyId)
      await db.from('subscriptions').upsert({
        company_id: companyId,
        status: 'active',
        plan,
        contractor_limit: PLANS[plan].contractorLimit,
        stripe_subscription_id: session.subscription as string,
      }, { onConflict: 'company_id' })
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const companyId = sub.metadata?.company_id
      if (!companyId) break
      const priceId = sub.items.data[0]?.price.id
      const plan = priceId ? planFromPriceId(priceId) : null
      const active = sub.status === 'active' || sub.status === 'trialing'
      await db.from('subscriptions').upsert({
        company_id: companyId,
        status: active ? 'active' : sub.status,
        ...(plan ? { plan, contractor_limit: PLANS[plan].contractorLimit } : {}),
        stripe_subscription_id: sub.id,
      }, { onConflict: 'company_id' })
      if (plan && active) await db.from('companies').update({ plan }).eq('id', companyId)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const companyId = sub.metadata?.company_id
      if (!companyId) break
      await db.from('subscriptions').update({ status: 'cancelled' }).eq('company_id', companyId)
      await db.from('companies').update({ plan: 'cancelled' }).eq('id', companyId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
