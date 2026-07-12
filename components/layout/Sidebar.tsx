'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Clock, CheckSquare, DollarSign,
  MessageSquare, Settings, LogOut, ChevronRight, Menu, X, Briefcase
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/contractors',  icon: Users,            label: 'Contractors' },
  { href: '/jobs',         icon: Briefcase,        label: 'Jobs' },
  { href: '/timesheets',   icon: Clock,            label: 'Timesheets' },
  { href: '/tasks',        icon: CheckSquare,      label: 'Tasks' },
  { href: '/payroll',      icon: DollarSign,       label: 'Payroll' },
  { href: '/messages',     icon: MessageSquare,    label: 'Messages' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-navy-deep flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link href="/dashboard" className="text-lg font-black text-white tracking-tight">
          Staffing<span className="text-amber">Atlas</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="text-white/70 hover:text-white p-1" aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Backdrop */}
      {open && <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />}

    <aside
      onClick={() => setOpen(false)}
      className={`w-60 min-h-screen bg-navy-deep flex-col shrink-0 z-40 fixed inset-y-0 left-0 transform transition-transform md:static md:translate-x-0 md:flex ${
        open ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'
      }`}>
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

      {/* Copyright */}
      <div className="px-5 py-3 text-center">
        <p className="text-[10px] text-white/20 leading-relaxed">
          © {new Date().getFullYear()} StaffingAtlas<br />
          <a href="https://aiotechlab.com" target="_blank" rel="noopener" className="hover:text-white/40 transition-colors">
            an AIO Technologies company
          </a>
        </p>
      </div>

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
    </>
  )
}
