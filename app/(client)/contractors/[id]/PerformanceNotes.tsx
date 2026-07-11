'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

type Note = { id: string; rating: number | null; note: string; created_at: string }

export default function PerformanceNotes({ contractorId, companyId, initialNotes }: {
  contractorId: string; companyId: string; initialNotes: Note[]
}) {
  const [note, setNote] = useState('')
  const [rating, setRating] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('performance_notes').insert({
      contractor_id: contractorId,
      company_id: companyId,
      note: note.trim(),
      rating: rating || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setNote('')
    setRating(0)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}
              className="p-0.5" aria-label={`Rate ${n} of 5`}>
              <Star size={18} className={n <= rating ? 'fill-amber text-amber' : 'text-slate-200'} />
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-2">{rating ? `${rating}/5` : 'Optional rating'}</span>
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} required
          placeholder="Add a performance note…"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
        />
        <button type="submit" disabled={saving || !note.trim()}
          className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-50">
          {saving ? 'Saving…' : 'Add note'}
        </button>
      </form>

      {initialNotes.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {initialNotes.map(n => (
            <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-1.5">
                {n.rating ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={13} className={s <= n.rating! ? 'fill-amber text-amber' : 'text-slate-200'} />
                    ))}
                  </div>
                ) : <span />}
                <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{n.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
