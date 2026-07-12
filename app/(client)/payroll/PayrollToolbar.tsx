'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Download, RefreshCw } from 'lucide-react'

type SummaryRow = {
  contractor: string; role: string; period_start: string; period_end: string
  total_hours: number; total_amount: number; currency: string; status: string
}

export default function PayrollToolbar({ companyId, exportRows }: { companyId: string; exportRows: SummaryRow[] }) {
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Aggregate a month's approved timesheets into draft summaries.
  // monthOffset 0 = current month (to date), 1 = last month.
  async function generate(monthOffset: number) {
    setGenerating(true)
    setMsg('')

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const periodEnd = monthOffset === 0
      ? now
      : new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0)
    // Local-date formatting — toISOString shifts across midnight in non-UTC timezones
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const startStr = fmt(periodStart)
    const endStr = fmt(periodEnd)

    const [{ data: timesheets }, { data: contractors }, { data: existing }] = await Promise.all([
      supabase.from('timesheets').select('contractor_id, hours_worked')
        .eq('company_id', companyId).eq('status', 'approved')
        .gte('date', startStr).lte('date', endStr),
      supabase.from('contractors').select('id, hourly_rate, currency').eq('company_id', companyId),
      supabase.from('payroll_summaries').select('contractor_id')
        .eq('company_id', companyId).eq('period_start', startStr),
    ])

    const rateMap = new Map((contractors ?? []).map(c => [c.id, c]))
    const already = new Set((existing ?? []).map(e => e.contractor_id))

    const hoursByContractor = new Map<string, number>()
    for (const t of timesheets ?? []) {
      hoursByContractor.set(t.contractor_id, (hoursByContractor.get(t.contractor_id) ?? 0) + Number(t.hours_worked))
    }

    const inserts = Array.from(hoursByContractor.entries())
      .filter(([cid]) => !already.has(cid) && rateMap.has(cid))
      .map(([cid, hours]) => {
        const c = rateMap.get(cid)!
        return {
          company_id: companyId,
          contractor_id: cid,
          period_start: startStr,
          period_end: endStr,
          total_hours: hours,
          total_amount: hours * Number(c.hourly_rate),
          currency: c.currency,
          status: 'draft',
        }
      })

    const periodLabel = monthOffset === 0 ? 'this month' : 'last month'
    if (inserts.length === 0) {
      setMsg(already.size > 0 ? `Summaries for ${periodLabel} already exist` : `No approved timesheets found for ${periodLabel}`)
      setGenerating(false)
      return
    }

    const { error } = await supabase.from('payroll_summaries').insert(inserts)
    setGenerating(false)
    setMsg(error ? error.message : `Generated ${inserts.length} draft ${inserts.length === 1 ? 'summary' : 'summaries'}`)
    if (!error) router.refresh()
  }

  function exportCSV() {
    const header = ['Contractor', 'Role', 'Period start', 'Period end', 'Hours', 'Amount', 'Currency', 'Status']
    const lines = exportRows.map(r =>
      [r.contractor, r.role, r.period_start, r.period_end, r.total_hours, r.total_amount.toFixed(2), r.currency, r.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-slate-500 mr-2">{msg}</span>}
      <button onClick={exportCSV} disabled={exportRows.length === 0}
        className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40">
        <Download size={14} /> Export CSV
      </button>
      <button onClick={() => generate(1)} disabled={generating}
        className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60">
        Last month
      </button>
      <button onClick={() => generate(0)} disabled={generating}
        className="flex items-center gap-2 px-3.5 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-60">
        <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
        {generating ? 'Generating…' : 'Generate this month'}
      </button>
    </div>
  )
}
