import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminContractorDetailPage({ params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: contractor } = await db
    .from('contractors')
    .select('id, name, email, role, country, hourly_rate, currency, status, pool_type, contract_type, company_id, user_id, created_at, companies(name)')
    .eq('id', params.id)
    .maybeSingle()
  if (!contractor) notFound()

  const [{ data: timesheets }, { data: vetting }] = await Promise.all([
    db.from('timesheets').select('id, date, hours_worked, status, task_description')
      .eq('contractor_id', contractor.id).order('date', { ascending: false }).limit(20),
    db.from('vetted_applications').select('status, created_at').eq('contractor_id', contractor.id).maybeSingle(),
  ])

  const approvedHours = (timesheets ?? []).filter((t: { status: string }) => t.status === 'approved')
    .reduce((s: number, t: { hours_worked: number }) => s + Number(t.hours_worked), 0)

  const company = contractor.companies as { name: string } | null

  const info = [
    { label: 'Email', value: contractor.email },
    { label: 'Company', value: company?.name ?? '—' },
    { label: 'Country', value: contractor.country ?? '—' },
    { label: 'Rate', value: `${contractor.currency} ${Number(contractor.hourly_rate).toFixed(2)}/hr` },
    { label: 'Contract', value: contractor.contract_type ?? '—' },
    { label: 'Pool', value: contractor.pool_type ?? '—' },
    { label: 'Vetting', value: vetting?.status ?? 'not applied' },
    { label: 'Portal access', value: contractor.user_id ? 'linked' : 'no account' },
  ]

  return (
    <div className="p-8 text-[#F0F2FF]">
      <Link href="/admin/contractors" className="inline-flex items-center gap-1.5 text-xs text-[#8B8FA8] hover:text-[#F0F2FF] mb-4 transition-colors">
        <ArrowLeft size={13} /> All contractors
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">{contractor.name}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          contractor.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#8B8FA8]/10 text-[#8B8FA8]'
        }`}>{contractor.status}</span>
      </div>
      <p className="text-sm text-[#8B8FA8] mb-6">{contractor.role} · {approvedHours.toFixed(1)} approved hours all-time</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {info.map(i => (
          <div key={i.label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[#8B8FA8] mb-1">{i.label}</p>
            <p className="text-sm font-medium truncate">{i.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8B8FA8] mb-3">Recent timesheets</h2>
      {(timesheets ?? []).length === 0 ? (
        <p className="text-sm text-[#8B8FA8]">No timesheets submitted.</p>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Date</th>
                <th className="text-left px-5 py-3 font-semibold">Hours</th>
                <th className="text-left px-5 py-3 font-semibold">Description</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D3E]">
              {(timesheets ?? []).map((t: { id: string; date: string; hours_worked: number; status: string; task_description: string | null }) => (
                <tr key={t.id} className="hover:bg-[#20242F] transition-colors">
                  <td className="px-5 py-3">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-semibold">{t.hours_worked}h</td>
                  <td className="px-5 py-3 text-[#8B8FA8] max-w-xs truncate">{t.task_description || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      t.status === 'approved' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                      t.status === 'rejected' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                      'bg-[#F59E0B]/10 text-[#F59E0B]'
                    }`}>{t.status}</span>
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
