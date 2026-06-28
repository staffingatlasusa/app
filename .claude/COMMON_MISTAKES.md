# staffingatlas.online -- Common Mistakes

Add bugs here when they take >1 hour to fix.

---

## 1. Supabase: using deprecated auth-helpers-nextjs

WRONG -- deprecated package:
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

RIGHT -- use @supabase/ssr:
// Client Component ('use client')
import { createBrowserClient } from '@supabase/ssr'
const supabase = createBrowserClient(URL, ANON_KEY)

// Server Component / Route Handler
import { createServerClient } from '@supabase/ssr'
const supabase = createServerClient(URL, ANON_KEY, { cookies: { getAll: () => cookies().getAll() } })

Mapping: createClientComponentClient -> createBrowserClient
         createServerComponentClient -> createServerClient
         createRouteHandlerClient    -> createServerClient
         createMiddlewareClient      -> createServerClient

---

## 2. RLS not enabled -- cross-company data leak

CRITICAL: every table must have RLS + company_id policy.
Silent empty response, not an error, if policy missing.

ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company isolation" ON your_table
  FOR ALL USING (company_id = (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

---

## 3. Stripe: use req.text() not req.json() for webhooks

export async function POST(req: Request) {
  const body = await req.text()   -- NOT req.json()
  const sig = req.headers.get('stripe-signature')!
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
}

---

## 4. Subscription status: read from DB not Stripe API

Sync via webhook to subscriptions table. Read from DB.
Required events: customer.subscription.created/updated/deleted, invoice.payment_failed

---

## 5. Next.js 14: no async at component level in 'use client'

'use client'
export default async function Page() { -- BREAKS

---

## 6. Vercel: env vars not in preview deployments

Check "Preview" checkbox for each var. Test + prod Stripe keys both needed.

---

## 7. Resend: no sandbox -- sends to real addresses

const to = process.env.NODE_ENV === 'production' ? userEmail : 'jason.gregg@mail.com'

---

## 8. Stripe price IDs differ between test and live

Always use env vars:
const PRICE_IDS = {
  starter:    process.env.STRIPE_PRICE_STARTER!,
  growth:     process.env.STRIPE_PRICE_GROWTH!,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
}

---

## 9. Next.js 14: cookies() is sync (Next 15 it is async)

Next 14: const cookieStore = cookies()       -- correct
Next 15: const cookieStore = await cookies() -- BREAKS in Next 14

---

## 10. Multi-currency display

Store amounts in the contractor currency. Display converted estimate only.
Do NOT convert and store -- rates change. Store source currency + amount.
