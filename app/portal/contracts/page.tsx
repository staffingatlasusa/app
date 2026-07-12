import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileSignature } from 'lucide-react'

export default async function PortalContractsPage() {
  const ctx = await getContractorContext()
  if (!ctx.contractor) redirect('/portal')
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, status, created_at, contractor_signed_at')
    .eq('contractor_id', ctx.contractor.id)
    .order('created_at', { ascending: false })

  const list = contracts ?? []
  const pending = list.filter(c => c.status === 'sent').length

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900">Contracts</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">
        {pending > 0 ? `${pending} awaiting your signature` : 'Your agreements with your company'}
      </p>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <FileSignature size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No contracts yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {list.map(c => (
            <Link key={c.id} href={`/portal/contracts/${c.id}`}
              className="px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
              <FileSignature size={16} className="text-slate-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                <p className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                c.status === 'sent' ? 'bg-amber/10 text-amber-600' :
                c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {c.status === 'sent' ? 'Sign now' : c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
