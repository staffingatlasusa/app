import { createAdminClient } from '@/lib/supabase/server'
import VettingActions from './VettingActions'

type VettingRow = {
  id: string; status: string; submitted_at: string; reviewer_notes: string | null
  contractors: { id: string; name: string; role: string; email: string } | null
  transactions: { status: string; amount: number } | null
}

export default async function AdminVettingPage() {
  const db = createAdminClient()
  const { data: apps } = await db
    .from('vetted_applications')
    .select('id, status, submitted_at, reviewer_notes, contractors(id,name,role,email), transactions(status,amount)')
    .order('submitted_at', { ascending: true })

  const pending = (apps ?? []).filter((a: VettingRow) => a.status === 'pending')
  const approved = (apps ?? []).filter((a: VettingRow) => a.status === 'approved').length
  const rejected = (apps ?? []).filter((a: VettingRow) => a.status === 'rejected').length

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vetting Queue</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Review contractor applications</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending', value: pending.length, color: 'text-[#F59E0B]' },
          { label: 'Approved (total)', value: approved, color: 'text-[#22C55E]' },
          { label: 'Rejected (total)', value: rejected, color: 'text-[#EF4444]' },
          { label: 'Total Applications', value: apps?.length ?? 0, color: 'text-[#F0F2FF]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5">
            <p className="text-xs text-[#8B8FA8] mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {(pending as VettingRow[]).map(app => {
          const days = Math.floor((Date.now() - new Date(app.submitted_at).getTime()) / 86400000)
          return (
            <div key={app.id} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-semibold">{app.contractors?.name ?? 'Unknown'}</p>
                  <span className="px-2 py-0.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full text-xs">Pending</span>
                </div>
                <p className="text-sm text-[#8B8FA8]">{app.contractors?.role} · {app.contractors?.email}</p>
                <p className="text-xs text-[#8B8FA8] mt-1">Submitted {days} day{days !== 1 ? 's' : ''} ago · Fee: {app.transactions?.status === 'paid' ? <span className="text-[#22C55E]">Paid</span> : <span className="text-[#F59E0B]">Unpaid</span>}</p>
              </div>
              <VettingActions applicationId={app.id} contractorEmail={app.contractors?.email ?? ''} />
            </div>
          )
        })}
        {pending.length === 0 && (
          <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-12 text-center text-[#8B8FA8]">
            No pending applications
          </div>
        )}
      </div>
    </div>
  )
}
