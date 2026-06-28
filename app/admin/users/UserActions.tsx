'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserActions({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function sendPasswordReset() {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
    setLoading(false)
    setOpen(false)
    alert(`Password reset email sent to ${email}`)
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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-[#8B8FA8] hover:text-[#F0F2FF] px-2 py-1 rounded"
      >
        Actions ▾
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 bg-[#1A1D27] border border-[#2A2D3E] rounded-lg shadow-xl w-44 py-1">
          <button onClick={sendPasswordReset} disabled={loading} className="w-full text-left px-4 py-2 text-xs text-[#F0F2FF] hover:bg-[#2A2D3E]">Send password reset</button>
          <button onClick={deleteUser} disabled={loading} className="w-full text-left px-4 py-2 text-xs text-[#EF4444] hover:bg-[#2A2D3E]">Delete account</button>
        </div>
      )}
    </div>
  )
}
