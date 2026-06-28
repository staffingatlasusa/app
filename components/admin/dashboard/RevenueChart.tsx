'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const DEMO_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  subscriptions: Math.floor(Math.random() * 2000),
  vetted_match: Math.floor(Math.random() * 1000),
  vetting_fee: Math.floor(Math.random() * 500),
}))

const RANGES = ['7D', '30D', '90D', '12M', 'All']

export default function RevenueChart() {
  const [range, setRange] = useState('12M')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              range === r ? 'bg-[#3857F1] text-white' : 'text-[#8B8FA8] hover:text-[#F0F2FF]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={DEMO_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#8B8FA8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#1A1D27', border: '1px solid #2A2D3E', borderRadius: 8, color: '#F0F2FF' }}
            formatter={(v) => [`$${v}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8B8FA8' }} />
          <Bar dataKey="subscriptions" stackId="a" fill="#3857F1" radius={[0,0,0,0]} name="Subscriptions" />
          <Bar dataKey="vetted_match" stackId="a" fill="#22C55E" name="Vetted Match" />
          <Bar dataKey="vetting_fee" stackId="a" fill="#F59E0B" radius={[4,4,0,0]} name="Vetting Fees" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
