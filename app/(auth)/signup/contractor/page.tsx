'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ContractorSignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', country: 'Philippines' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, account_type: 'contractor' } },
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    if (data.user) {
      const { error: profileError } = await supabase.from('contractor_profiles').insert({
        user_id: data.user.id,
        name: form.name,
        email: form.email,
        role: form.role,
        country: form.country,
        status: 'pending',
      })
      if (profileError) { setError(profileError.message); setLoading(false); return }
    }

    fetch('/api/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'welcome_contractor' }),
    }).catch(() => {})

    router.push('/portal')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="https://staffingatlas.com" className="inline-block text-2xl font-black text-navy-deep mb-1 hover:opacity-80 transition-opacity">
            Staffing<span className="text-amber">Atlas</span>
            </a>
          <p className="text-slate-500 text-sm">Create your contractor profile</p>
          <a href="https://staffingatlas.com" className="inline-block mt-2 text-xs text-slate-400 hover:text-navy transition-colors">&larr; Back to staffingatlas.com</a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { field: 'name', label: 'Full name', type: 'text', placeholder: 'Maria Santos' },
              { field: 'role', label: 'Your role / skill', type: 'text', placeholder: 'e.g. Virtual Assistant, Developer' },
              { field: 'email', label: 'Email address', type: 'email', placeholder: 'maria@email.com' },
              { field: 'password', label: 'Password', type: 'password', placeholder: '8+ characters' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input type={type} value={form[field as keyof typeof form]} onChange={e => set(field, e.target.value)}
                  required minLength={field === 'password' ? 8 : undefined} placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Country</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent">
                <option>Philippines</option>
                <option>India</option>
                <option>Pakistan</option>
                <option>Bangladesh</option>
                <option>Indonesia</option>
                <option>Other</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-amber text-navy-deep rounded-lg text-sm font-bold hover:bg-amber-light transition-colors disabled:opacity-60">
              {loading ? 'Creating profile…' : 'Join as contractor'}
            </button>

            <p className="text-center text-xs text-slate-400">Free to join · Get matched with companies</p>
            <p className="text-center text-xs text-slate-400">
              By signing up you agree to our{' '}
              <a href="https://staffingatlas.com/terms-of-service/" target="_blank" rel="noopener" className="underline hover:text-slate-600">Terms</a>
              {' '}and{' '}
              <a href="https://staffingatlas.com/privacy-policy/" target="_blank" rel="noopener" className="underline hover:text-slate-600">Privacy Policy</a>.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Hiring instead?{' '}
            <Link href="/signup/company" className="text-navy font-medium hover:underline">Start a company account</Link>
          </p>
          <p className="text-center text-sm text-slate-500 mt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-navy font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
