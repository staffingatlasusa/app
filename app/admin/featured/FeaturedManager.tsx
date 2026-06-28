'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Trash2 } from 'lucide-react'

type Placement = { id: string; entity_type: string; entity_id: string; display_order: number; expires_at: string | null; is_active: boolean; created_at: string }

export default function FeaturedManager({
  featuredCompanies, featuredContractors, companyMap, contractorMap, allCompanies, allContractors
}: {
  featuredCompanies: Placement[]
  featuredContractors: Placement[]
  companyMap: Record<string, string>
  contractorMap: Record<string, string>
  allCompanies: { id: string; name: string }[]
  allContractors: { id: string; name: string; role: string }[]
}) {
  const [tab, setTab] = useState<'companies' | 'contractors'>('companies')
  const [addId, setAddId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function addFeatured() {
    if (!addId) return
    setLoading(true)
    await fetch('/api/admin/featured/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: tab === 'companies' ? 'company' : 'contractor', entity_id: addId }),
    })
    setAddId('')
    setLoading(false)
    router.refresh()
  }

  async function removeFeatured(id: string) {
    if (!confirm('Remove from featured?')) return
    await fetch('/api/admin/featured/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  const list = tab === 'companies' ? featuredCompanies : featuredContractors
  const nameMap = tab === 'companies' ? companyMap : contractorMap
  const options = tab === 'companies' ? allCompanies : allContractors

  return (
    <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl overflow-hidden">
      <div className="flex border-b border-[#2A2D3E]">
        {(['companies', 'contractors'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'text-[#F0F2FF] border-b-2 border-[#3857F1]' : 'text-[#8B8FA8] hover:text-[#F0F2FF]'
            }`}
          >
            Featured {t}
          </button>
        ))}
      </div>

      <div className="p-5 border-b border-[#2A2D3E] flex gap-3">
        <select
          value={addId}
          onChange={e => setAddId(e.target.value)}
          className="flex-1 px-3 py-2 bg-[#0F1117] border border-[#2A2D3E] rounded-lg text-sm text-[#F0F2FF] focus:outline-none focus:border-[#3857F1]"
        >
          <option value="">Select {tab === 'companies' ? 'company' : 'contractor'} to feature…</option>
          {options.map((o: { id: string; name: string }) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button
          onClick={addFeatured}
          disabled={!addId || loading}
          className="px-4 py-2 bg-[#F5C842] text-[#0F1117] font-semibold text-sm rounded-lg hover:bg-[#e6ba3b] transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          <Star size={14} /> Feature
        </button>
      </div>

      <div className="divide-y divide-[#2A2D3E]">
        {list.map((p, i) => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-3">
            <span className="text-xs text-[#8B8FA8] w-5 text-center">{i + 1}</span>
            <Star size={13} className="text-[#F5C842] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{nameMap[p.entity_id] ?? p.entity_id}</p>
              {p.expires_at && <p className="text-xs text-[#8B8FA8]">Expires {new Date(p.expires_at).toLocaleDateString()}</p>}
            </div>
            <button onClick={() => removeFeatured(p.id)} className="text-[#8B8FA8] hover:text-[#EF4444] transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {list.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-[#8B8FA8]">No featured {tab} yet</p>
        )}
      </div>
    </div>
  )
}
