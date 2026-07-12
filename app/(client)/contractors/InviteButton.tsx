'use client'

import { useState } from 'react'

export default function InviteButton({ contractorId }: { contractorId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function invite() {
    setState('sending')
    const res = await fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'portal_invite', id: contractorId }),
    })
    setState(res.ok ? 'sent' : 'error')
  }

  if (state === 'sent') return <span className="text-xs font-medium text-green-600">Invite sent ✓</span>
  return (
    <button onClick={invite} disabled={state === 'sending'}
      className="text-xs font-semibold text-amber-600 hover:underline disabled:opacity-50">
      {state === 'sending' ? 'Sending…' : state === 'error' ? 'Retry invite' : 'Invite to portal'}
    </button>
  )
}
