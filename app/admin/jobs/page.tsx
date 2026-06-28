import { createAdminClient } from '@/lib/supabase/server'

type JobRow = {
  id: string; title: string; role_category: string | null; status: string
  created_at: string; expires_at: string | null
  companies: { name: string } | null
}

export default async function AdminJobsPage() {
  const db = createAdminClient()
  const { data: jobs } = await db
    .from('job_postings')
    .select('id, title, role_category, status, created_at, expires_at, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Job Postings</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{jobs?.length ?? 0} total</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Title</th>
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Category</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Expires</th>
              <th className="text-left px-5 py-3 font-semibold">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {((jobs ?? []) as JobRow[]).map(j => (
              <tr key={j.id} className="hover:bg-[#0F1117] transition-colors">
                <td className="px-5 py-3 font-medium">{j.title}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{j.companies?.name ?? '—'}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{j.role_category ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    j.status === 'active' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                    j.status === 'featured' ? 'bg-[#F5C842]/10 text-[#F5C842]' :
                    j.status === 'removed' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{j.status}</span>
                </td>
                <td className="px-5 py-3 text-[#8B8FA8]">{j.expires_at ? new Date(j.expires_at).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{new Date(j.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {(jobs ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-[#8B8FA8]">No job postings yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
