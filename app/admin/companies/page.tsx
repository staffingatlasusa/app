import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminCompaniesPage() {
  const db = createAdminClient()
  const { data: companies } = await db
    .from('companies')
    .select('id, name, industry, country, plan, trial_ends, created_at')
    .order('created_at', { ascending: false })

  const { data: subs } = await db.from('subscriptions').select('company_id, status, contractor_limit')
  const subMap = Object.fromEntries((subs ?? []).map((s: { company_id: string; status: string; contractor_limit: number }) => [s.company_id, s]))

  const { data: contractorCounts } = await db.from('contractors').select('company_id')
  const countMap: Record<string, number> = {}
  ;(contractorCounts ?? []).forEach((c: { company_id: string }) => {
    countMap[c.company_id] = (countMap[c.company_id] ?? 0) + 1
  })

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{companies?.length ?? 0} total</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Plan</th>
              <th className="text-left px-5 py-3 font-semibold">Sub Status</th>
              <th className="text-left px-5 py-3 font-semibold">Contractors</th>
              <th className="text-left px-5 py-3 font-semibold">Trial Ends</th>
              <th className="text-left px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {(companies ?? []).map((c: { id: string; name: string; industry: string | null; country: string | null; plan: string; trial_ends: string | null; created_at: string }) => {
              const sub = subMap[c.id]
              const count = countMap[c.id] ?? 0
              return (
                <tr key={c.id} className="hover:bg-[#0F1117] transition-colors">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#2A2D3E] text-[#8B8FA8] capitalize">{c.plan}</span>
                  </td>
                  <td className="px-5 py-3">
                    {sub ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        sub.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                        sub.status === 'trialing' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        sub.status === 'past_due' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                        'bg-[#2A2D3E] text-[#8B8FA8]'
                      }`}>{sub.status}</span>
                    ) : <span className="text-[#8B8FA8]">—</span>}
                  </td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{count} / {sub?.contractor_limit ?? 10}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{c.trial_ends ? new Date(c.trial_ends).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/companies/${c.id}`} className="text-xs font-medium text-[#3857F1] hover:underline">View</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
