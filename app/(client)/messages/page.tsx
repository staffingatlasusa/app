import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import MessagesClient from './MessagesClient'

export default async function MessagesPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user!.id).single()

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, name, role, user_id')
    .eq('company_id', company?.id ?? '')
    .eq('status', 'active')
    .not('user_id', 'is', null)

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: true })
    .limit(200)

  return (
    <div className="p-8 h-[calc(100vh-0px)] flex flex-col max-h-screen">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 shrink-0">Messages</h1>
      <MessagesClient
        currentUserId={user!.id}
        companyId={company?.id ?? ''}
        contractors={contractors ?? []}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
