'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

const CATEGORIES = ['Virtual Assistant', 'Customer Support', 'Development', 'Design', 'Marketing', 'Accounting', 'Data Entry', 'Other']

export default function NewJobButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', role_category: 'Virtual Assistant', description: '',
    rate_min: '', rate_max: '', hours_per_week: '40',
  })
  const router = useRouter()
  const supabase = createClient()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('job_postings').insert({
      company_id: companyId,
      title: form.title.trim(),
      role_category: form.role_category,
      description: form.description.trim() || null,
      rate_min: form.rate_min ? parseFloat(form.rate_min) : null,
      rate_max: form.rate_max ? parseFloat(form.rate_max) : null,
      hours_per_week: form.hours_per_week ? parseInt(form.hours_per_week) : null,
      status: 'active',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ title: '', role_category: 'Virtual Assistant', description: '', rate_min: '', rate_max: '', hours_per_week: '40' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors">
        <Plus size={15} /> Post a job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Post a job</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Job title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} required
                  placeholder="e.g. Executive Virtual Assistant"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                  <select value={form.role_category} onChange={e => set('role_category', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Hours / week</label>
                  <input type="number" min="1" max="60" value={form.hours_per_week} onChange={e => set('hours_per_week', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Rate min (USD/hr)</label>
                  <input type="number" step="0.5" value={form.rate_min} onChange={e => set('rate_min', e.target.value)} placeholder="5"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Rate max (USD/hr)</label>
                  <input type="number" step="0.5" value={form.rate_max} onChange={e => set('rate_max', e.target.value)} placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  placeholder="Responsibilities, requirements, timezone overlap…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
                {loading ? 'Posting…' : 'Publish job'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
