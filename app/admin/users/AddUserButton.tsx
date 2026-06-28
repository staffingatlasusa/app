'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'
import { Plus } from 'lucide-react'

export default function AddUserButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', name: '', company_name: '' })
  const router = useRouter()

  function set(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/users/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Failed'); return }
    setOpen(false)
    setForm({ email: '', password: '', name: '', company_name: '' })
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#3857F1] text-white text-sm font-semibold rounded-lg hover:bg-[#2a46d4] transition-colors">
        <Plus size={15} /> Add User
      </button>

      {open && (
        <AdminModal title="Add User" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            {error && <p className="text-xs px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] rounded-lg">{error}</p>}
            {[
              { key: 'name', label: 'Full name', type: 'text', placeholder: 'John Smith' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters' },
              { key: 'company_name', label: 'Company name (optional)', type: 'text', placeholder: 'Creates a company for this user' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[#8B8FA8] mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} required={key !== 'company_name'}
                  className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1] placeholder:text-[#8B8FA8]"
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#3857F1] text-white font-semibold rounded-lg text-sm hover:bg-[#2a46d4] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </AdminModal>
      )}
    </>
  )
}
