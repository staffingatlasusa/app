'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

export default function SubmitTimesheetButton({ contractorId, companyId }: { contractorId: string; companyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    hours: '',
    description: '',
  })
  const router = useRouter()
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const hours = parseFloat(form.hours)
    if (!hours || hours <= 0 || hours > 24) { setError('Hours must be between 0 and 24'); return }
    setError('')
    setLoading(true)
    const { error: err } = await supabase.from('timesheets').insert({
      contractor_id: contractorId,
      company_id: companyId,
      date: form.date,
      hours_worked: hours,
      task_description: form.description.trim() || null,
      status: 'pending',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setOpen(false)
    setForm({ date: new Date().toISOString().slice(0, 10), hours: '', description: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors">
        <Plus size={15} /> Submit timesheet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Submit timesheet</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input type="date" value={form.date} max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hours worked</label>
                <input type="number" step="0.25" min="0.25" max="24" value={form.hours}
                  onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} required placeholder="8"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">What did you work on?</label>
                <textarea value={form.description} rows={3}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the work done"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
                {loading ? 'Submitting…' : 'Submit for approval'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
