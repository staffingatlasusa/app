import type { SupabaseClient, User } from '@supabase/supabase-js'

export type CompanyRow = {
  id: string; name: string; owner_id: string
  plan: string | null; trial_ends: string | null
  industry: string | null; country: string | null; timezone: string | null
  stripe_customer_id: string | null; stripe_subscription_id: string | null
} & Record<string, unknown>

export type CompanyAccess = {
  company: CompanyRow | null
  role: 'owner' | 'manager' | null
  user: User
}

/**
 * Resolve the company the signed-in user works in — either as the owner
 * or as an active team member (manager).
 */
export async function getMyCompany(supabase: SupabaseClient, user: User): Promise<CompanyAccess> {
  const { data: owned } = await supabase
    .from('companies').select('*').eq('owner_id', user.id).maybeSingle()
  if (owned) return { company: owned, role: 'owner', user }

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, companies(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const company = (membership?.companies as unknown as CompanyAccess['company']) ?? null
  return { company, role: company ? 'manager' : null, user }
}
