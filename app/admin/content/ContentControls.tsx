'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ContentControls({ settings }: { settings: Record<string, string> }) {
  const [values, setValues] = useState(settings)
  const [saving, setSaving] = useState<string | null>(null)
  const router = useRouter()

  async function toggleSetting(key: string) {
    const newVal = values[key] === 'true' ? 'false' : 'true'
    setSaving(key)
    await fetch(`/api/admin/settings/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newVal }),
    })
    setValues(v => ({ ...v, [key]: newVal }))
    setSaving(null)
    router.refresh()
  }

  const toggles = [
    { key: 'pause_contractor_registrations', label: 'Pause contractor registrations', desc: 'New contractors cannot sign up' },
    { key: 'pause_company_registrations', label: 'Pause company registrations', desc: 'New companies cannot sign up' },
    { key: 'marketplace_maintenance_mode', label: 'Marketplace maintenance mode', desc: 'Hides talent browse from public' },
  ]

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl divide-y divide-[#2A2D3E]">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-[#F0F2FF]">Platform Toggles</p>
        </div>
        {toggles.map(({ key, label, desc }) => (
          <div key={key} className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#F0F2FF]">{label}</p>
              <p className="text-xs text-[#8B8FA8] mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggleSetting(key)}
              disabled={saving === key}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                values[key] === 'true' ? 'bg-[#3857F1]' : 'bg-[#2A2D3E]'
              } disabled:opacity-50`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                values[key] === 'true' ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
