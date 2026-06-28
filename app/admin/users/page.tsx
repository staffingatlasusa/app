import { createAdminClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import UserActions from './UserActions'

export default async function AdminUsersPage() {
  const db = createAdminClient()
  const { data: { users } } = await db.auth.admin.listUsers() as { data: { users: User[] } }
  const { data: roles } = await db.from('user_roles').select('user_id, role')
  const { data: companies } = await db.from('companies').select('owner_id, name')

  const roleMap = Object.fromEntries((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]))
  const companyMap = Object.fromEntries((companies ?? []).map((c: { owner_id: string; name: string }) => [c.owner_id, c.name]))

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">{users.length} total registered users</p>
      </div>

      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold">Email</th>
              <th className="text-left px-5 py-3 font-semibold">Company</th>
              <th className="text-left px-5 py-3 font-semibold">Role</th>
              <th className="text-left px-5 py-3 font-semibold">Confirmed</th>
              <th className="text-left px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D3E]">
            {users.map((u: User) => (
              <tr key={u.id} className="hover:bg-[#0F1117] transition-colors">
                <td className="px-5 py-3 font-medium">{u.email}</td>
                <td className="px-5 py-3 text-[#8B8FA8]">{companyMap[u.id] ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    roleMap[u.id] === 'superadmin' ? 'bg-[#3857F1]/20 text-[#3857F1]' : 'bg-[#2A2D3E] text-[#8B8FA8]'
                  }`}>{roleMap[u.id] ?? 'user'}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.email_confirmed_at ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                    {u.email_confirmed_at ? 'Yes' : 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[#8B8FA8]">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-right">
                  <UserActions userId={u.id} email={u.email ?? ''} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
