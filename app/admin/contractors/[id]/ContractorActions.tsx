'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'
import { Pencil, Trash2, Power } from 'lucide-react'

type Contractor = {
  id: string; name: string; email: string; role: string; country: string | null
  hourly_rate: number; currency: string; contract_type: string | null
  pool_type: string | null; status: string
}

export default function ContractorActions({ contractor }: { contractor: Contractor }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: contractor.name ?? '',
    email: contractor.email ?? '',
    role: contractor.role ?? '',
    country: contractor.country ?? '',
    hourly_rate: String(contractor.hourly_rate ?? 0),
    currency: contractor.currency ?? 'USD',
    contract_type: contractor.contract_type ?? 'fulltime',
    pool_type: contractor.pool_type ?? 'marketplace',
  })
  const router = useRouter()
  const active = contractor.status === 'active'

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/contractors/${contractor.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await patch({ ...form, hourly_rate: parseFloat(form.hourly_rate) || 0 })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setEditing(false)
    router.refresh()
  }

  async function toggleStatus() {
    setLoading(true)
    await patch({ status: active ? 'inactive' : 'active' })
    setLoading(false)
    router.refresh()
  }

  async function remove() {
    if (!confirm(`Delete contractor ${contractor.name}? Their timesheets and payroll history will also be removed. This cannot be undone.`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/contractors/${contractor.id}`, { method: 'DELETE' })
    setLoading(false)
    if (res.ok) router.push('/admin/contractors')
    else { const d = await res.json(); alert(d.error ?? 'Delete failed') }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3857F1] text-white text-xs font-semibold rounded-lg hover:bg-[#2a46d4] transition-colors">
          <Pencil size={13} /> Edit
        </button>
        <button onClick={toggleStatus} disabled={loading}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
            active ? 'bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20' : 'bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
          }`}>
          <Power size={13} /> {active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={remove} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold rounded-lg hover:bg-[#EF4444]/20 transition-colors disabled:opacity-50">
          <Trash2 size={13} /> Delete
        </button>
      </div>

      {editing && (
        <AdminModal title={`Edit ${contractor.name}`} onClose={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-3">
            {error && <p className="text-xs px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">{error}</p>}
            {[
              { key: 'name', label: 'Full name', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'country', label: 'Country', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Hourly rate</label>
                <input type="number" step="0.5" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]">
                  <option>USD</option><option>AUD</option><option>GBP</option><option>EUR</option><option>PHP</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Contract type</label>
                <select value={form.contract_type} onChange={e => set('contract_type', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]">
                  <option value="fulltime">Full-time</option>
                  <option value="parttime">Part-time</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Pool type</label>
                <select value={form.pool_type} onChange={e => set('pool_type', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]">
                  <option value="marketplace">Marketplace</option>
                  <option value="vetted">Vetted</option>
                  <option value="private">Private</option>
                </select>
              </div>
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
