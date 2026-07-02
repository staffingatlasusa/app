'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string; name: string; role: string | null; country: string | null
  bio: string | null; hourly_rate: number | null; skills: string[] | null; status: string
} | null

export default function ProfileForm({ userId, email, profile }: { userId: string; email: string; profile: Profile }) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    role: profile?.role ?? '',
    country: profile?.country ?? 'Philippines',
    bio: profile?.bio ?? '',
    hourly_rate: profile?.hourly_rate?.toString() ?? '',
    skills: (profile?.skills ?? []).join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const payload = {
      user_id: userId,
      email,
      name: form.name.trim(),
      role: form.role.trim() || null,
      country: form.country,
      bio: form.bio.trim() || null,
      hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      status: profile?.status ?? 'pending',
    }
    const { error } = profile
      ? await supabase.from('contractor_profiles').update(payload).eq('id', profile.id)
      : await supabase.from('contractor_profiles').insert(payload)
    setSaving(false)
    setMsg(error ? error.message : 'Profile saved')
    if (!error) router.refresh()
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {msg && (
        <p className={`text-sm px-3 py-2 rounded-lg ${
          msg === 'Profile saved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>{msg}</p>
      )}

      {profile?.status && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Marketplace status:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            profile.status === 'approved' ? 'bg-green-50 text-green-700' :
            profile.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber/10 text-amber-600'
          }`}>{profile.status}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Role / headline</label>
          <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Virtual Assistant"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
          <select value={form.country} onChange={e => set('country', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy">
            <option>Philippines</option><option>India</option><option>Pakistan</option>
            <option>Bangladesh</option><option>Indonesia</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hourly rate (USD)</label>
          <input type="number" step="0.5" min="1" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} placeholder="10"
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label>
        <input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="e.g. Excel, Customer Service, Shopify"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
        <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4}
          placeholder="Tell companies about your experience"
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
      </div>

      <button type="submit" disabled={saving}
        className="px-6 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
