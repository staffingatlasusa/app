import { createAdminClient } from '@/lib/supabase/server'

type ContractorRow = {
  id: string; name: string; email: string; role: string; country: string;
  hourly_rate: number; currency: string; status: string; company_id: string;
  companies: { name: string } | null;
}

export default async function AdminContractorsPage() {
  const supabase = createAdminClient()
  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, name, email, role, country, hourly_rate, currency, status, company_id, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">All Contractors</h1>
      <p className="text-sm text-slate-500 mb-8">{contractors?.length ?? 0} total across all companies</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-semibold">Name</th>
              <th className="text-left px-6 py-3 font-semibold">Company</th>
              <th className="text-left px-6 py-3 font-semibold">Role</th>
              <th className="text-left px-6 py-3 font-semibold">Country</th>
              <th className="text-left px-6 py-3 font-semibold">Rate</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {((contractors ?? []) as ContractorRow[]).map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-3 text-slate-500">{c.companies?.name ?? '—'}</td>
                <td className="px-6 py-3 text-slate-600">{c.role}</td>
                <td className="px-6 py-3 text-slate-500">{c.country}</td>
                <td className="px-6 py-3">${c.hourly_rate}/{c.currency}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>{c.status}</span>
                </td>
              </tr>
            ))}
            {(contractors ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No contractors yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
