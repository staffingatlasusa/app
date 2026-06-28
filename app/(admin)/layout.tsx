import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (role?.role !== 'superadmin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
