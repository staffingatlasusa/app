'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Trash2 } from 'lucide-react'

type Member = { id: string; email: string; role: string; status: string; created_at: string }

export default function TeamCard({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/team/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Invite failed'); return }
    setMembers(prev => [...prev, data.member])
    setEmail('')
    router.refresh()
  }

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.email} from your team?`)) return
    setLoading(true)
    const res = await fetch(`/api/team/invite?id=${member.id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== member.id))
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
      <h2 className="font-semibold text-slate-900 mb-1">Team</h2>
      <p className="text-sm text-slate-500 mb-5">
        Managers can approve timesheets, manage tasks and contractors, and message the team — but can&apos;t change billing or settings.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <form onSubmit={invite} className="flex gap-2 mb-5">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          placeholder="teammate@company.com"
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-50">
          <UserPlus size={14} /> {loading ? 'Inviting…' : 'Invite'}
        </button>
      </form>

      {members.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-3">No team members yet — it&apos;s just you</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {members.map(m => (
            <div key={m.id} className="py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{m.email}</p>
                <p className="text-xs text-slate-400 capitalize">{m.role}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                m.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber/10 text-amber-600'
              }`}>{m.status}</span>
              <button onClick={() => remove(m)} disabled={loading}
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
