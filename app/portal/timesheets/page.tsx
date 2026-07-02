import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { Clock } from 'lucide-react'
import SubmitTimesheetButton from './SubmitTimesheetButton'
import { redirect } from 'next/navigation'

export default async function PortalTimesheetsPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('id, date, hours_worked, task_description, status')
    .eq('contractor_id', ctx.contractor.id)
    .order('date', { ascending: false })
    .limit(100)

  const list = timesheets ?? []

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Timesheets</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.filter(t => t.status === 'pending').length} awaiting approval</p>
        </div>
        <SubmitTimesheetButton contractorId={ctx.contractor.id} companyId={ctx.contractor.company_id} />
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <Clock size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No timesheets yet — submit your first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Hours</th>
                <th className="text-left px-5 py-3 font-semibold">Description</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
