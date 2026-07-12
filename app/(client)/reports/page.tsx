import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import { BarChart2 } from 'lucide-react'
import ExportReportButton from './ExportReportButton'

export default async function ReportsPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user!.id).single()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const fromStr = sixMonthsAgo.toISOString().slice(0, 10)

  const [{ data: timesheets }, { data: contractors }] = await Promise.all([
    supabase.from('timesheets')
      .select('contractor_id, date, hours_worked, status')
      .eq('company_id', company?.id ?? '')
      .eq('status', 'approved')
      .gte('date', fromStr),
    supabase.from('contractors')
      .select('id, name, role, hourly_rate, currency')
      .eq('company_id', company?.id ?? ''),
  ])

  const ts = timesheets ?? []
  const contractorMap = new Map((contractors ?? []).map(c => [c.id, c]))

  // Hours + spend per month (last 6 months)
  const months: { key: string; label: string; hours: number; spend: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: d.toLocaleDateString('en', { month: 'short' }), hours: 0, spend: 0 })
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]))

  // Per-contractor totals
  const perContractor = new Map<string, { hours: number; spend: number }>()

  for (const t of ts) {
    const c = contractorMap.get(t.contractor_id)
    const rate = Number(c?.hourly_rate ?? 0)
    const hours = Number(t.hours_worked)
    const mk = String(t.date).slice(0, 7)
    const mi = monthIndex.get(mk)
    if (mi !== undefined) {
      months[mi].hours += hours
      months[mi].spend += hours * rate
    }
    const agg = perContractor.get(t.contractor_id) ?? { hours: 0, spend: 0 }
    agg.hours += hours
    agg.spend += hours * rate
    perContractor.set(t.contractor_id, agg)
  }

  const maxSpend = Math.max(...months.map(m => m.spend), 1)
  const totalHours = ts.reduce((s, t) => s + Number(t.hours_worked), 0)
  const totalSpend = months.reduce((s, m) => s + m.spend, 0)

  const rows = Array.from(perContractor.entries())
    .map(([id, agg]) => ({ contractor: contractorMap.get(id), ...agg }))
    .filter(r => r.contractor)
    .sort((a, b) => b.spend - a.spend)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Approved hours &amp; estimated spend · last 6 months</p>
        </div>
        <ExportReportButton rows={rows.map(r => ({
          name: r.contractor!.name, role: r.contractor!.role,
          hours: r.hours, spend: r.spend, currency: r.contractor!.currency,
        }))} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total hours</p>
          <p className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Est. spend</p>
          <p className="text-2xl font-bold text-slate-900">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-900 mb-5">Monthly spend</h2>
        <div className="flex items-end gap-3 h-40">
          {months.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                {m.spend > 0 ? `$${Math.round(m.spend).toLocaleString()}` : ''}
              </span>
              <div className="w-full bg-navy rounded-t-md transition-all" style={{ height: `${Math.max((m.spend / maxSpend) * 100, m.spend > 0 ? 4 : 1)}%` }} />
              <span className="text-xs text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">By contractor</h2>
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BarChart2 size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No approved hours in the last 6 months</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Contractor</th>
                <th className="text-right px-5 py-3 font-semibold">Hours</th>
                <th className="text-right px-5 py-3 font-semibold">Est. spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.contractor!.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">{r.contractor!.name}</p>
                    <p className="text-xs text-slate-400">{r.contractor!.role}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium">{r.hours.toFixed(1)}h</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                    {r.contractor!.currency} {r.spend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
