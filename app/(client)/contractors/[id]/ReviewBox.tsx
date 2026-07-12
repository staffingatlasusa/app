'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'

type Review = { id: string; rating: number; comment: string | null } | null

export default function ReviewBox({ companyId, contractorId, contractorProfileId, existing }: {
  companyId: string; contractorId: string; contractorProfileId: string | null; existing: Review
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setMsg('Pick a star rating'); return }
    setSaving(true)
    setMsg('')
    const payload = {
      company_id: companyId,
      contractor_id: contractorId,
      contractor_profile_id: contractorProfileId,
      rating,
      comment: comment.trim() || null,
    }
    const { error } = existing
      ? await supabase.from('reviews').update(payload).eq('id', existing.id)
      : await supabase.from('reviews').insert(payload)
    setSaving(false)
    setMsg(error ? error.message : 'Review saved')
    if (!error) router.refresh()
  }

  return (
    <form onSubmit={save} className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-900 mb-1">
        {existing ? 'Your review' : 'Review this contractor'}
      </p>
      <p className="text-xs text-slate-400 mb-3">
        Shown publicly on their marketplace profile — help other companies hire with confidence.
      </p>
      {msg && (
        <p className={`text-xs px-3 py-2 rounded-lg mb-3 ${
          msg === 'Review saved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>{msg}</p>
      )}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5" aria-label={`${n} stars`}>
            <Star size={22} className={n <= rating ? 'fill-amber text-amber' : 'text-slate-200'} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
        placeholder="How was working with them? Communication, quality, reliability…"
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none mb-3" />
      <button type="submit" disabled={saving}
        className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-50">
        {saving ? 'Saving…' : existing ? 'Update review' : 'Publish review'}
      </button>
    </form>
  )
}
