import { createAdminClient } from '@/lib/supabase/server'
import { DollarSign, Users, Briefcase, TrendingUp } from 'lucide-react'
import RevenueChart from '@/components/admin/dashboard/RevenueChart'
import AlertsWidget from '@/components/admin/dashboard/AlertsWidget'

async function getStats(db: ReturnType<typeof createAdminClient>) {
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0)
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const fmt = (d: Date) => d.toISOString()

  const [today, week, month, quarter, year] = await Promise.all([
    db.from('transactions').select('amount').eq('status','paid').gte('created_at', fmt(startOfDay)),
    db.from('transactions').select('amount').eq('status','paid').gte('created_at', fmt(startOfWeek)),
    db.from('transactions').select('amount').eq('status','paid').gte('created_at', fmt(startOfMonth)),
    db.from('transactions').select('amount').eq('status','paid').gte('created_at', fmt(startOfQuarter)),
    db.from('transactions').select('amount').eq('status','paid').gte('created_at', fmt(startOfYear)),
  ])

  const sum = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + Number(r.amount), 0)

  return {
    today: { amount: sum(today.data), count: today.data?.length ?? 0 },
    week: { amount: sum(week.data), count: week.data?.length ?? 0 },
    month: { amount: sum(month.data), count: month.data?.length ?? 0 },
    quarter: { amount: sum(quarter.data), count: quarter.data?.length ?? 0 },
    year: { amount: sum(year.data), count: year.data?.length ?? 0 },
  }
}

function fmt$(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function AdminDashboardPage() {
  const db = createAdminClient()
  const [stats, { count: companyCount }, { count: contractorCount }, { count: pendingVetting }, { count: openMatches }, { count: failedPayments }, { count: openClaims }] = await Promise.all([
    getStats(db),
    db.from('companies').select('*', { count: 'exact', head: true }),
    db.from('contractors').select('*', { count: 'exact', head: true }),
    db.from('vetted_applications').select('*', { count: 'exact', head: true }).eq('status','pending'),
    db.from('vetted_match_orders').select('*', { count: 'exact', head: true }).in('status',['new','in_progress']),
    db.from('transactions').select('*', { count: 'exact', head: true }).eq('status','failed'),
    db.from('replacement_claims').select('*', { count: 'exact', head: true }).eq('status','open'),
  ])

  const kpis = [
    { label: "Today's Revenue", amount: stats.today.amount, count: stats.today.count, icon: DollarSign },
    { label: 'This Week', amount: stats.week.amount, count: stats.week.count, icon: TrendingUp },
    { label: 'This Month', amount: stats.month.amount, count: stats.month.count, icon: DollarSign },
    { label: 'This Quarter', amount: stats.quarter.amount, count: stats.quarter.count, icon: DollarSign },
    { label: 'This Year', amount: stats.year.amount, count: stats.year.count, icon: DollarSign },
  ]

  return (
    <div className="p-8 text-[#F0F2FF]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[#8B8FA8] mt-0.5">Platform overview</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {kpis.map(({ label, amount, count, icon: Icon }) => (
          <div key={label} className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8B8FA8] font-medium">{label}</p>
              <Icon size={14} className="text-[#3857F1]" />
            </div>
            <p className="text-xl font-bold text-[#F0F2FF]">{fmt$(amount)}</p>
            <p className="text-xs text-[#8B8FA8] mt-1">{count} transactions</p>
          </div>
        ))}
      </div>

      {/* Platform counts */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-[#3857F1]/10 rounded-lg"><Building2 size={18} className="text-[#3857F1]" /></div>
          <div><p className="text-2xl font-bold">{companyCount ?? 0}</p><p className="text-xs text-[#8B8FA8]">Total Companies</p></div>
        </div>
        <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-[#22C55E]/10 rounded-lg"><Briefcase size={18} className="text-[#22C55E]" /></div>
          <div><p className="text-2xl font-bold">{contractorCount ?? 0}</p><p className="text-xs text-[#8B8FA8]">Total Contractors</p></div>
        </div>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-6">
          <h2 className="font-semibold mb-4">Revenue Overview</h2>
          <RevenueChart />
        </div>
        <AlertsWidget
          pendingVetting={pendingVetting ?? 0}
          openMatches={openMatches ?? 0}
          failedPayments={failedPayments ?? 0}
          openClaims={openClaims ?? 0}
        />
      </div>
    </div>
  )
}

function Building2({ size, className }: { size: number; className?: string }) {
  return <Users size={size} className={className} />
}
