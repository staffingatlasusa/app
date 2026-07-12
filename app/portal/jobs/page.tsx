import { createClient } from '@/lib/supabase/server'
import { getContractorContext } from '@/lib/portal'
import { Briefcase } from 'lucide-react'
import ApplyButton from './ApplyButton'

export default async function PortalJobsPage() {
  const ctx = await getContractorContext()
  const supabase = await createClient()

  const [{ data: jobs }, { data: myApps }] = await Promise.all([
    supabase.from('job_postings')
      .select('id, title, role_category, description, rate_min, rate_max, hours_per_week, created_at, companies(name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('job_applications')
      .select('id, job_id, status, created_at')
      .eq('user_id', ctx.userId),
  ])

  const applied = new Map((myApps ?? []).map(a => [a.job_id, a.status]))
  const list = jobs ?? []

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Find Work</h1>
      <p className="text-sm text-slate-500 mt-0.5 mb-6">
        {list.length} open role{list.length === 1 ? '' : 's'} · {applied.size} application{applied.size === 1 ? '' : 's'} sent
      </p>

      {!ctx.profile && (
        <div className="mb-6 bg-amber/10 border border-amber/30 rounded-xl px-5 py-4 text-sm text-slate-600">
          Complete your <a href="/portal/profile" className="font-semibold text-navy underline">profile</a> first — companies see it with your application.
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <Briefcase size={28} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400">No open roles right now — check back soon</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(j => {
            const company = j.companies as unknown as { name: string } | null
            const myStatus = applied.get(j.id)
            return (
              <div key={j.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{j.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {company?.name ?? 'Company'} · {j.role_category ?? 'General'}
                      {j.hours_per_week && ` · ${j.hours_per_week}h/wk`}
                    </p>
                    {j.description && (
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">{j.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {j.rate_min != null && (
                      <p className="text-sm font-bold text-slate-900">
                        ${j.rate_min}{j.rate_max ? `–$${j.rate_max}` : '+'}/hr
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mb-3">{new Date(j.created_at).toLocaleDateString()}</p>
                    {myStatus ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        myStatus === 'hired' ? 'bg-green-50 text-green-700' :
                        myStatus === 'rejected' ? 'bg-slate-100 text-slate-400' :
                        'bg-navy/10 text-navy'
                      }`}>{myStatus}</span>
                    ) : (
                      <ApplyButton jobId={j.id} userId={ctx.userId} profileId={ctx.profile?.id ?? null} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
