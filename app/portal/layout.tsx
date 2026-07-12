import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortalSidebar from '@/components/layout/PortalSidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contractor }, { data: profile }] = await Promise.all([
    supabase.from('contractors').select('name').eq('user_id', user.id).maybeSingle(),
    supabase.from('contractor_profiles').select('name').eq('user_id', user.id).maybeSingle(),
  ])

  // Company owners who land here by mistake go to their dashboard
  if (!contractor && !profile) {
    const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
    if (company) redirect('/dashboard')
  }

  const name = contractor?.name ?? profile?.name ?? user.email ?? 'Contractor'

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <PortalSidebar contractorName={name} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
