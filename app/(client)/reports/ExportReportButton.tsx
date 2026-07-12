'use client'

import { Download } from 'lucide-react'

type Row = { name: string; role: string; hours: number; spend: number; currency: string }

export default function ExportReportButton({ rows }: { rows: Row[] }) {
  function exportCSV() {
    const header = ['Contractor', 'Role', 'Approved hours', 'Est. spend', 'Currency']
    const lines = rows.map(r =>
      [r.name, r.role, r.hours.toFixed(1), r.spend.toFixed(2), r.currency]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={exportCSV} disabled={rows.length === 0}
      className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40">
      <Download size={14} /> Export CSV
    </button>
  )
}
