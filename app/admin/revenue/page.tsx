import { createAdminClient } from '@/lib/supabase/server'

type TxRow = {
  id: string; type: string; amount: number; currency: string; status: string
  reference: string | null; created_at: string; notes: string | null
  companies: { name: string } | null
  contractors: { name: string } | null
}

export default async function AdminRevenuePage() {
  const db = createAdminClient()
  const { data: txs } = await db
    .from('transactions')
    .select('id, type, amount, currency, status, reference, created_at, notes, companies(name), contractors(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const paid = (txs ?? []).filter((t: TxRow) => t.status === 'paid').reduce((a: number, t: TxRow) => a + Number(t.amount), 0)
  const pending = (txs ?? []).filter((t: TxRow) => t.status === 'pending').reduce((a: number, t: TxRow) => a + Number(t.amount), 0)
  const failed = (txs ?? []).filter((t: TxRow) => t.status === 'failed').reduce((a: number, t: TxRow) => a + Number(t.amount), 0)
  const refunded = (txs ?? []).filter((t: TxRow) => t.status === 'refunded').reduce((a: number, t: TxRow) => a + Number(t.amount), 0)

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Revenue & Payments</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">All transactions</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Collected', value: paid, color: 'text-[#22C55E]' },
          { label: 'Pending', value: pending, color: 'text-[#F59E0B]' },
          { label: 'Failed', value: failed, color: 'text-[#EF4444]' },
          { label: 'Refunded', value: refunded, color: 'text-[#8B8FA8]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5">
            <p className="text-xs text-[#8B8FA8] mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Date</th>
              <th className="text-left px-5 py-3 font-semibold">Party</th>
              <th className="text-left px-5 py-3 font-semibold">Type</th>
              <th className="text-left px-5 py-3 font-semibold">Amount</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {((txs ?? []) as TxRow[]).map(t => (
              <tr key={t.id} className="hover:bg-[#0F1117] transition-colors">
                <td className="px-5 py-3 text-[#8B8FA8]">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">{t.companies?.name ?? t.contractors?.name ?? '—'}</td>
                <td className="px-5 py-3 text-[#8B8FA8] capitalize">{t.type.replace('_', ' ')}</td>
                <td className="px-5 py-3 font-medium">${Number(t.amount).toFixed(2)} {t.currency}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    t.status === 'paid' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                    t.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    t.status === 'failed' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{t.status}</span>
                </td>
                <td className="px-5 py-3 text-[#8B8FA8] font-mono text-xs">{t.reference ?? '—'}</td>
              </tr>
            ))}
            {(txs ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8B8FA8]">No transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
