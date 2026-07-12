'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignBox({ contractId, contractorName }: { contractId: string; contractorName: string }) {
  const [name, setName] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function sign(e: React.FormEvent) {
    e.preventDefault()
    if (!agree) { setError('Please confirm you agree to the terms'); return }
    if (name.trim().toLowerCase() !== contractorName.trim().toLowerCase()) {
      setError(`Please type your name exactly as it appears on the contract: "${contractorName}"`)
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('contracts').update({
      status: 'active',
      contractor_signatory: name.trim(),
      contractor_signed_at: new Date().toISOString(),
    }).eq('id', contractId)
    setLoading(false)
    if (err) { setError(err.message); return }
    fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'contract_signed', id: contractId }),
    }).catch(() => {})
    router.refresh()
  }

  return (
    <form onSubmit={sign} className="mt-6 bg-white rounded-xl border-2 border-amber/40 p-6 print:hidden">
      <h2 className="font-semibold text-slate-900 mb-1">Sign this contract</h2>
      <p className="text-sm text-slate-500 mb-4">
        Typing your full name below constitutes your electronic signature.
      </p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}
      <input value={name} onChange={e => setName(e.target.value)} required
        placeholder={`Type your full name: ${contractorName}`}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy mb-3" />
      <label className="flex items-start gap-2.5 text-sm text-slate-600 mb-4 cursor-pointer">
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5" />
        I have read and agree to the terms of this agreement, and I intend my typed name to be my legal electronic signature.
      </label>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
        {loading ? 'Signing…' : 'Sign contract'}
      </button>
    </form>
  )
}
