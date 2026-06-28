import { createClient } from '@/lib/supabase/server'
import CompanyActions from './CompanyActions'

export default async function AdminCompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, plan, industry, country, trial_ends, created_at, owner_id')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Companies</h1>
      <p className="text-sm text-slate-500 mb-8">{companies?.length ?? 0} total</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-semibold">Company</th>
              <th className="text-left px-6 py-3 font-semibold">Plan</th>
              <th className="text-left px-6 py-3 font-semibold">Industry</th>
              <th className="text-left px-6 py-3 font-semibold">Country</th>
              <th className="text-left px-6 py-3 font-semibold">Trial Ends</th>
              <th className="text-left px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(companies ?? []).map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">{c.plan}</span>
                </td>
                <td className="px-6 py-3 text-slate-500">{c.industry ?? '—'}</td>
                <td className="px-6 py-3 text-slate-500">{c.country ?? '—'}</td>
                <td className="px-6 py-3 text-slate-500">{c.trial_ends ? new Date(c.trial_ends).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-3 text-right">
                  <CompanyActions companyId={c.id} />
                </td>
              </tr>
            ))}
            {(companies ?? []).length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No companies yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
