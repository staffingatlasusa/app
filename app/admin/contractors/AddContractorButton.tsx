'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'
import { Plus } from 'lucide-react'

export default function AddContractorButton({ companies }: { companies: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', role: '', company_id: '',
    hourly_rate: '', currency: 'USD', contract_type: 'fulltime',
    country: 'Philippines', pool_type: 'marketplace',
  })
  const router = useRouter()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/contractors/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, hourly_rate: parseFloat(form.hourly_rate) || 0 }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3857F1] text-white text-sm font-semibold rounded-lg hover:bg-[#2a46d4] transition-colors">
        <Plus size={15} /> Add Contractor
      </button>

      {open && (
        <AdminModal title="Add Contractor" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-xs px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">{error}</p>}
            {[
              { key: 'name', label: 'Full name', type: 'text', placeholder: 'Maria Santos' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'maria@example.com' },
              { key: 'role', label: 'Role / Position', type: 'text', placeholder: 'e.g. Virtual Assistant' },
              { key: 'hourly_rate', label: 'Hourly rate (USD)', type: 'number', placeholder: '0' },
              { key: 'country', label: 'Country', type: 'text', placeholder: 'Philippines' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} required={['name', 'email', 'role'].includes(key)}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1] placeholder:text-[#8B8FA8]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-[#8B8FA8] mb-1">Company</label>
              <select value={form.company_id} onChange={e => set('company_id', e.target.value)} required
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]">
                <option value="">Select company…</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#3857F1] text-white font-semibold rounded-lg text-sm hover:bg-[#2a46d4] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating…' : 'Create contractor'}
            </button>
          </form>
        </AdminModal>
      )}
    </>
  )
}
