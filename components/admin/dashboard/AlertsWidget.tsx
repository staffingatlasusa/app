import Link from 'next/link'
import { AlertCircle, CheckSquare, Handshake, DollarSign, Shield } from 'lucide-react'

type Props = {
  pendingVetting: number
  openMatches: number
  failedPayments: number
  openClaims: number
}

export default function AlertsWidget({ pendingVetting, openMatches, failedPayments, openClaims }: Props) {
  const alerts = [
    { label: 'Pending vetting applications', count: pendingVetting, href: '/admin/vetting', icon: CheckSquare, color: 'text-[#F59E0B]' },
    { label: 'Open match orders', count: openMatches, href: '/admin/matches', icon: Handshake, color: 'text-[#3857F1]' },
    { label: 'Failed payments', count: failedPayments, href: '/admin/revenue', icon: DollarSign, color: 'text-[#EF4444]' },
    { label: 'Open replacement claims', count: openClaims, href: '/admin/matches', icon: Shield, color: 'text-[#EF4444]' },
  ]

  return (
    <div className="bg-[#1A1D27] border border-[#2A2D3E] rounded-xl p-6">
      <h2 className="font-semibold text-[#F0F2FF] mb-4 flex items-center gap-2">
        <AlertCircle size={15} className="text-[#F59E0B]" />
        Alerts
      </h2>
      <div className="space-y-3">
        {alerts.map(({ label, count, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg hover:border-[#3857F1] border border-transparent transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Icon size={14} className={color} />
              <span className="text-xs text-[#8B8FA8]">{label}</span>
            </div>
            <span className={`text-sm font-bold ${count > 0 ? 'text-[#F0F2FF]' : 'text-[#8B8FA8]'}`}>{count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
