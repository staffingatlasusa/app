'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, Trash2 } from 'lucide-react'

type Item = { id: string; storage_path: string; caption: string | null }

const MAX_ITEMS = 8

export default function PortfolioManager({ userId, profileId, initialItems }: {
  userId: string; profileId: string; initialItems: Item[]
}) {
  const [items, setItems] = useState(initialItems)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  function publicUrl(path: string) {
    return supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (items.length >= MAX_ITEMS) { setError(`Maximum ${MAX_ITEMS} work samples`); return }
    if (file.size > 4 * 1024 * 1024) { setError('Max image size is 4MB'); return }
    setBusy(true)
    setError('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('portfolio').upload(path, file)
    if (upErr) { setError(upErr.message); setBusy(false); return }
    const { data, error: insErr } = await supabase.from('portfolio_items').insert({
      contractor_profile_id: profileId, user_id: userId,
      storage_path: path, caption: caption.trim() || null,
    }).select().single()
    setBusy(false)
    if (insErr) { setError(insErr.message); return }
    setItems(prev => [...prev, data])
    setCaption('')
  }

  async function remove(item: Item) {
    setBusy(true)
    await supabase.storage.from('portfolio').remove([item.storage_path])
    await supabase.from('portfolio_items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setBusy(false)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
      <h2 className="font-semibold text-slate-900 mb-1">Work samples</h2>
      <p className="text-sm text-slate-500 mb-4">
        Screenshots, designs, graphics — shown to companies when you apply. {items.length}/{MAX_ITEMS}
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Caption for next upload (optional)"
          className="flex-1 min-w-[200px] px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy" />
        <label className={`inline-flex items-center gap-2 px-3.5 py-2 bg-navy text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-navy-deep transition-colors ${busy || items.length >= MAX_ITEMS ? 'opacity-50 pointer-events-none' : ''}`}>
          <ImagePlus size={14} /> {busy ? 'Uploading…' : 'Add sample'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={upload} disabled={busy} />
        </label>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-300 border border-dashed border-slate-200 rounded-xl px-4 py-8 text-center">
          No work samples yet — profiles with samples get noticed first
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.id} className="group relative rounded-lg overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl(item.storage_path)} alt={item.caption ?? 'Work sample'}
                className="w-full h-28 object-cover" />
              <button onClick={() => remove(item)} disabled={busy}
                className="absolute top-1.5 right-1.5 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={13} />
              </button>
              {item.caption && (
                <p className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[11px] px-2 py-1 truncate">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
