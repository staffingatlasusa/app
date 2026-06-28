import { createClient } from '@/lib/supabase/server'
import { Building2, Users, Briefcase, CreditCard } from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    { count: companyCount },
    { count: userCount },
    { count: contractorCount },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('user_roles').select('*', { count: 'exact', head: true }),
    supabase.from('contractors').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentCompanies } = await supabase
    .from('companies')
    .select('id, name, plan, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const stats = [
    { label: 'Total Companies', value: companyCount ?? 0, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Users', value: userCount ?? 0, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Total Contractors', value: contractorCount ?? 0, icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
    { label: 'Active Plans', value: '—', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Overview</h1>
      <p className="text-sm text-slate-500 mb-8">Platform-wide metrics</p>

      <div className="grid grid-cols-4 gap-5 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Companies</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-semibold">Company</th>
              <th className="text-left px-6 py-3 font-semibold">Plan</th>
              <th className="text-left px-6 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(recentCompanies ?? []).map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">{c.plan}</span>
                </td>
                <td className="px-6 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(recentCompanies ?? []).length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No companies yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
