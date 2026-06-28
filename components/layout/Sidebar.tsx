'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Clock, CheckSquare, DollarSign,
  MessageSquare, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/contractors',  icon: Users,            label: 'Contractors' },
  { href: '/timesheets',   icon: Clock,            label: 'Timesheets' },
  { href: '/tasks',        icon: CheckSquare,      label: 'Tasks' },
  { href: '/payroll',      icon: DollarSign,       label: 'Payroll' },
  { href: '/messages',     icon: MessageSquare,    label: 'Messages' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-navy-deep flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="text-xl font-black text-white tracking-tight">
          Staffing<span className="text-amber">Atlas</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} className={active ? 'text-amber' : 'text-white/40 group-hover:text-white/70'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-white/30" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
            pathname === '/settings' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings size={17} className="text-white/40 group-hover:text-white/70" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all group"
        >
          <LogOut size={17} className="text-white/40 group-hover:text-white/70" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
