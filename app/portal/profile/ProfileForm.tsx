'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string; name: string; role: string | null; country: string | null
  bio: string | null; hourly_rate: number | null; skills: string[] | null; status: string
  photo_url?: string | null; cv_path?: string | null
  linkedin_url?: string | null; portfolio_url?: string | null; github_url?: string | null
} | null

export default function ProfileForm({ userId, email, profile }: { userId: string; email: string; profile: Profile }) {
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    role: profile?.role ?? '',
    country: profile?.country ?? 'Philippines',
    bio: profile?.bio ?? '',
    hourly_rate: profile?.hourly_rate?.toString() ?? '',
    skills: (profile?.skills ?? []).join(', '),
    linkedin_url: profile?.linkedin_url ?? '',
    portfolio_url: profile?.portfolio_url ?? '',
    github_url: profile?.github_url ?? '',
  })
  const [cvPath, setCvPath] = useState(profile?.cv_path ?? '')
  const [cvUploading, setCvUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function uploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg('CV must be under 5MB'); return }
    setCvUploading(true)
    setMsg('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const path = `${userId}/cv.${ext}`
    const { error } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
    setCvUploading(false)
    if (error) { setMsg(error.message); return }
    setCvPath(path)
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg('Photo must be under 2MB'); return }
    setUploading(true)
    setMsg('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setMsg(error.message); setUploading(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Cache-bust so the new photo shows immediately
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`)
    setUploading(false)
  }

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
      photo_url: photoUrl || null,
      cv_path: cvPath || null,
      linkedin_url: form.linkedin_url.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
      github_url: form.github_url.trim() || null,
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

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoUrl} alt="Profile photo" className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-slate-300">{(form.name || '?').charAt(0).toUpperCase()}</span>}
        </div>
        <div>
          <label className="inline-block px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
            {uploading ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="hidden" disabled={uploading} />
          </label>
          <p className="text-xs text-slate-400 mt-1.5">JPG, PNG or WebP · max 2MB</p>
        </div>
      </div>

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

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">CV / Resume</label>
        <div className="flex items-center gap-3">
          <label className="inline-block px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
            {cvUploading ? 'Uploading…' : cvPath ? 'Replace CV' : 'Upload CV'}
            <input type="file" accept=".pdf,.doc,.docx" onChange={uploadCV} className="hidden" disabled={cvUploading} />
          </label>
          {cvPath && <span className="text-xs text-green-600 font-medium">CV on file ✓ (save to confirm)</span>}
        </div>
        <p className="text-xs text-slate-400 mt-1.5">PDF or Word · max 5MB · shown to companies you apply to</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'linkedin.com/in/…' },
          { key: 'portfolio_url', label: 'Portfolio site', placeholder: 'yoursite.com' },
          { key: 'github_url', label: 'GitHub / Behance', placeholder: 'github.com/…' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            <input type="url" value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
              placeholder={`https://${placeholder}`}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
          </div>
        ))}
      </div>

      <button type="submit" disabled={saving}
        className="px-6 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
