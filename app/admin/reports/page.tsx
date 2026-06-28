import { BarChart2, Users, TrendingUp, CheckSquare, FileText, Shield, Star, XCircle } from 'lucide-react'

const reports = [
  { key: 'revenue', label: 'Revenue Report', desc: 'By period and stream, totals', icon: BarChart2 },
  { key: 'user-growth', label: 'User Growth', desc: 'New signups by type and week', icon: Users },
  { key: 'conversion', label: 'Conversion Funnel', desc: 'Signup → trial → paid → match buyer', icon: TrendingUp },
  { key: 'vetting', label: 'Vetting Report', desc: 'Applications, approval rate, turnaround', icon: CheckSquare },
  { key: 'jobs', label: 'Job Postings', desc: 'By category, fill rate, avg time to fill', icon: FileText },
  { key: 'claims', label: 'Replacement Claims', desc: 'Filed, resolved, refunded', icon: Shield },
  { key: 'featured', label: 'Featured History', desc: 'Who was featured, when, how long', icon: Star },
  { key: 'churn', label: 'Subscription Churn', desc: 'Cancellations by month', icon: XCircle },
]

export default function AdminReportsPage() {
  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Export platform data as CSV or PDF</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {reports.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5 flex items-start gap-4">
            <div className="p-2.5 bg-[#3857F1]/10 rounded-lg shrink-0">
              <Icon size={16} className="text-[#3857F1]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">{label}</p>
              <p className="text-xs text-[#8B8FA8] mb-3">{desc}</p>
              <a
                href={`/api/admin/reports/${key}?format=csv`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2D3E] text-[#F0F2FF] rounded-lg text-xs font-medium hover:bg-[#3857F1] transition-colors"
              >
                Export CSV
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
