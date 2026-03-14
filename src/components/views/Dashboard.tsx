'use client'

import React from 'react'
import {
  Users, FolderOpen, FileText, HandHeart,
  ClipboardList, Star, AlertTriangle, FolderPlus, UserPlus,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts'
import { StatusBadge } from '../atoms/Badge'
import { ProgressBar }  from '../atoms/ProgressBar'
import { AvatarGroup }  from '../atoms/Avatar'
import { formatNumber, formatCurrency, pct } from '@/lib/utils'
import { PROGRAMS, ACTIVITY, MONTHLY_BENEF, SECTOR_SPEND } from '@/lib/mock'
import type { ViewId } from '@/lib/types'

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, trend, Icon, accent = 'green',
}: {
  label: string; value: string | number; sub?: string
  trend?: number; Icon: React.ElementType
  accent?: 'green' | 'gold' | 'blue' | 'red'
}) {
  const iconCls: Record<string, string> = {
    green: 'bg-mist text-fern',
    gold:  'bg-amber-50 text-amber-600',
    blue:  'bg-blue-50 text-blue-500',
    red:   'bg-red-50 text-red-500',
  }
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-fern/55">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconCls[accent]}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-fraunces font-semibold text-forest">{value}</p>
        {sub && <p className="text-xs text-fern/50 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-sage' : 'text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  )
}

// ── Activity type config ─────────────────────────────────────────────────────

const ACT_CFG: Record<string, { Icon: React.ElementType; cls: string }> = {
  submission: { Icon: ClipboardList, cls: 'bg-foam text-fern'       },
  report:     { Icon: FileText,      cls: 'bg-blue-50 text-blue-500' },
  donor:      { Icon: HandHeart,     cls: 'bg-amber-50 text-amber-600'},
  milestone:  { Icon: Star,          cls: 'bg-mist text-sage'        },
  flag:       { Icon: AlertTriangle, cls: 'bg-red-50 text-red-500'   },
  program:    { Icon: FolderPlus,    cls: 'bg-foam text-fern'        },
  enrollment: { Icon: UserPlus,      cls: 'bg-foam text-fern'        },
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface DashboardProps {
  onNavigate: (view: ViewId, id?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const totalBenef = PROGRAMS.reduce((s, p) => s + p.beneficiaries, 0)
  const active     = PROGRAMS.filter(p => p.status === 'active')
  const totalFunds = PROGRAMS.reduce((s, p) => s + p.budget, 0)

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="font-fraunces text-2xl font-semibold text-forest">
          Good morning, Amara
        </h2>
        <p className="text-sm text-fern/60 mt-0.5">
          Here's your program overview for today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Beneficiaries" value={formatNumber(totalBenef)}
          sub="across all programs" trend={9} Icon={Users} accent="green" />
        <StatCard label="Active Programs" value={active.length}
          sub={`${PROGRAMS.length} total`} trend={2} Icon={FolderOpen} accent="green" />
        <StatCard label="Documents" value="28"
          sub="3 awaiting review" trend={14} Icon={FileText} accent="blue" />
        <StatCard label="Total Budget" value={formatCurrency(totalFunds)}
          sub="FY 2024" trend={-3} Icon={HandHeart} accent="gold" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="mb-4">
            <h3 className="font-fraunces text-base font-semibold text-forest">Beneficiaries Reached</h3>
            <p className="text-xs text-fern/50 mt-0.5">6-month growth trend</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_BENEF} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4CAF78" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4CAF78" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8EDD8" strokeOpacity={0.6} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#2E7D52', opacity: 0.6 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #C8EDD8', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [v.toLocaleString(), 'Beneficiaries']}
                />
                <Area type="monotone" dataKey="value" stroke="#4CAF78" strokeWidth={2}
                  fill="url(#bGrad)" dot={{ fill: '#4CAF78', r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-fraunces text-base font-semibold text-forest">Spend by Sector</h3>
            <p className="text-xs text-fern/50 mt-0.5">
              Total: {formatCurrency(SECTOR_SPEND.reduce((s, d) => s + d.value, 0))}
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SECTOR_SPEND} cx="50%" cy="45%" innerRadius={44} outerRadius={68}
                  paddingAngle={3} dataKey="value" nameKey="label">
                  {SECTOR_SPEND.map((e, i) => (
                    <Cell key={i} fill={e.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C8EDD8', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatCurrency(v), 'Spent']} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#2E7D52' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Programs snapshot */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-fraunces text-base font-semibold text-forest">Active Programs</h3>
            <button
              onClick={() => onNavigate('programs')}
              className="text-xs text-fern hover:text-moss font-medium flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {PROGRAMS.filter(p => p.status === 'active').slice(0, 4).map(p => {
              const teamMemberNames = p.team.slice(0, 4)
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate('program-detail', p.id)}
                  className="w-full p-3 rounded-lg border border-mist/60 hover:bg-foam/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-forest line-clamp-1">{p.name}</p>
                      <p className="text-xs text-fern/50 mt-0.5">{p.region}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <ProgressBar value={p.progress} size="sm" />
                  <div className="flex items-center justify-between mt-2">
                    <AvatarGroup names={p.team} max={3} size="xs" />
                    <span className="text-xs font-mono text-fern/60">
                      {formatNumber(p.beneficiaries)}/{formatNumber(p.targetBenef)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Activity + budget */}
        <div className="space-y-4">
          {/* Budget utilization */}
          <div className="card p-5">
            <h3 className="font-fraunces text-sm font-semibold text-forest mb-3">Budget by Program</h3>
            <div className="space-y-2.5">
              {PROGRAMS.slice(0,4).map(p => (
                <ProgressBar
                  key={p.id}
                  label={p.name.split('–')[0].trim().split(' ').slice(0,3).join(' ')}
                  value={pct(p.spent, p.budget)}
                  showPct
                  size="sm"
                  color={pct(p.spent, p.budget) > 85 ? 'gold' : 'green'}
                />
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="card p-5">
            <h3 className="font-fraunces text-sm font-semibold text-forest mb-3">Recent Activity</h3>
            <ul className="space-y-3">
              {ACTIVITY.slice(0, 5).map(item => {
                const cfg  = ACT_CFG[item.type] ?? ACT_CFG.enrollment
                const Icon = cfg.Icon
                return (
                  <li key={item.id} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.cls}`}>
                      <Icon size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-forest/80 leading-snug">
                        <span className="font-semibold">{item.actor}</span> {item.message}
                      </p>
                      <p className="text-[10px] text-fern/45 mt-0.5">{item.timestamp}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
