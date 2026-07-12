import { createClient } from '@/lib/supabase/server'
import { getMyCompany } from '@/lib/company'
import SettingsForm from './SettingsForm'
import BillingCard from './BillingCard'
import TeamCard from './TeamCard'

export default async function SettingsPage({ searchParams }: { searchParams?: { locked?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { company, role } = await getMyCompany(supabase, user!)

  const { data: members } = company
    ? await supabase.from('company_members')
        .select('id, email, role, status, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      {searchParams?.locked && (
        <div className="mb-6 bg-amber/10 border border-amber/30 rounded-xl px-5 py-4">
          <p className="font-semibold text-amber-700 text-sm">Your trial has ended</p>
          <p className="text-sm text-slate-600 mt-0.5">Pick a plan below to regain access to your dashboard, contractors, and payroll. Your data is safe and waiting.</p>
        </div>
      )}
      <SettingsForm
        company={company as unknown as Parameters<typeof SettingsForm>[0]['company']}
        userEmail={user?.email ?? ''}
      />
      {role === 'owner' && (
        <>
          <TeamCard initialMembers={members ?? []} />
          <BillingCard
            currentPlan={company?.plan ?? 'trial'}
            trialEnds={company?.trial_ends ?? null}
            hasStripeCustomer={!!company?.stripe_customer_id}
          />
        </>
      )}
    </div>
  )
}
