'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VettingActions({ applicationId }: { applicationId: string; contractorEmail?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function action(type: 'approve' | 'reject') {
    if (type === 'reject' && !confirm('Reject this application?')) return
    setLoading(true)
    await fetch(`/api/admin/vetting/${applicationId}/${type}`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => action('approve')}
        disabled={loading}
        className="px-3 py-1.5 bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 rounded-lg text-xs font-medium hover:bg-[#22C55E]/20 transition-colors disabled:opacity-40"
      >
        Approve
      </button>
      <button
        onClick={() => action('reject')}
        disabled={loading}
        className="px-3 py-1.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 rounded-lg text-xs font-medium hover:bg-[#EF4444]/20 transition-colors disabled:opacity-40"
      >
        Reject
      </button>
    </div>
  )
}
