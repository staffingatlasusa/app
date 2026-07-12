'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'
import { Pencil, Trash2 } from 'lucide-react'

type Company = { id: string; name: string; industry: string | null; country: string | null; plan: string | null; trial_ends: string | null }

export default function CompanyActions({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: company.name ?? '',
    industry: company.industry ?? '',
    country: company.country ?? '',
    plan: company.plan ?? 'trial',
    trial_ends: company.trial_ends?.slice(0, 10) ?? '',
  })
  const router = useRouter()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/companies/${company.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (!confirm(`Delete company "${company.name}"? This removes all its contractors, timesheets, and payroll data. This cannot be undone.`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/companies/${company.id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) router.push('/admin/companies')
    else { const d = await res.json(); alert(d.error ?? 'Delete failed') }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3857F1] text-white text-xs font-semibold rounded-lg hover:bg-[#2a46d4] transition-colors">
          <Pencil size={13} /> Edit
        </button>
        <button onClick={remove} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold rounded-lg hover:bg-[#EF4444]/20 transition-colors disabled:opacity-50">
          <Trash2 size={13} /> Delete
        </button>
      </div>

      {editing && (
        <AdminModal title={`Edit ${company.name}`} onClose={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-3">
            {error && <p className="text-xs px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">{error}</p>}
            {[
              { key: 'name', label: 'Company name', type: 'text' },
              { key: 'industry', label: 'Industry', type: 'text' },
              { key: 'country', label: 'Country', type: 'text' },
              { key: 'trial_ends', label: 'Trial ends', type: 'date' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Plan</label>
              <select value={form.plan} onChange={e => set('plan', e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]">
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#3857F1] text-white font-semibold rounded-lg text-sm hover:bg-[#2a46d4] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </AdminModal>
      )}
    </>
  )
}
