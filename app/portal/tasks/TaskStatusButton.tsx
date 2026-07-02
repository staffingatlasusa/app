'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NEXT: Record<string, { label: string; to: string }> = {
  todo: { label: 'Start', to: 'in_progress' },
  in_progress: { label: 'Submit for review', to: 'review' },
  review: { label: 'Awaiting review', to: '' },
}

export default function TaskStatusButton({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const next = NEXT[status]
  if (!next) return null

  async function advance() {
    if (!next.to || loading) return
    setLoading(true)
    await supabase.from('tasks').update({ status: next.to }).eq('id', id)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={advance}
      disabled={!next.to || loading}
      className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
        next.to
          ? 'bg-navy text-white hover:bg-navy-deep disabled:opacity-60'
          : 'bg-slate-100 text-slate-400 cursor-default'
      }`}
    >
      {loading ? 'Saving…' : next.label}
    </button>
  )
}
