'use client'

import { useState } from 'react'
import type { AdminSession } from '@/lib/admin/auth'
import { useRouter } from 'next/navigation'

type AdminUser = { id: string; name: string; email: string; role: string; is_active: boolean; last_login: string | null; created_at: string }
type Setting = { key: string; value: string }
type Template = { id: string; template_key: string; subject: string; updated_at: string }
type AuditEntry = { id: string; action: string; entity_type: string | null; entity_id: string | null; ip_address: string | null; created_at: string; admin_users: { name: string } | null }

export default function AdminSettingsTabs({
  session, adminUsers, settings, templates, auditLog
}: {
  session: AdminSession
  adminUsers: AdminUser[]
  settings: Setting[]
  templates: Template[]
  auditLog: AuditEntry[]
}) {
  const [tab, setTab] = useState('admins')
  const [settingValues, setSettingValues] = useState(Object.fromEntries(settings.map(s => [s.key, s.value])))
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  const tabs = [
    { key: 'admins', label: 'Admin Users' },
    { key: 'config', label: 'Platform Config' },
    { key: 'templates', label: 'Email Templates' },
    { key: 'audit', label: 'Audit Log' },
  ]

  async function saveSetting(key: string, value: string) {
    setSaving(key)
    await fetch(`/api/admin/settings/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    })
    setSaving(null)
  }

  async function deactivateAdmin(id: string) {
    if (!confirm('Deactivate this admin account?')) return
    await fetch(`/api/admin/admins/${id}/deactivate`, { method: 'POST' })
    router.refresh()
  }

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-[#2A2D3E]">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'text-[#F0F2FF] border-b-2 border-[#3857F1]' : 'text-[#8B8FA8] hover:text-[#F0F2FF]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Admin Users */}
      {tab === 'admins' && (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Last Login</th>
                {session.role === 'superadmin' && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D3E]">
              {adminUsers.map(a => (
                <tr key={a.id} className="hover:bg-[#0F1117]">
                  <td className="px-5 py-3 font-medium">{a.name}</td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{a.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${a.role === 'superadmin' ? 'bg-[#3857F1]/20 text-[#3857F1]' : 'bg-[#2A2D3E] text-[#8B8FA8]'}`}>{a.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${a.is_active ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>{a.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-3 text-[#8B8FA8]">{a.last_login ? new Date(a.last_login).toLocaleString() : 'Never'}</td>
                  {session.role === 'superadmin' && (
                    <td className="px-5 py-3 text-right">
                      {a.id !== session.id && a.is_active && (
                        <button onClick={() => deactivateAdmin(a.id)} className="text-xs text-[#EF4444] hover:underline">Deactivate</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Platform Config */}
      {tab === 'config' && (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl divide-y divide-[#2A2D3E] max-w-2xl">
          {settings.map(s => (
            <div key={s.key} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium capitalize">{s.key.replace(/_/g, ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={settingValues[s.key] ?? s.value}
                  onChange={e => setSettingValues(v => ({ ...v, [s.key]: e.target.value }))}
                  className="w-32 px-3 py-1.5 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]"
                />
                <button
                  onClick={() => saveSetting(s.key, settingValues[s.key])}
                  disabled={saving === s.key}
                  className="px-3 py-1.5 bg-[#3857F1] text-white text-xs font-medium rounded-lg hover:bg-[#2a46d4] disabled:opacity-40 transition-colors"
                >
                  {saving === s.key ? '…' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Email Templates */}
      {tab === 'templates' && (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl divide-y divide-[#2A2D3E]">
          {templates.map(t => (
            <div key={t.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{t.template_key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-[#8B8FA8] mt-0.5">{t.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#8B8FA8]">Updated {new Date(t.updated_at).toLocaleDateString()}</span>
                <a href={`/admin/settings/templates/${t.template_key}`} className="text-xs text-[#3857F1] hover:underline">Edit</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log */}
      {tab === 'audit' && (
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D3E] text-xs text-[#8B8FA8] uppercase tracking-wide">
                <th className="text-left px-5 py-3">Time</th>
                <th className="text-left px-5 py-3">Admin</th>
                <th className="text-left px-5 py-3">Action</th>
                <th className="text-left px-5 py-3">Entity</th>
                <th className="text-left px-5 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D3E]">
              {auditLog.map((entry: AuditEntry) => (
                <tr key={entry.id} className="hover:bg-[#0F1117]">
                  <td className="px-5 py-2.5 text-[#8B8FA8] text-xs">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-xs">{entry.admin_users?.name ?? '—'}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-[#3857F1]">{entry.action}</td>
                  <td className="px-5 py-2.5 text-xs text-[#8B8FA8]">{entry.entity_type ? `${entry.entity_type}` : '—'}</td>
                  <td className="px-5 py-2.5 text-xs text-[#8B8FA8] font-mono">{entry.ip_address ?? '—'}</td>
                </tr>
              ))}
              {auditLog.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8B8FA8]">No audit entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
