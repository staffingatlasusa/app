'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const CURRENCIES = ['USD', 'AUD', 'GBP', 'EUR', 'PHP']
const COUNTRIES = ['Philippines', 'India', 'Pakistan', 'Bangladesh', 'Indonesia', 'Vietnam', 'Kenya', 'Nigeria', 'Other']

export default function NewContractorPage() {
  const [form, setForm] = useState({
    name: '', email: '', role: '', department: '',
    country: 'Philippines', timezone: 'Asia/Manila',
    hourly_rate: '', currency: 'USD', contract_type: 'fulltime',
    start_date: '', notes: '', source: 'direct', pool_type: 'marketplace',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: company } = await supabase.from('companies').select('id').single()
    if (!company) { setError('Company not found'); setLoading(false); return }

    const { error: err } = await supabase.from('contractors').insert({
      ...form,
      company_id: company.id,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      start_date: form.start_date || null,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/contractors')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/contractors" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft size={15} /> Back to contractors
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Add contractor</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name" required>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className={input} placeholder="Maria Santos" />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={input} placeholder="m.santos@email.com" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Role / Title" required>
            <input type="text" value={form.role} onChange={e => set('role', e.target.value)} required className={input} placeholder="Full-Stack Developer" />
          </Field>
          <Field label="Department">
            <input type="text" value={form.department} onChange={e => set('department', e.target.value)} className={input} placeholder="Engineering" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Hourly rate" required>
            <input type="number" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)} required min="0" step="0.01" className={input} placeholder="18" />
          </Field>
          <Field label="Currency">
            <select value={form.currency} onChange={e => set('currency', e.target.value)} className={input}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Contract type">
            <select value={form.contract_type} onChange={e => set('contract_type', e.target.value)} className={input}>
              <option value="fulltime">Full-time</option>
              <option value="parttime">Part-time</option>
              <option value="project">Project</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Country">
            <select value={form.country} onChange={e => set('country', e.target.value)} className={input}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={input} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Source">
            <select value={form.source} onChange={e => set('source', e.target.value)} className={input}>
              <option value="staffingatlas">StaffingAtlas</option>
              <option value="direct">Direct hire</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Pool type">
            <select value={form.pool_type} onChange={e => set('pool_type', e.target.value)} className={input}>
              <option value="marketplace">Marketplace</option>
              <option value="vetted">Vetted</option>
            </select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={input + ' resize-none'} placeholder="Any notes about this contractor…" />
        </Field>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep disabled:opacity-60 transition-colors">
            {loading ? 'Saving…' : 'Add contractor'}
          </button>
          <Link href="/contractors" className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const input = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white'
