import { getAdminSession } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import AdminSidebarShell from '@/components/admin/AdminSidebarShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-[#0F1117]">
      <AdminSidebarShell session={session} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
