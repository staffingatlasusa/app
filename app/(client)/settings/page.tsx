import { createClient } from '@/lib/supabase/server'
import SettingsForm from './SettingsForm'
import BillingCard from './BillingCard'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase
    .from('companies').select('*').eq('owner_id', user!.id).single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      <SettingsForm company={company} userEmail={user?.email ?? ''} />
      <BillingCard
        currentPlan={company?.plan ?? 'trial'}
        trialEnds={company?.trial_ends ?? null}
        hasStripeCustomer={!!company?.stripe_customer_id}
      />
    </div>
  )
}
