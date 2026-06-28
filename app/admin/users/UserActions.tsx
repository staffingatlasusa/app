'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminModal from '@/components/admin/AdminModal'

export default function UserActions({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function sendPasswordReset() {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setLoading(false)
    if (res.ok) setMsg('Reset email sent')
    else setMsg('Failed to send reset email')
  }

  async function forcePassword() {
    if (!newPassword || newPassword.length < 8) { setMsg('Password must be at least 8 characters'); return }
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) })
    setLoading(false)
    if (res.ok) { setMsg('Password updated'); setNewPassword('') }
    else { const d = await res.json(); setMsg(d.error ?? 'Failed') }
  }

  async function deleteUser() {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="text-xs font-medium text-[#8B8FA8] hover:text-[#F0F2FF] px-2 py-1 rounded">
          Actions ▾
        </button>
        {open && (
          <div className="absolute right-0 top-7 z-10 bg-[#1A1D27] border border-[#2A2D3E] rounded-lg shadow-xl w-48 py-1">
            <button onClick={() => { setShowReset(true); setOpen(false); setMsg('') }} className="w-full text-left px-4 py-2 text-xs text-[#F0F2FF] hover:bg-[#2A2D3E]">Reset password</button>
            <button onClick={deleteUser} disabled={loading} className="w-full text-left px-4 py-2 text-xs text-[#EF4444] hover:bg-[#2A2D3E]">Delete account</button>
          </div>
        )}
      </div>

      {showReset && (
        <AdminModal title={`Reset password — ${email}`} onClose={() => { setShowReset(false); setMsg('') }}>
          <div className="space-y-4">
            {msg && <p className={`text-xs px-3 py-2 rounded-lg ${msg.includes('Failed') ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'}`}>{msg}</p>}

            <div>
              <p className="text-xs font-medium text-[#8B8FA8] mb-3">Send password reset email</p>
              <button onClick={sendPasswordReset} disabled={loading} className="w-full py-2 bg-[#2A2D3E] text-[#F0F2FF] rounded-lg text-sm font-medium hover:bg-[#3A3D4E] transition-colors disabled:opacity-40">
                Send reset email to {email}
              </button>
            </div>

            <div className="border-t border-[#2A2D3E] pt-4">
              <p className="text-xs font-medium text-[#8B8FA8] mb-2">Force-set new password</p>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1] mb-2"
              />
              <button onClick={forcePassword} disabled={loading} className="w-full py-2 bg-[#3857F1] text-white rounded-lg text-sm font-medium hover:bg-[#2a46d4] transition-colors disabled:opacity-40">
                {loading ? 'Saving…' : 'Set password'}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </>
  )
}
