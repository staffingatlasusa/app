'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Manila', 'Asia/Singapore', 'Australia/Sydney']
const INDUSTRIES = ['Technology', 'Financial Services', 'Healthcare', 'Legal', 'Accounting', 'Construction', 'E-commerce', 'Other']

type Company = { id: string; name: string; industry?: string; country?: string; timezone?: string; plan?: string; trial_ends?: string }

export default function SettingsForm({ company, userEmail }: { company: Company | null; userEmail: string }) {
  const [form, setForm] = useState({
    name: company?.name ?? '',
    industry: company?.industry ?? '',
    country: company?.country ?? '',
    timezone: company?.timezone ?? 'UTC',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (company?.id) {
      await supabase.from('companies').update(form).eq('id', company.id)
    } else {
      // Recovery path: company row was never created at signup
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('companies').insert({ ...form, owner_id: user.id })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const planBadge: Record<string, string> = {
    trial: 'bg-amber/10 text-amber-700',
    starter: 'bg-blue-50 text-blue-700',
    growth: 'bg-navy/10 text-navy',
    enterprise: 'bg-green-50 text-green-700',
  }

  return (
    <div className="space-y-6">
      {/* Plan card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 mb-0.5">Plan</h2>
            <p className="text-sm text-slate-500">{userEmail}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${planBadge[company?.plan ?? 'trial'] ?? ''}`}>
            {company?.plan ?? 'trial'}
          </span>
        </div>
        {company?.plan === 'trial' && company?.trial_ends && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
            Trial ends <strong>{new Date(company.trial_ends).toLocaleDateString()}</strong>
            <button className="ml-4 text-navy font-semibold hover:underline">Upgrade now</button>
          </div>
        )}
      </div>

      {/* Company settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-5">Company details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Company name">
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className={input}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Industry">
              <select value={form.industry} onChange={e => set('industry', e.target.value)} className={input}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Country">
              <input type="text" value={form.country} onChange={e => set('country', e.target.value)} className={input} placeholder="United States" />
            </Field>
          </div>
          <Field label="Timezone">
            <select value={form.timezone} onChange={e => set('timezone', e.target.value)} className={input}>
              {TIMEZONES.map(tz => <option key={tz}>{tz}</option>)}
            </select>
          </Field>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const input = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white'
