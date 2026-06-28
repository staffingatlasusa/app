'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Login failed')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-[#3857F1] uppercase tracking-widest mb-2">Admin Control Panel</p>
          <h1 className="text-2xl font-bold text-[#F0F2FF]">StaffingAtlas</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#8B8FA8] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-[#F0F2FF] text-sm focus:outline-none focus:border-[#3857F1] placeholder:text-[#8B8FA8]"
              placeholder="admin@staffingatlas.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8B8FA8] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-[#F0F2FF] text-sm focus:outline-none focus:border-[#3857F1]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#3857F1] text-white font-semibold rounded-lg text-sm hover:bg-[#2a46d4] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
