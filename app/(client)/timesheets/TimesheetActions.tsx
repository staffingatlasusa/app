'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export default function TimesheetActions({ id }: { id: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function update(status: 'approved' | 'rejected') {
    setLoading(status === 'approved' ? 'approve' : 'reject')
    await supabase.from('timesheets').update({ status }).eq('id', id)
    // Notify the contractor; email failure never blocks the action
    fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'timesheet_status', id }),
    }).catch(() => {})
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => update('approved')}
        disabled={loading !== null}
        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
        title="Approve"
      >
        <Check size={14} />
      </button>
      <button
        onClick={() => update('rejected')}
        disabled={loading !== null}
        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
        title="Reject"
      >
        <X size={14} />
      </button>
    </div>
  )
}
