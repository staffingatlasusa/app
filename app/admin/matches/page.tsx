import { createAdminClient } from '@/lib/supabase/server'

type MatchRow = {
  id: string; role_title: string; status: string; created_at: string
  budget_min: number | null; budget_max: number | null
  companies: { name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-[#3857F1]/10 text-[#3857F1]',
  in_progress: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  candidates_sent: 'bg-[#22C55E]/10 text-[#22C55E]',
  hired: 'bg-[#22C55E]/20 text-[#22C55E]',
  replacement_claimed: 'bg-[#EF4444]/10 text-[#EF4444]',
  closed: 'bg-[#2A2D3E] text-[#8B8FA8]',
}

export default async function AdminMatchesPage() {
  const db = createAdminClient()
  const { data: orders } = await db
    .from('vetted_match_orders')
    .select('id, role_title, status, created_at, budget_min, budget_max, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Match Orders</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{orders?.length ?? 0} total orders</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Role</th>
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Budget</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Days Open</th>
              <th className="text-left px-5 py-3 font-semibold">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {((orders ?? []) as MatchRow[]).map(o => {
              const days = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000)
              return (
                <tr key={o.id} className="hover:bg-[#0F1117] transition-colors">
                  <td className="px-5 py-3 font-medium">{o.role_title}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{o.companies?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">
                    {o.budget_min && o.budget_max ? `$${o.budget_min}–$${o.budget_max}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? 'bg-[#2A2D3E] text-[#8B8FA8]'}`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{days}d</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              )
            })}
            {(orders ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8B8FA8]">No match orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
