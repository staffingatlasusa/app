'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { defaultContractBody } from '@/lib/contract-template'
import { FileSignature, X } from 'lucide-react'
import Link from 'next/link'

type Contract = {
  id: string; title: string; status: string; created_at: string
  contractor_signed_at: string | null
}

const STATUS_STYLE: Record<string, string> = {
  sent: 'bg-amber/10 text-amber-600',
  active: 'bg-green-50 text-green-700',
  voided: 'bg-slate-100 text-slate-400',
}

export default function ContractsCard({ companyId, companyName, contractor, initialContracts }: {
  companyId: string; companyName: string
  contractor: { id: string; name: string; role: string; hourly_rate: number; currency: string }
  initialContracts: Contract[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(`Contractor Agreement — ${contractor.name}`)
  const [signatory, setSignatory] = useState('')
  const [body, setBody] = useState(() => defaultContractBody({
    company: companyName, contractor: contractor.name, role: contractor.role,
    rate: Number(contractor.hourly_rate).toFixed(2), currency: contractor.currency,
  }))
  const router = useRouter()
  const supabase = createClient()

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.from('contracts').insert({
      company_id: companyId,
      contractor_id: contractor.id,
      title: title.trim(),
      body,
      status: 'sent',
      company_signatory: signatory.trim(),
      company_signed_at: new Date().toISOString(),
    }).select('id').single()
    setLoading(false)
    if (err) { setError(err.message); return }
    if (data) {
      fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'contract_sent', id: data.id }),
      }).catch(() => {})
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="space-y-2">
        {initialContracts.length === 0 ? (
          <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">
            No contracts yet
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {initialContracts.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <FileSignature size={15} className="text-slate-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/contracts/${c.id}`} className="text-sm font-medium text-slate-900 hover:text-navy truncate block">{c.title}</Link>
                  <p className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString()}
                    {c.contractor_signed_at && ` · signed ${new Date(c.contractor_signed_at).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[c.status] ?? STATUS_STYLE.voided}`}>
                  {c.status === 'sent' ? 'awaiting signature' : c.status}
                </span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-deep transition-colors">
          <FileSignature size={13} /> New contract
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="font-semibold text-slate-900">New contract for {contractor.name}</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={send} className="px-6 py-5 space-y-4 overflow-y-auto">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Agreement text <span className="text-slate-400 font-normal">— edit freely before sending</span>
                </label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={14} required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-navy resize-y" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your full legal name (signs on send)</label>
                <input value={signatory} onChange={e => setSignatory(e.target.value)} required placeholder="Type your full name to sign"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors disabled:opacity-60">
                {loading ? 'Sending…' : 'Sign & send to contractor'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
