import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PerformanceNotes from './PerformanceNotes'
import DocumentVault from '@/components/DocumentVault'
import ContractsCard from './ContractsCard'

export default async function ContractorDetailPage({ params }: { params: { id: string } }) {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id, name').eq('owner_id', user!.id).single()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('id, name, email, role, country, hourly_rate, currency, contract_type, pool_type, status, user_id, created_at')
    .eq('id', params.id)
    .eq('company_id', company?.id ?? '')
    .maybeSingle()
  if (!contractor) notFound()

  const [{ data: timesheets }, { data: notes }, { data: documents }] = await Promise.all([
    supabase.from('timesheets').select('id, date, hours_worked, status, task_description')
      .eq('contractor_id', contractor.id).order('date', { ascending: false }).limit(15),
    supabase.from('performance_notes').select('id, rating, note, created_at')
      .eq('contractor_id', contractor.id).order('created_at', { ascending: false }),
    supabase.from('documents').select('id, name, storage_path, category, size, created_at')
      .eq('contractor_id', contractor.id).order('created_at', { ascending: false }),
  ])

  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, title, status, created_at, contractor_signed_at')
    .eq('contractor_id', contractor.id)
    .order('created_at', { ascending: false })

  const approvedHours = (timesheets ?? []).filter(t => t.status === 'approved')
    .reduce((s, t) => s + Number(t.hours_worked), 0)
  const ratings = (notes ?? []).filter(n => n.rating != null).map(n => Number(n.rating))
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  const info = [
    { label: 'Email', value: contractor.email },
    { label: 'Country', value: contractor.country ?? '—' },
    { label: 'Rate', value: `${contractor.currency} ${Number(contractor.hourly_rate).toFixed(2)}/hr` },
    { label: 'Contract', value: contractor.contract_type ?? '—' },
    { label: 'Portal access', value: contractor.user_id ? 'Active' : 'Not invited' },
    { label: 'Avg rating', value: avgRating ? `${avgRating.toFixed(1)} / 5` : 'No ratings' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/contractors" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors">
        <ArrowLeft size={13} /> All contractors
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">{contractor.name}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          contractor.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>{contractor.status}</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">{contractor.role} · {approvedHours.toFixed(1)} approved hours (recent)</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {info.map(i => (
          <div key={i.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{i.label}</p>
            <p className="text-sm font-medium text-slate-900 truncate">{i.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Recent timesheets</h2>
          {(timesheets ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">No timesheets yet</p>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {(timesheets ?? []).map(t => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{new Date(t.date).toLocaleDateString()} · {t.hours_worked}h</p>
                    {t.task_description && <p className="text-xs text-slate-400 truncate">{t.task_description}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    t.status === 'approved' ? 'bg-green-50 text-green-700' :
                    t.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber/10 text-amber-600'
                  }`}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Performance notes</h2>
          <PerformanceNotes
            contractorId={contractor.id}
            companyId={company!.id}
            initialNotes={notes ?? []}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Contracts</h2>
        <ContractsCard
          companyId={company!.id}
          companyName={company!.name}
          contractor={{
            id: contractor.id, name: contractor.name, role: contractor.role,
            hourly_rate: Number(contractor.hourly_rate), currency: contractor.currency,
          }}
          initialContracts={contracts ?? []}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">Documents</h2>
        <DocumentVault
          companyId={company!.id}
          contractorId={contractor.id}
          initialDocs={documents ?? []}
          canDelete
        />
      </div>
    </div>
  )
}
