import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import NewJobButton from './NewJobButton'

export default async function JobsPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user!.id).single()

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('id, title, role_category, status, created_at, job_applications(id, status)')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  const list = jobs ?? []

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.filter(j => j.status === 'active').length} active</p>
        </div>
        <NewJobButton companyId={company?.id ?? ''} />
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <Briefcase size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400 mb-1">No job postings yet</p>
          <p className="text-sm text-slate-400">Post a role and marketplace contractors can apply directly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(j => {
            const apps = (j.job_applications ?? []) as { id: string; status: string }[]
            const newApps = apps.filter(a => a.status === 'applied').length
            return (
              <Link key={j.id} href={`/jobs/${j.id}`}
                className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-navy transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{j.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        j.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{j.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {j.role_category ?? 'General'} · posted {new Date(j.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900">{apps.length}</p>
                    <p className="text-xs text-slate-400">
                      applicant{apps.length === 1 ? '' : 's'}{newApps > 0 && <span className="text-amber-600 font-semibold"> · {newApps} new</span>}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
