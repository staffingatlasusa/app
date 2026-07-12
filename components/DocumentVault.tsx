'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Trash2, Upload } from 'lucide-react'

const CATEGORIES = ['Contract', 'NDA', 'Government ID', 'Tax form', 'Certificate', 'Other']

type Doc = {
  id: string; name: string; storage_path: string; category: string | null
  size: number | null; created_at: string
}

export default function DocumentVault({
  companyId, contractorId, initialDocs, canDelete,
}: {
  companyId: string; contractorId: string; initialDocs: Doc[]; canDelete: boolean
}) {
  const [docs, setDocs] = useState(initialDocs)
  const [category, setCategory] = useState('Other')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Max file size is 10MB'); return }
    setBusy(true)
    setError('')
    const path = `${companyId}/${contractorId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) { setError(upErr.message); setBusy(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: insErr } = await supabase.from('documents').insert({
      company_id: companyId, contractor_id: contractorId, uploaded_by: user?.id,
      name: file.name, storage_path: path, category, size: file.size,
    }).select().single()
    setBusy(false)
    if (insErr) { setError(insErr.message); return }
    setDocs(prev => [data, ...prev])
    router.refresh()
  }

  async function download(doc: Doc) {
    const { data, error: err } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 300)
    if (err || !data?.signedUrl) { setError('Could not generate download link'); return }
    window.open(data.signedUrl, '_blank')
  }

  async function remove(doc: Doc) {
    if (!confirm(`Delete ${doc.name}?`)) return
    setBusy(true)
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    setBusy(false)
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy bg-white">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <label className={`inline-flex items-center gap-2 px-3.5 py-2 bg-navy text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-navy-deep transition-colors ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={14} /> {busy ? 'Uploading…' : 'Upload document'}
          <input type="file" className="hidden" onChange={upload} disabled={busy}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" />
        </label>
        <span className="text-xs text-slate-400">PDF, Word, or image · max 10MB</span>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {docs.length === 0 ? (
        <p className="text-sm text-slate-400 bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          No documents yet — contracts, IDs, and compliance files live here
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {docs.map(d => (
            <div key={d.id} className="px-4 py-3 flex items-center gap-3">
              <FileText size={16} className="text-slate-300 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{d.name}</p>
                <p className="text-xs text-slate-400">
                  {d.category ?? 'Other'} · {d.size ? `${(d.size / 1024).toFixed(0)} KB · ` : ''}{new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => download(d)} title="Download"
                className="p-1.5 text-slate-400 hover:text-navy transition-colors"><Download size={15} /></button>
              {canDelete && (
                <button onClick={() => remove(d)} title="Delete" disabled={busy}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
