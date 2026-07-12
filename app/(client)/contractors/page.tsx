import { createClient } from '@/lib/supabase/server'
import { requireActivePlan } from '@/lib/plan'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import InviteButton from './InviteButton'

export default async function ContractorsPage() {
  await requireActivePlan()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', user!.id).single()
  const { data: contractors } = await supabase
    .from('contractors')
    .select('*')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  const list = contractors ?? []

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
          <p className="text-sm text-slate-500 mt-0.5">{list.length} total</p>
        </div>
        <Link
          href="/contractors/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold hover:bg-navy-deep transition-colors"
        >
          <Plus size={15} />
          Add contractor
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-16 text-center">
          <p className="text-slate-400 mb-4">No contractors yet</p>
          <Link href="/contractors/new" className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-semibold">
            <Plus size={15} /> Add first contractor
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Name</th>
                <th className="text-left px-5 py-3 font-semibold">Role</th>
                <th className="text-left px-5 py-3 font-semibold">Country</th>
                <th className="text-left px-5 py-3 font-semibold">Rate</th>
                <th className="text-left px-5 py-3 font-semibold">Type</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Portal</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c.role}</td>
                  <td className="px-5 py-3.5 text-slate-500">{c.country}</td>
                  <td className="px-5 py-3.5 font-medium">{c.currency} {Number(c.hourly_rate).toFixed(2)}/hr</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                      {c.contract_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.status === 'active' ? 'bg-green-50 text-green-700' :
                      c.status === 'inactive' ? 'bg-slate-100 text-slate-500' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.user_id
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">Active</span>
                      : <InviteButton contractorId={c.id} />}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/contractors/${c.id}`} className="text-xs font-medium text-navy hover:underline">View</Link>
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
