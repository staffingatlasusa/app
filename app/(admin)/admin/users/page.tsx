import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: roles } = await supabase.from('user_roles').select('user_id, role')
  const { data: { users } } = await admin.auth.admin.listUsers()

  const roleMap = Object.fromEntries((roles ?? []).map(r => [r.user_id, r.role]))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Users</h1>
      <p className="text-sm text-slate-500 mb-8">{users.length} total</p>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
              <th className="text-left px-6 py-3 font-semibold">Email</th>
              <th className="text-left px-6 py-3 font-semibold">Role</th>
              <th className="text-left px-6 py-3 font-semibold">Confirmed</th>
              <th className="text-left px-6 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{u.email}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    roleMap[u.id] === 'superadmin'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {roleMap[u.id] ?? 'owner'}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-500">{u.email_confirmed_at ? 'Yes' : 'No'}</td>
                <td className="px-6 py-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
