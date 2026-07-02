import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { Clock, CheckSquare, DollarSign, Hourglass } from 'lucide-react'
import Link from 'next/link'

export default async function PortalDashboard() {
  const ctx = await getContractorContext()
  const supabase = await createClient()

  // Marketplace-only contractor — not hired yet
  if (!ctx.contractor) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome{ctx.profile ? `, ${ctx.profile.name}` : ''}</h1>
        <p className="text-sm text-slate-500 mb-8">Your contractor profile</p>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Hourglass size={32} className="mx-auto text-amber mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            {ctx.profile?.status === 'pending' ? 'Your profile is under review' : 'You’re on the marketplace'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {ctx.profile?.status === 'pending'
              ? 'Our team is reviewing your application. Once approved, you’ll be visible to companies looking to hire. We’ll email you when your status changes.'
              : 'When a company hires you, your timesheets, tasks, and payroll will appear here.'}
          </p>
          <Link href="/portal/profile" className="inline-block mt-6 px-5 py-2.5 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors">
            Complete your profile
          </Link>
        </div>
      </div>
    )
  }

  const c = ctx.contractor
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [{ data: timesheets }, { data: tasks }] = await Promise.all([
    supabase.from('timesheets').select('hours_worked, status, date')
      .eq('contractor_id', c.id).gte('date', monthStart),
    supabase.from('tasks').select('id, title, status, due_date')
      .eq('contractor_id', c.id).neq('status', 'done').order('due_date', { ascending: true }).limit(5),
  ])

  const ts = timesheets ?? []
  const approvedHours = ts.filter(t => t.status === 'approved').reduce((s, t) => s + Number(t.hours_worked), 0)
  const pendingCount = ts.filter(t => t.status === 'pending').length
  const earnings = approvedHours * Number(c.hourly_rate)

  const stats = [
    { label: 'Approved hours (this month)', value: `${approvedHours.toFixed(1)}h`, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending timesheets', value: String(pendingCount), icon: Hourglass, color: 'text-amber', bg: 'bg-amber/10' },
    { label: 'Open tasks', value: String(tasks?.length ?? 0), icon: CheckSquare, color: 'text-navy', bg: 'bg-navy/5' },
    { label: 'Est. earnings (this month)', value: `${c.currency} ${earnings.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back, {c.name.split(' ')[0]}</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">{c.role}</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`${s.bg} rounded-lg p-2 w-fit mb-3`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Upcoming tasks</h2>
            <Link href="/portal/tasks" className="text-xs font-medium text-navy hover:underline">View all</Link>
          </div>
          {(tasks ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No open tasks 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(tasks ?? []).map(t => (
                <li key={t.id} className="py-2.5 flex items-center justify-between">
                  <span className="text-sm text-slate-700">{t.title}</span>
                  <span className="text-xs text-slate-400">
                    {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No due date'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Link href="/portal/timesheets" className="block px-4 py-3 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors text-center">
              Submit a timesheet
            </Link>
            <Link href="/portal/messages" className="block px-4 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors text-center">
              Message your company
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
