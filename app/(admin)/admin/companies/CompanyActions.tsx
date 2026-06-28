'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompanyActions({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function deleteCompany() {
    if (!confirm('Delete this company and all its data? This cannot be undone.')) return
    setLoading(true)
    await supabase.from('companies').delete().eq('id', companyId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={deleteCompany}
      disabled={loading}
      className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-40"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
