import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type ContractorContext = {
  userId: string
  email: string
  /** Hired contractor record (null when only a marketplace profile exists) */
  contractor: {
    id: string; name: string; role: string; company_id: string
    hourly_rate: number; currency: string; status: string
  } | null
  profile: { id: string; name: string; role: string | null; status: string } | null
}

/** Load the signed-in contractor's context, redirecting to /login when signed out. */
export async function getContractorContext(): Promise<ContractorContext> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contractor }, { data: profile }] = await Promise.all([
    supabase.from('contractors')
      .select('id, name, role, company_id, hourly_rate, currency, status')
      .eq('user_id', user.id).maybeSingle(),
    supabase.from('contractor_profiles')
      .select('id, name, role, status')
      .eq('user_id', user.id).maybeSingle(),
  ])

  return { userId: user.id, email: user.email ?? '', contractor, profile }
}
