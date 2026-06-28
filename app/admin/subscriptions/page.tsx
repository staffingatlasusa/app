import { createAdminClient } from '@/lib/supabase/server'

type SubRow = {
  id: string; status: string; plan: string; contractor_limit: number
  trial_ends_at: string | null; current_period_end: string | null; created_at: string
  companies: { name: string } | null
}

export default async function AdminSubscriptionsPage() {
  const db = createAdminClient()
  const { data: subs } = await db
    .from('subscriptions')
    .select('id, status, plan, contractor_limit, trial_ends_at, current_period_end, created_at, companies(name)')
    .order('created_at', { ascending: false })

  const in3days = new Date(Date.now() + 3 * 86400000).toISOString()

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{subs?.length ?? 0} total</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Plan</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Limit</th>
              <th className="text-left px-5 py-3 font-semibold">Trial Ends</th>
              <th className="text-left px-5 py-3 font-semibold">Next Billing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {((subs ?? []) as SubRow[]).map(s => {
              const trialExpiring = s.trial_ends_at && s.trial_ends_at < in3days && s.status === 'trialing'
              return (
                <tr key={s.id} className="hover:bg-[#0F1117] transition-colors">
                  <td className="px-5 py-3 font-medium">
                    {s.companies?.name ?? '—'}
                    {trialExpiring && <span className="ml-2 px-1.5 py-0.5 bg-[#EF4444]/10 text-[#EF4444] rounded text-[10px] font-semibold">Expiring soon</span>}
                  </td>
                  <td className="px-5 py-3 capitalize text-[#8B8FA8]">{s.plan}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      s.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                      s.status === 'trialing' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      s.status === 'past_due' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                      'bg-[#2A2D3E] text-[#8B8FA8]'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{s.contractor_limit}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}</td>
                </tr>
              )
            })}
            {(subs ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8B8FA8]">No subscriptions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
