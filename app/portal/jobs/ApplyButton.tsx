'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

export default function ApplyButton({ jobId, userId, profileId }: {
  jobId: string; userId: string; profileId: string | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [rate, setRate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function apply(e: React.FormEvent) {
    e.preventDefault()
    if (!profileId) { setError('Complete your profile first'); return }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('job_applications').insert({
      job_id: jobId,
      user_id: userId,
      contractor_profile_id: profileId,
      cover_note: note.trim() || null,
      expected_rate: rate ? parseFloat(rate) : null,
      status: 'applied',
    }).select('id').single()
    setLoading(false)
    if (err) { setError(err.message.includes('duplicate') ? 'You already applied to this job' : err.message); return }
    // Let the company know (fire-and-forget)
    if (data) {
      fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'new_application', id: data.id }),
      }).catch(() => {})
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-deep transition-colors">
        Apply
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl text-left">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Apply for this role</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={apply} className="px-6 py-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Why you&apos;re a great fit</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} required
                  placeholder="Short pitch — relevant experience, availability, timezone…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your rate for this role (USD/hr) <span className="text-slate-400 font-normal">— optional</span></label>
                <input type="number" step="0.5" min="1" value={rate} onChange={e => setRate(e.target.value)} placeholder="Uses your profile rate if blank"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
                {loading ? 'Sending…' : 'Send application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
