'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PayrollActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function advance() {
    setLoading(true)
    const next = status === 'draft' ? 'approved' : 'paid'
    await supabase.from('payroll_summaries').update({ status: next }).eq('id', id)
    if (next === 'approved') {
      // Notify the contractor their summary is ready; failure never blocks
      fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'payroll_ready', id }),
      }).catch(() => {})
    }
    router.refresh()
    setLoading(false)
  }

  if (status === 'paid') return <span className="text-xs text-slate-400">Paid</span>

  return (
    <button
      onClick={advance}
      disabled={loading}
      className="text-xs font-semibold text-navy hover:underline disabled:opacity-50"
    >
      {loading ? '…' : status === 'draft' ? 'Approve' : 'Mark paid'}
    </button>
  )
}
