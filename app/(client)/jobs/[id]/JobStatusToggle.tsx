'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JobStatusToggle({ jobId, status }: { jobId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const active = status === 'active'

  async function toggle() {
    setLoading(true)
    await supabase.from('job_postings').update({ status: active ? 'closed' : 'active' }).eq('id', jobId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
        active ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-50 text-green-700 hover:bg-green-100'
      }`}>
      {loading ? '…' : active ? 'Close job' : 'Reopen job'}
    </button>
  )
}
