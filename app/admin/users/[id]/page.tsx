import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import UserActions from '../UserActions'

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const db = createAdminClient()

  const { data: { user }, error } = await db.auth.admin.getUserById(params.id)
  if (error || !user) notFound()

  const [{ data: role }, { data: company }, { data: contractor }, { data: profile }, { data: audit }] = await Promise.all([
    db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle(),
    db.from('companies').select('id, name, plan').eq('owner_id', user.id).maybeSingle(),
    db.from('contractors').select('id, name, role, company_id, companies(name)').eq('user_id', user.id).maybeSingle(),
    db.from('contractor_profiles').select('id, name, role, status').eq('user_id', user.id).maybeSingle(),
    db.from('admin_audit_log').select('action, created_at, details').eq('entity_id', user.id)
      .order('created_at', { ascending: false }).limit(10),
  ])

  const accountType = company ? 'Company owner' : contractor ? 'Hired contractor' : profile ? 'Marketplace contractor' : 'No profile'

  const info = [
    { label: 'Email', value: user.email ?? '—' },
    { label: 'Account type', value: accountType },
    { label: 'Role', value: role?.role ?? 'user' },
    { label: 'Confirmed', value: user.email_confirmed_at ? 'Yes' : 'No' },
    { label: 'Joined', value: new Date(user.created_at).toLocaleDateString() },
    { label: 'Last sign-in', value: user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never' },
  ]

  return (
    <div className="p-8 text-[#F0F2FF]">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-[#8B8FA8] hover:text-[#F0F2FF] mb-4 transition-colors">
        <ArrowLeft size={13} /> All users
      </Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{user.email}</h1>
          <p className="text-sm text-[#8B8FA8]">{accountType}</p>
        </div>
        <UserActions userId={user.id} email={user.email ?? ''} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {info.map(i => (
          <div key={i.label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-[#8B8FA8] mb-1">{i.label}</p>
            <p className="text-sm font-medium truncate">{i.value}</p>
          </div>
        ))}
      </div>

      {(company || contractor || profile) && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8B8FA8] mb-3">Linked records</h2>
          <div className="space-y-2">
            {company && (
              <Link href={`/admin/companies/${company.id}`} className="block bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-5 py-3.5 hover:border-[#3857F1] transition-colors">
                <span className="text-xs text-[#8B8FA8] uppercase tracking-wide mr-3">Company</span>
                <span className="font-medium">{company.name}</span>
                <span className="text-xs text-[#8B8FA8] ml-2">({company.plan})</span>
              </Link>
            )}
            {contractor && (
              <Link href={`/admin/contractors/${contractor.id}`} className="block bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-5 py-3.5 hover:border-[#3857F1] transition-colors">
                <span className="text-xs text-[#8B8FA8] uppercase tracking-wide mr-3">Contractor</span>
                <span className="font-medium">{contractor.name}</span>
                <span className="text-xs text-[#8B8FA8] ml-2">{contractor.role} at {(contractor.companies as { name: string } | null)?.name}</span>
              </Link>
            )}
            {profile && !contractor && (
              <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl px-5 py-3.5">
                <span className="text-xs text-[#8B8FA8] uppercase tracking-wide mr-3">Marketplace profile</span>
                <span className="font-medium">{profile.name}</span>
                <span className="text-xs text-[#8B8FA8] ml-2">{profile.role ?? '—'} · {profile.status}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8B8FA8] mb-3">Admin actions on this user</h2>
      {(audit ?? []).length === 0 ? (
        <p className="text-sm text-[#8B8FA8]">No admin activity recorded.</p>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl divide-y divide-[#2A2D3E]">
          {(audit ?? []).map((a: { action: string; created_at: string }, i: number) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">{a.action.replace(/_/g, ' ')}</span>
              <span className="text-xs text-[#8B8FA8]">{new Date(a.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
