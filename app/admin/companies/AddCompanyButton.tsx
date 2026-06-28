'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'
import { Plus } from 'lucide-react'

export default function AddCompanyButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', owner_email: '', industry: '', country: '', plan: 'trial' })
  const router = useRouter()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/companies/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setOpen(false)
    setForm({ name: '', owner_email: '', industry: '', country: '', plan: 'trial' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3857F1] text-white text-sm font-semibold rounded-lg hover:bg-[#2a46d4] transition-colors">
        <Plus size={15} /> Add Company
      </button>

      {open && (
        <AdminModal title="Add Company" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-xs px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">{error}</p>}
            {[
              { key: 'name', label: 'Company name', type: 'text', placeholder: 'Acme Corp' },
              { key: 'owner_email', label: 'Owner email', type: 'email', placeholder: 'owner@company.com' },
              { key: 'industry', label: 'Industry (optional)', type: 'text', placeholder: 'e.g. Technology' },
              { key: 'country', label: 'Country (optional)', type: 'text', placeholder: 'e.g. Philippines' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} required={key === 'name' || key === 'owner_email'}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1] placeholder:text-[#8B8FA8]"
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
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#3857F1] text-white font-semibold rounded-lg text-sm hover:bg-[#2a46d4] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating…' : 'Create company'}
            </button>
          </form>
        </AdminModal>
      )}
    </>
  )
}
