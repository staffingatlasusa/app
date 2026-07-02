'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Clock, CheckSquare, DollarSign,
  MessageSquare, User, LogOut, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/portal',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/portal/timesheets', icon: Clock,           label: 'Timesheets' },
  { href: '/portal/tasks',      icon: CheckSquare,     label: 'Tasks' },
  { href: '/portal/messages',   icon: MessageSquare,   label: 'Messages' },
  { href: '/portal/payroll',    icon: DollarSign,      label: 'Payroll' },
]

export default function PortalSidebar({ contractorName }: { contractorName: string }) {
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
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/portal" className="text-xl font-black text-white tracking-tight">
          Staffing<span className="text-amber">Atlas</span>
        </Link>
        <p className="text-xs text-white/40 mt-1 truncate">{contractorName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/portal' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} className={active ? 'text-amber' : 'text-white/40 group-hover:text-white/70'} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto text-white/30" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-3 text-center">
        <p className="text-[10px] text-white/20 leading-relaxed">
          © {new Date().getFullYear()} StaffingAtlas<br />
          <a href="https://aiotechlab.com" target="_blank" rel="noopener" className="hover:text-white/40 transition-colors">
            an AIO Technologies company
          </a>
        </p>
      </div>

      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link
          href="/portal/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
            pathname === '/portal/profile' ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
          }`}
        >
          <User size={17} className="text-white/40 group-hover:text-white/70" />
          Profile
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
