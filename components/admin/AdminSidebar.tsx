'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Users, Briefcase, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/contractors', label: 'Contractors', icon: Briefcase },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-5 py-5 border-b border-gray-800">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Super Admin</p>
        <p className="text-lg font-bold mt-0.5">StaffingAtlas</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-amber-500 text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
