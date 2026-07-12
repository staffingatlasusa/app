import { createClient } from '@/lib/supabase/server'
import { getMyCompany } from '@/lib/company'
import { requireActivePlan } from '@/lib/plan'
import { DollarSign } from 'lucide-react'
import Link from 'next/link'
import PayrollActions from './PayrollActions'
import PayrollToolbar from './PayrollToolbar'

export default async function PayrollPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { company } = await getMyCompany(supabase, user!)

  const { data: summaries } = await supabase
    .from('payroll_summaries')
    .select('*, contractors(name, role, currency)')
    .eq('company_id', company?.id ?? '')
    .order('period_start', { ascending: false })
    .limit(50)

  const list = summaries ?? []
  const draftTotal = list.filter(s => s.status === 'draft').reduce((sum, s) => sum + Number(s.total_amount), 0)
  const paidTotal = list.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.total_amount), 0)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.length} records</p>
        </div>
        <PayrollToolbar
          companyId={company?.id ?? ''}
          exportRows={list.map(s => ({
            contractor: (s.contractors as { name: string })?.name ?? '',
            role: (s.contractors as { role: string })?.role ?? '',
            period_start: s.period_start,
            period_end: s.period_end,
            total_hours: Number(s.total_hours),
            total_amount: Number(s.total_amount),
            currency: s.currency,
            status: s.status,
          }))}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Draft', amount: draftTotal, color: 'text-amber-600' },
          { label: 'Paid this cycle', amount: paidTotal, color: 'text-green-600' },
          { label: 'Records', amount: list.length, color: 'text-navy', isCount: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.isCount ? s.amount : `$${Number(s.amount).toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <DollarSign size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No payroll records yet.</p>
          <p className="text-sm text-slate-400 mt-1">Approve timesheets to generate payroll summaries.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Contractor</th>
                <th className="text-left px-5 py-3 font-semibold">Period</th>
                <th className="text-left px-5 py-3 font-semibold">Hours</th>
                <th className="text-left px-5 py-3 font-semibold">Amount</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{(s.contractors as { name: string; role: string })?.name}</div>
                    <div className="text-xs text-slate-400">{(s.contractors as { name: string; role: string })?.role}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    {new Date(s.period_start).toLocaleDateString()} – {new Date(s.period_end).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{Number(s.total_hours).toFixed(1)}h</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {s.currency} {Number(s.total_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === 'paid' ? 'bg-green-50 text-green-700' :
                      s.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                      'bg-amber/10 text-amber-600'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Link href={`/payroll/${s.id}/invoice`} className="text-xs font-semibold text-slate-400 hover:text-navy mr-3">Invoice</Link>
                    <PayrollActions id={s.id} status={s.status} />
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
