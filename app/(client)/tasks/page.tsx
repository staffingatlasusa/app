import { createClient } from '@/lib/supabase/server'
import { getMyCompany } from '@/lib/company'
import { requireActivePlan } from '@/lib/plan'
import KanbanBoard from './KanbanBoard'

export default async function TasksPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { company } = await getMyCompany(supabase, user!)

  const [tasksRes, contractorsRes] = await Promise.all([
    supabase.from('tasks').select('*, contractors(name)').eq('company_id', company?.id ?? '').order('position'),
    supabase.from('contractors').select('id, name').eq('company_id', company?.id ?? '').eq('status', 'active'),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500 mt-0.5">{tasksRes.data?.filter(t => t.status !== 'done').length} open tasks</p>
      </div>
      <KanbanBoard
        initialTasks={tasksRes.data ?? []}
        contractors={contractorsRes.data ?? []}
        companyId={company?.id ?? ''}
      />
    </div>
  )
}
