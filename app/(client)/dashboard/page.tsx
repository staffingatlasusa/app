import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import { Users, Clock, CheckSquare, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

async function getData(companyId: string) {
  await requireActivePlan()
  const supabase = await createClient()

  const [contractors, timesheets, tasks, payroll] = await Promise.all([
    supabase.from('contractors').select('id, name, role, status, hourly_rate, currency').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('timesheets').select('id, hours_worked, status, date').eq('company_id', companyId).eq('status', 'pending'),
    supabase.from('tasks').select('id, title, status, priority, due_date').eq('company_id', companyId).neq('status', 'done').order('due_date', { ascending: true }).limit(5),
    supabase.from('payroll_summaries').select('total_amount, currency').eq('company_id', companyId).eq('status', 'draft'),
  ])

  return {
    activeContractors: contractors.data?.length ?? 0,
    pendingTimesheets: timesheets.data?.length ?? 0,
    openTasks: tasks.data?.length ?? 0,
    draftPayroll: payroll.data?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0,
    recentContractors: contractors.data?.slice(0, 5) ?? [],
    urgentTasks: tasks.data ?? [],
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name, plan, trial_ends').eq('owner_id', user!.id).single()

  if (!company) {
    return (
      <div className="p-8">
        <div className="bg-amber/10 border border-amber rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber shrink-0" />
          <p className="text-sm">Company not set up. <Link href="/settings" className="font-semibold underline">Go to Settings</Link></p>
        </div>
      </div>
    )
  }

  const data = await getData(company.id)
  const trialEnd = company.trial_ends ? new Date(company.trial_ends) : null
  const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86400000) : null

  const stats = [
    { label: 'Active contractors', value: data.activeContractors, icon: Users, href: '/contractors', color: 'text-navy' },
    { label: 'Pending timesheets', value: data.pendingTimesheets, icon: Clock, href: '/timesheets', color: 'text-amber' },
    { label: 'Open tasks', value: data.openTasks, icon: CheckSquare, href: '/tasks', color: 'text-brand-green' },
    { label: 'Draft payroll (USD)', value: `$${data.draftPayroll.toLocaleString()}`, icon: DollarSign, href: '/payroll', color: 'text-slate-700' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">Here&apos;s what&apos;s happening with your team today.</p>
        </div>
        {trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold text-amber-600">{trialDaysLeft} days</span>
            <span className="text-slate-600"> left in trial</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={href} href={href} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent contractors */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Active Team</h2>
            <Link href="/contractors/new" className="text-xs font-semibold text-navy hover:underline">+ Add</Link>
          </div>
          {data.recentContractors.length === 0 ? (
            <EmptyState icon={Users} message="No contractors yet" cta="Add your first contractor" href="/contractors/new" />
          ) : (
            <ul className="space-y-3">
              {data.recentContractors.map(c => (
                <li key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.role}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">${c.hourly_rate}/hr</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Urgent tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Open Tasks</h2>
            <Link href="/tasks" className="text-xs font-semibold text-navy hover:underline">View board</Link>
          </div>
          {data.urgentTasks.length === 0 ? (
            <EmptyState icon={CheckSquare} message="No open tasks" cta="Create a task" href="/tasks" />
          ) : (
            <ul className="space-y-3">
              {data.urgentTasks.map(t => (
                <li key={t.id} className="flex items-center gap-3">
                  <PriorityDot priority={t.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                    {t.due_date && (
                      <p className="text-xs text-slate-400">Due {new Date(t.due_date).toLocaleDateString()}</p>
                    )}
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message, cta, href }: { icon: React.ElementType; message: string; cta: string; href: string }) {
  return (
    <div className="text-center py-8">
      <Icon size={28} className="mx-auto text-slate-200 mb-2" />
      <p className="text-sm text-slate-400 mb-3">{message}</p>
      <Link href={href} className="text-xs font-semibold text-navy hover:underline">{cta}</Link>
    </div>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { high: 'bg-red-400', medium: 'bg-amber', low: 'bg-slate-300' }
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[priority] ?? 'bg-slate-300'}`} />
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-500',
    in_progress: 'bg-blue-50 text-blue-600',
    review: 'bg-amber/10 text-amber-600',
    done: 'bg-green-50 text-green-600',
  }
  const label: Record<string, string> = { todo: 'To do', in_progress: 'In progress', review: 'Review', done: 'Done' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {label[status] ?? status}
    </span>
  )
}
