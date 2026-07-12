'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, Briefcase, CheckSquare,
  Handshake, FileText, DollarSign, CreditCard, Star,
  BarChart2, Megaphone, Settings, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import type { AdminSession } from '@/lib/admin/auth'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/contractors', label: 'Contractors', icon: Briefcase },
  { href: '/admin/vetting', label: 'Vetting Queue', icon: CheckSquare },
  { href: '/admin/matches', label: 'Match Orders', icon: Handshake },
  { href: '/admin/jobs', label: 'Job Postings', icon: FileText },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/featured', label: 'Featured', icon: Star },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/content', label: 'Content', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebarShell({ session }: { session: AdminSession }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#1A1D27] border-b border-[#2A2D3E] flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold text-[#3857F1] uppercase tracking-widest">Admin Panel</p>
          <p className="text-sm font-bold text-[#F0F2FF]">StaffingAtlas</p>
        </div>
        <button onClick={() => setOpen(!open)} className="text-[#8B8FA8] hover:text-[#F0F2FF] p-1" aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Backdrop */}
      {open && <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />}

    <aside
      onClick={() => setOpen(false)}
      className={`w-60 shrink-0 bg-[#1A1D27] border-r border-[#2A2D3E] flex-col min-h-screen z-40 fixed inset-y-0 left-0 transform transition-transform md:static md:translate-x-0 md:flex ${
        open ? 'translate-x-0 flex' : '-translate-x-full hidden md:flex'
      }`}>
      <div className="px-5 py-5 border-b border-[#2A2D3E]">
        <p className="text-[10px] font-semibold text-[#3857F1] uppercase tracking-widest mb-1">Admin Panel</p>
        <p className="text-base font-bold text-[#F0F2FF]">StaffingAtlas</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                active
                  ? 'bg-[#3857F1] text-white'
                  : 'text-[#8B8FA8] hover:bg-[#0F1117] hover:text-[#F0F2FF]'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} />}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-3 border-t border-[#2A2D3E] space-y-1">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-[#F0F2FF] truncate">{session.name}</p>
          <p className="text-[10px] text-[#8B8FA8] capitalize">{session.role}</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-[#8B8FA8] hover:text-[#F0F2FF] hover:bg-[#0F1117] transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
    </>
  )
}
