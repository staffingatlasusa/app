import { createClient } from '@/lib/supabase/server'
import { getMyCompany } from '@/lib/company'
import { requireActivePlan } from '@/lib/plan'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ApplicantCard from './ApplicantCard'
import JobStatusToggle from './JobStatusToggle'

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
]

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { company } = await getMyCompany(supabase, user!)

  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, role_category, description, rate_min, rate_max, hours_per_week, status, created_at')
    .eq('id', params.id)
    .eq('company_id', company?.id ?? '')
    .maybeSingle()
  if (!job) notFound()

  const { data: applications } = await supabase
    .from('job_applications')
    .select('id, status, cover_note, expected_rate, created_at, contractor_profiles(id, name, role, country, hourly_rate, skills, bio, email, user_id, cv_path, linkedin_url, portfolio_url, github_url, portfolio_items(id, storage_path, caption))')
    .eq('job_id', job.id)
    .order('created_at', { ascending: false })

  const apps = applications ?? []

  return (
    <div className="p-8 max-w-6xl">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 mb-4 transition-colors">
        <ArrowLeft size={13} /> All jobs
      </Link>
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {job.role_category}
            {job.rate_min != null && ` · $${job.rate_min}${job.rate_max ? `–$${job.rate_max}` : ''}/hr`}
            {job.hours_per_week && ` · ${job.hours_per_week}h/wk`}
            {` · ${apps.length} applicant${apps.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <JobStatusToggle jobId={job.id} status={job.status} />
      </div>
      {job.description && <p className="text-sm text-slate-600 max-w-2xl mt-3 mb-8 leading-relaxed">{job.description}</p>}

      <div className="mt-6 space-y-8">
        {STAGES.map(stage => {
          const stageApps = apps.filter(a => a.status === stage.key)
          if (stageApps.length === 0 && (stage.key === 'hired' || stage.key === 'rejected')) return null
          return (
            <div key={stage.key}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-3">
                {stage.label} <span className="text-slate-300">({stageApps.length})</span>
              </h2>
              {stageApps.length === 0 ? (
                <p className="text-sm text-slate-300 border border-dashed border-slate-200 rounded-xl px-4 py-5 text-center">
                  {stage.key === 'applied' ? 'No new applicants yet — active jobs appear in every contractor portal' : 'Empty'}
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {stageApps.map(a => (
                    <ApplicantCard
                      key={a.id}
                      application={{
                        id: a.id, status: a.status, cover_note: a.cover_note,
                        expected_rate: a.expected_rate, created_at: a.created_at,
                      }}
                      profile={a.contractor_profiles as unknown as {
                        id: string; name: string; role: string | null; country: string | null
                        hourly_rate: number | null; skills: string[] | null; bio: string | null
                        email: string; user_id: string; cv_path: string | null
                        linkedin_url: string | null; portfolio_url: string | null; github_url: string | null
                        portfolio_items: { id: string; storage_path: string; caption: string | null }[]
                      } | null}
                      companyId={company!.id}
                      jobTitle={job.title}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
