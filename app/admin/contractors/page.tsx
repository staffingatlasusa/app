import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

type ContractorRow = {
  id: string; name: string; email: string; role: string; country: string
  hourly_rate: number; currency: string; status: string; pool_type: string
  company_id: string; companies: { name: string } | null
}

export default async function AdminContractorsPage() {
  const db = createAdminClient()
  const { data: contractors } = await db
    .from('contractors')
    .select('id, name, email, role, country, hourly_rate, currency, status, pool_type, company_id, companies(name)')
    .order('created_at', { ascending: false })

  const { data: vetting } = await db.from('vetted_applications').select('contractor_id, status')
  const vettingMap = Object.fromEntries((vetting ?? []).map((v: { contractor_id: string; status: string }) => [v.contractor_id, v.status]))

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{contractors?.length ?? 0} total</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Name</th>
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Role</th>
              <th className="text-left px-5 py-3 font-semibold">Pool</th>
              <th className="text-left px-5 py-3 font-semibold">Vetting</th>
              <th className="text-left px-5 py-3 font-semibold">Rate</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {((contractors ?? []) as ContractorRow[]).map(c => (
              <tr key={c.id} className="hover:bg-[#0F1117] transition-colors">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{c.companies?.name ?? '—'}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{c.role}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    c.pool_type === 'vetted' ? 'bg-[#F5C842]/10 text-[#F5C842]' : 'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{c.pool_type}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    vettingMap[c.id] === 'approved' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                    vettingMap[c.id] === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    vettingMap[c.id] === 'rejected' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{vettingMap[c.id] ?? 'none'}</span>
                </td>
                <td className="px-5 py-3 text-[#8B8FA8]">${c.hourly_rate}/{c.currency}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{c.status}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/contractors/${c.id}`} className="text-xs font-medium text-[#3857F1] hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
