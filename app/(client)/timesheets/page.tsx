import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import { Clock } from 'lucide-react'
import TimesheetActions from './TimesheetActions'

export default async function TimesheetsPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user!.id).single()

  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('*, contractors(name, role)')
    .eq('company_id', company?.id ?? '')
    .order('date', { ascending: false })
    .limit(100)

  const list = timesheets ?? []
  const pending = list.filter(t => t.status === 'pending')
  const approved = list.filter(t => t.status === 'approved')
  const rejected = list.filter(t => t.status === 'rejected')

  const totalHours = approved.reduce((s, t) => s + Number(t.hours_worked), 0)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timesheets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{pending.length} pending approval · {totalHours.toFixed(1)} hrs approved</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending', count: pending.length, color: 'text-amber', bg: 'bg-amber/10' },
          { label: 'Approved', count: approved.length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', count: rejected.length, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`${s.bg} rounded-lg p-2.5`}>
              <Clock size={16} className={s.color} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{s.count}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <Clock size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No timesheets submitted yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Contractor</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Hours</th>
                <th className="text-left px-5 py-3 font-semibold">Description</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{(t.contractors as { name: string; role: string })?.name}</div>
                    <div className="text-xs text-slate-400">{(t.contractors as { name: string; role: string })?.role}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 font-semibold">{t.hours_worked}h</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{t.task_description || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'approved' ? 'bg-green-50 text-green-700' :
                      t.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber/10 text-amber-600'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {t.status === 'pending' && <TimesheetActions id={t.id} />}
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
