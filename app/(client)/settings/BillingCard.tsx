'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

const PLANS = [
  { key: 'starter', label: 'Starter', price: 99, blurb: 'Up to 3 contractors' },
  { key: 'growth', label: 'Growth', price: 199, blurb: 'Up to 10 contractors' },
  { key: 'enterprise', label: 'Enterprise', price: 299, blurb: 'Unlimited contractors' },
]

export default function BillingCard({ currentPlan, trialEnds, hasStripeCustomer }: {
  currentPlan: string; trialEnds: string | null; hasStripeCustomer: boolean
}) {
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  const onTrial = currentPlan === 'trial'
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((new Date(trialEnds).getTime() - Date.now()) / 86400000))
    : null

  async function subscribe(plan: string) {
    setLoading(plan)
    setError('')
    const res = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    setLoading('')
    if (!res.ok || !data.url) { setError(data.error ?? 'Could not start checkout'); return }
    window.location.href = data.url
  }

  async function managePortal() {
    setLoading('portal')
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    setLoading('')
    if (!res.ok || !data.url) { setError(data.error ?? 'Could not open billing portal'); return }
    window.location.href = data.url
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-900">Plan &amp; Billing</h2>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
          onTrial ? 'bg-amber/10 text-amber-600' :
          currentPlan === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
        }`}>
          {onTrial && trialDaysLeft !== null ? `Trial · ${trialDaysLeft}d left` : currentPlan}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        {onTrial
          ? 'Pick a plan to keep access when your trial ends. Cancel anytime.'
          : 'Manage your subscription, payment method, and invoices below.'}
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {PLANS.map(p => {
          const isCurrent = currentPlan === p.key
          return (
            <div key={p.key} className={`rounded-xl border-2 p-4 ${isCurrent ? 'border-navy bg-navy/5' : 'border-slate-200'}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{p.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">${p.price}<span className="text-sm font-medium text-slate-400">/mo</span></p>
              <p className="text-xs text-slate-500 mt-1 mb-3">{p.blurb}</p>
              {isCurrent ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-navy"><Check size={13} /> Current plan</span>
              ) : (
                <button onClick={() => subscribe(p.key)} disabled={!!loading}
                  className="w-full py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy-deep transition-colors disabled:opacity-50">
                  {loading === p.key ? 'Redirecting…' : onTrial ? 'Subscribe' : 'Switch'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {hasStripeCustomer && (
        <button onClick={managePortal} disabled={!!loading}
          className="text-sm font-medium text-navy hover:underline disabled:opacity-50">
          {loading === 'portal' ? 'Opening…' : 'Manage billing — payment method, invoices, cancel'}
        </button>
      )}
    </div>
  )
}
