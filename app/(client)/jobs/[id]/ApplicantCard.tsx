'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Application = {
  id: string; status: string; cover_note: string | null
  expected_rate: number | null; created_at: string
}
type Profile = {
  id: string; name: string; role: string | null; country: string | null
  hourly_rate: number | null; skills: string[] | null; bio: string | null
  email: string; user_id: string; cv_path: string | null
  linkedin_url: string | null; portfolio_url: string | null; github_url: string | null
  portfolio_items: { id: string; storage_path: string; caption: string | null }[]
} | null

const NEXT_STAGES: Record<string, { label: string; to: string }[]> = {
  applied: [{ label: 'Shortlist', to: 'shortlisted' }, { label: 'Reject', to: 'rejected' }],
  shortlisted: [{ label: 'Interview', to: 'interviewing' }, { label: 'Reject', to: 'rejected' }],
  interviewing: [{ label: 'Hire', to: 'hired' }, { label: 'Reject', to: 'rejected' }],
  rejected: [{ label: 'Reconsider', to: 'applied' }],
  hired: [],
}

export default function ApplicantCard({ application, profile, companyId, jobTitle }: {
  application: Application; profile: Profile; companyId: string; jobTitle: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hireOpen, setHireOpen] = useState(false)
  const [offerRate, setOfferRate] = useState(
    String(application.expected_rate ?? profile?.hourly_rate ?? '')
  )
  const router = useRouter()
  const supabase = createClient()

  async function openCV() {
    if (!profile?.cv_path) return
    const { data } = await supabase.storage.from('cvs').createSignedUrl(profile.cv_path, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else setError('Could not open CV')
  }

  async function move(to: string) {
    setLoading(true)
    setError('')

    // Hiring creates the contractor record on the roster (linked to their login)
    // at the rate the company confirmed in the hire dialog.
    if (to === 'hired' && profile) {
      const agreedRate = parseFloat(offerRate)
      if (!agreedRate || agreedRate <= 0) { setError('Enter a valid hourly rate'); setLoading(false); return }
      const { data: existing } = await supabase.from('contractors')
        .select('id').eq('company_id', companyId).eq('email', profile.email).maybeSingle()
      if (!existing) {
        const { error: insErr } = await supabase.from('contractors').insert({
          company_id: companyId,
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: profile.role ?? jobTitle,
          country: profile.country ?? 'Philippines',
          hourly_rate: agreedRate,
          currency: 'USD',
          contract_type: 'fulltime',
          pool_type: 'marketplace',
          source: 'staffingatlas',
          status: 'active',
        })
        if (insErr) { setError(insErr.message); setLoading(false); return }
      }
      setHireOpen(false)
    }

    const { error: upErr } = await supabase.from('job_applications')
      .update({ status: to }).eq('id', application.id)
    if (upErr) { setError(upErr.message); setLoading(false); return }

    // Notify the applicant of the outcome (fire-and-forget)
    if (to === 'hired' || to === 'interviewing' || to === 'shortlisted') {
      fetch('/api/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'application_status', id: application.id }),
      }).catch(() => {})
    }

    setLoading(false)
    router.refresh()
  }

  if (!profile) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{profile.name}</p>
          <p className="text-xs text-slate-400">{profile.role ?? '—'} · {profile.country ?? 'Remote'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-900">
            ${Number(application.expected_rate ?? profile.hourly_rate ?? 0).toFixed(0)}/hr
          </p>
          <p className="text-[10px] text-slate-400">{application.expected_rate ? 'asked' : 'profile rate'}</p>
        </div>
      </div>

      {(profile.skills ?? []).length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {(profile.skills ?? []).slice(0, 5).map(s => (
            <span key={s} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{s}</span>
          ))}
        </div>
      )}

      {application.cover_note && (
        <p className="text-sm text-slate-600 mt-3 leading-relaxed border-l-2 border-slate-200 pl-3">
          {application.cover_note}
        </p>
      )}

      {(profile.portfolio_items ?? []).length > 0 && (
        <div className="flex gap-2 mt-3">
          {(profile.portfolio_items ?? []).slice(0, 4).map(item => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={item.id}
              src={supabase.storage.from('portfolio').getPublicUrl(item.storage_path).data.publicUrl}
              alt={item.caption ?? 'Work sample'} title={item.caption ?? ''}
              className="w-16 h-16 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80"
              onClick={() => window.open(supabase.storage.from('portfolio').getPublicUrl(item.storage_path).data.publicUrl, '_blank')}
            />
          ))}
        </div>
      )}

      {(profile.cv_path || profile.linkedin_url || profile.portfolio_url || profile.github_url) && (
        <div className="flex items-center gap-3 mt-3 flex-wrap text-xs font-semibold">
          {profile.cv_path && (
            <button onClick={openCV} className="text-navy hover:underline">View CV</button>
          )}
          {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener" className="text-slate-500 hover:text-navy">LinkedIn</a>}
          {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener" className="text-slate-500 hover:text-navy">Portfolio</a>}
          {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener" className="text-slate-500 hover:text-navy">GitHub</a>}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        {NEXT_STAGES[application.status]?.map(s => (
          <button key={s.to}
            onClick={() => s.to === 'hired' ? setHireOpen(true) : move(s.to)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              s.to === 'rejected' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
              s.to === 'hired' ? 'bg-green-600 text-white hover:bg-green-700' :
              'bg-navy text-white hover:bg-navy-deep'
            }`}>
            {loading ? '…' : s.label}
          </button>
        ))}
        <span className="text-[11px] text-slate-300 ml-auto">
          applied {new Date(application.created_at).toLocaleDateString()}
        </span>
      </div>

      {hireOpen && (
        <div className="mt-3 border-2 border-green-200 bg-green-50/50 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-900 mb-1">Confirm hire — set the agreed rate</p>
          <p className="text-xs text-slate-500 mb-3">
            They asked ${Number(application.expected_rate ?? profile.hourly_rate ?? 0).toFixed(2)}/hr.
            You can offer a different rate — make sure you&apos;ve agreed on it in messages first.
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input type="number" step="0.5" min="1" value={offerRate}
                onChange={e => setOfferRate(e.target.value)}
                className="w-28 pl-7 pr-2 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
            </div>
            <span className="text-xs text-slate-400">/hr USD</span>
            <button onClick={() => move('hired')} disabled={loading}
              className="ml-auto px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
              {loading ? 'Hiring…' : `Hire at $${offerRate || '0'}/hr`}
            </button>
            <button onClick={() => setHireOpen(false)} className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
