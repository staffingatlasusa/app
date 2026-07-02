import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { CheckSquare } from 'lucide-react'
import TaskStatusButton from './TaskStatusButton'
import { redirect } from 'next/navigation'

const STATUS_STYLE: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-600',
  review: 'bg-amber/10 text-amber-600',
  done: 'bg-green-50 text-green-700',
}

export default async function PortalTasksPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date')
    .eq('contractor_id', ctx.contractor.id)
    .order('created_at', { ascending: false })

  const list = tasks ?? []
  const open = list.filter(t => t.status !== 'done')
  const done = list.filter(t => t.status === 'done')

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">{open.length} open · {done.length} completed</p>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <CheckSquare size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No tasks assigned to you yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[t.status] ?? STATUS_STYLE.todo}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  {t.priority === 'high' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">high priority</span>
                  )}
                </div>
                {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                {t.due_date && (
                  <p className="text-xs text-slate-400 mt-2">Due {new Date(t.due_date).toLocaleDateString()}</p>
                )}
              </div>
              <TaskStatusButton id={t.id} status={t.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
