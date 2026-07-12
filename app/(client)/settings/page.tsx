import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'
import BillingCard from './BillingCard'

export default async function SettingsPage({ searchParams }: { searchParams?: { locked?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from('companies').select('*').eq('owner_id', user!.id).single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      {searchParams?.locked && (
        <div className="mb-6 bg-amber/10 border border-amber/30 rounded-xl px-5 py-4">
          <p className="font-semibold text-amber-700 text-sm">Your trial has ended</p>
          <p className="text-sm text-slate-600 mt-0.5">Pick a plan below to regain access to your dashboard, contractors, and payroll. Your data is safe and waiting.</p>
        </div>
      )}
      <SettingsForm company={company} userEmail={user?.email ?? ''} />
      <BillingCard
        currentPlan={company?.plan ?? 'trial'}
        trialEnds={company?.trial_ends ?? null}
        hasStripeCustomer={!!company?.stripe_customer_id}
      />
    </div>
  )
}
