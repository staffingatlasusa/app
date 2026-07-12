import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Blocks access to app pages when the trial has expired (or plan cancelled)
 * without an active subscription. Settings stays reachable so the owner can
 * subscribe. Call at the top of every gated (client) page.
 */
export async function requireActivePlan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, plan, trial_ends')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) return // no company yet — pages show their own empty state

  const trialExpired = company.plan === 'trial'
    && company.trial_ends
    && new Date(company.trial_ends).getTime() < Date.now()

  if (trialExpired || company.plan === 'cancelled') {
    redirect('/settings?locked=1')
  }
}
