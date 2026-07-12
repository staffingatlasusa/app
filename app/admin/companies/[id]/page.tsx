import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CompanyActions from './CompanyActions'

export default async function AdminCompanyDetailPage({ params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: company } = await db
    .from('companies')
    .select('id, name, industry, country, plan, trial_ends, created_at, owner_id')
    .eq('id', params.id)
    .maybeSingle()
  if (!company) notFound()

  const [{ data: owner }, { data: sub }, { data: contractors }, { data: timesheets }] = await Promise.all([
    db.auth.admin.getUserById(company.owner_id).then((r: { data: { user: { email?: string } | null } }) => ({ data: r.data.user })),
    db.from('subscriptions').select('status, contractor_limit, current_period_end').eq('company_id', company.id).maybeSingle(),
    db.from('contractors').select('id, name, role, status, hourly_rate, currency, pool_type').eq('company_id', company.id),
    db.from('timesheets').select('hours_worked, status').eq('company_id', company.id),
  ])

  const approvedHours = (timesheets ?? []).filter((t: { status: string }) => t.status === 'approved')
    .reduce((s: number, t: { hours_worked: number }) => s + Number(t.hours_worked), 0)

  const info = [
    { label: 'Owner', value: owner?.email ?? '—' },
    { label: 'Industry', value: company.industry ?? '—' },
    { label: 'Country', value: company.country ?? '—' },
    { label: 'Plan', value: company.plan ?? 'trial' },
    { label: 'Trial ends', value: company.trial_ends ? new Date(company.trial_ends).toLocaleDateString() : '—' },
    { label: 'Subscription', value: sub?.status ?? 'none' },
    { label: 'Contractor limit', value: sub?.contractor_limit?.toString() ?? '—' },
    { label: 'Created', value: new Date(company.created_at).toLocaleDateString() },
  ]

  return (
    <div className="p-8 text-[#F0F2FF]">
      <Link href="/admin/companies" className="inline-flex items-center gap-1.5 text-xs text-[#8B8FA8] hover:text-[#F0F2FF] mb-4 transition-colors">
        <ArrowLeft size={13} /> All companies
      </Link>
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <CompanyActions company={company} />
      </div>
      <p className="text-sm text-[#8B8FA8] mb-6">{(contractors ?? []).length} contractors · {approvedHours.toFixed(1)} approved hours</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {info.map(i => (
          <div key={i.label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[#8B8FA8] mb-1">{i.label}</p>
            <p className="text-sm font-medium truncate">{i.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8B8FA8] mb-3">Contractors</h2>
      {(contractors ?? []).length === 0 ? (
        <p className="text-sm text-[#8B8FA8]">No contractors yet.</p>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Name</th>
                <th className="text-left px-5 py-3 font-semibold">Role</th>
                <th className="text-left px-5 py-3 font-semibold">Rate</th>
                <th className="text-left px-5 py-3 font-semibold">Pool</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D3E]">
              {(contractors ?? []).map((c: { id: string; name: string; role: string; status: string; hourly_rate: number; currency: string; pool_type: string }) => (
                <tr key={c.id} className="hover:bg-[#20242F] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/contractors/${c.id}`} className="font-medium hover:text-[#3857F1] transition-colors">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{c.role}</td>
                  <td className="px-5 py-3">{c.currency} {Number(c.hourly_rate).toFixed(2)}/hr</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{c.pool_type}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#8B8FA8]/10 text-[#8B8FA8]'
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
