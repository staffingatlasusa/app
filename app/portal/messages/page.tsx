import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { redirect } from 'next/navigation'
import PortalChat from './PortalChat'

export default async function PortalMessagesPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, owner_id')
    .eq('id', ctx.contractor.company_id)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at')
    .or(`sender_id.eq.${ctx.userId},recipient_id.eq.${ctx.userId}`)
    .order('created_at', { ascending: true })
    .limit(200)

  return (
    <div className="p-8 h-screen flex flex-col max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Messages</h1>
      <p className="text-sm text-slate-500 mb-6">Chat with {company?.name ?? 'your company'}</p>
      <PortalChat
        currentUserId={ctx.userId}
        companyId={ctx.contractor.company_id}
        companyName={company?.name ?? 'Company'}
        ownerId={company?.owner_id ?? ''}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
