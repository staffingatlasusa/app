import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: company } = await db.from('companies')
    .select('stripe_customer_id')
    .eq('owner_id', user.id).maybeSingle()
  if (!company?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account yet' }, { status: 404 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: 'https://staffingatlas.online/settings',
  })

  return NextResponse.json({ url: session.url })
}
