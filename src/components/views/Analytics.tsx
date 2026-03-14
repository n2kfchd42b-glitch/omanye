'use client'

import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { ProgressBar } from '../atoms/ProgressBar'
import { PROGRAMS, MONTHLY_BENEF, SECTOR_SPEND } from '@/lib/mock'
import { formatCurrency, formatNumber, pct } from '@/lib/utils'

const PERIODS = ['Last 3 months', 'Last 6 months', 'Last 12 months', 'All time']

// Simulated monthly spend data
const MONTHLY_SPEND = [
  { label: 'Oct', planned: 40_000, actual: 38_200 },
  { label: 'Nov', planned: 42_000, actual: 41_500 },
  { label: 'Dec', planned: 38_000, actual: 35_100 },
  { label: 'Jan', planned: 45_000, actual: 44_800 },
  { label: 'Feb', planned: 50_000, actual: 48_200 },
  { label: 'Mar', planned: 52_000, actual: 50_900 },
]

// Gender breakdown
const GENDER_DATA = [
  { name: 'Female', value: 54, color: '#4CAF78' },
  { name: 'Male',   value: 43, color: '#2E7D52' },
  { name: 'Other',  value: 3,  color: '#C8EDD8' },
]

// Program completion
const PROG_COMPLETION = PROGRAMS.map(p => ({
  name: p.name.split('–')[0].trim().split(' ').slice(0, 4).join(' '),
  completion: p.progress,
  beneficiaries: p.beneficiaries,
}))

const TOOLTIP_STYLE = {
  background: '#fff', border: '1px solid #C8EDD8', borderRadius: 8, fontSize: 12, color: '#0D2B1E',
}

export function Analytics() {
  const [period, setPeriod] = useState(1)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Analytics</h2>
          <p className="text-sm text-fern/60 mt-0.5">Impact trends and financial overview</p>
        </div>
        <div className="flex gap-1 bg-foam rounded-lg p-1 border border-mist/60">
          {PERIODS.map((p, i) => (
            <button key={p} onClick={() => setPeriod(i)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                period === i ? 'bg-white text-forest shadow-sm' : 'text-fern/60 hover:text-fern'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Beneficiaries', value: formatNumber(14_832), trend: '+9%'  },
          { label: 'Total Disbursed',     value: formatCurrency(266_100), trend: '+12%' },
          { label: 'Avg. Completion',     value: '66%',  trend: '+4%'  },
          { label: 'Impact Score',        value: '82/100',trend: '+3'   },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-fern/55 mb-2">{s.label}</p>
            <p className="text-xl font-fraunces font-semibold text-forest">{s.value}</p>
            <p className="text-xs text-sage mt-1">↑ {s.trend} this period</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Beneficiary growth */}
        <div className="card p-5">
          <h3 className="font-fraunces text-sm font-semibold text-forest mb-1">Beneficiaries Over Time</h3>
          <p className="text-xs text-fern/50 mb-4">Monthly cumulative count</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_BENEF} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4CAF78" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#4CAF78" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8EDD8" strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString(), 'Beneficiaries']} />
                <Area type="monotone" dataKey="value" stroke="#4CAF78" strokeWidth={2} fill="url(#aGrad)" dot={{ fill: '#4CAF78', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Planned vs actual spend */}
        <div className="card p-5">
          <h3 className="font-fraunces text-sm font-semibold text-forest mb-1">Planned vs Actual Spend</h3>
          <p className="text-xs text-fern/50 mb-4">Monthly burn rate (USD)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_SPEND} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8EDD8" strokeOpacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v)]} />
                <Bar dataKey="planned" fill="#C8EDD8" radius={[3,3,0,0]} name="Planned" />
                <Bar dataKey="actual"  fill="#4CAF78" radius={[3,3,0,0]} name="Actual" />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#2E7D52' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector spend */}
        <div className="card p-5">
          <h3 className="font-fraunces text-sm font-semibold text-forest mb-1">Spend by Sector</h3>
          <p className="text-xs text-fern/50 mb-2">Total: {formatCurrency(SECTOR_SPEND.reduce((s, d) => s + d.value, 0))}</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SECTOR_SPEND} cx="50%" cy="45%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" nameKey="label">
                  {SECTOR_SPEND.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatCurrency(v), 'Spent']} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender breakdown */}
        <div className="card p-5">
          <h3 className="font-fraunces text-sm font-semibold text-forest mb-1">Beneficiary Gender</h3>
          <p className="text-xs text-fern/50 mb-2">All programs combined</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={GENDER_DATA} cx="50%" cy="45%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" nameKey="name">
                  {GENDER_DATA.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program completion */}
        <div className="card p-5">
          <h3 className="font-fraunces text-sm font-semibold text-forest mb-4">Program Completion</h3>
          <div className="space-y-3">
            {PROG_COMPLETION.map(p => (
              <ProgressBar
                key={p.name}
                label={p.name}
                value={p.completion}
                showPct
                size="sm"
                color={p.completion >= 100 ? 'green' : p.completion < 20 ? 'gray' : 'green'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
