import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { DollarSign } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PortalPayrollPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const c = ctx.contractor
  const supabase = await createClient()

  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('date, hours_worked, status')
    .eq('contractor_id', c.id)
    .eq('status', 'approved')
    .order('date', { ascending: false })

  // Group approved hours by month
  const byMonth = new Map<string, number>()
  for (const t of timesheets ?? []) {
    const key = t.date.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(t.hours_worked))
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  const rate = Number(c.hourly_rate)

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">
        Based on approved timesheets · Rate: {c.currency} {rate.toFixed(2)}/hr
      </p>

      {months.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <DollarSign size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No approved timesheets yet — earnings appear once your hours are approved</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Month</th>
                <th className="text-left px-5 py-3 font-semibold">Approved hours</th>
                <th className="text-left px-5 py-3 font-semibold">Rate</th>
                <th className="text-right px-5 py-3 font-semibold">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {months.map(([month, hours]) => (
                <tr key={month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {new Date(month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{hours.toFixed(1)}h</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.currency} {rate.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                    {c.currency} {(hours * rate).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4">
        Earnings shown are estimates based on approved hours. Actual payment is handled by your company.
      </p>
    </div>
  )
}
