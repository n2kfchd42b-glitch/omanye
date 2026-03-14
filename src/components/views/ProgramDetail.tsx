'use client'

import React, { useState } from 'react'
import { ChevronLeft, MapPin, Calendar, Users, TrendingUp } from 'lucide-react'
import { StatusBadge, TagBadge } from '../atoms/Badge'
import { ProgressBar }  from '../atoms/ProgressBar'
import { Avatar }       from '../atoms/Avatar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PROGRAMS, TEAM, ACTIVITY } from '@/lib/mock'
import { formatNumber, formatCurrency, formatDate, pct } from '@/lib/utils'

type Tab = 'overview' | 'indicators' | 'budget' | 'team' | 'activity'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'indicators', label: 'Indicators' },
  { id: 'budget',     label: 'Budget'     },
  { id: 'team',       label: 'Team'       },
  { id: 'activity',   label: 'Activity'   },
]

const IND_TYPE_COLOR: Record<string, string> = {
  output:  'bg-blue-50 text-blue-600',
  outcome: 'bg-mist text-fern',
  impact:  'bg-amber-50 text-amber-700',
}

interface ProgramDetailProps {
  programId: string
  onBack:    () => void
}

export function ProgramDetail({ programId, onBack }: ProgramDetailProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const program = PROGRAMS.find(p => p.id === programId)

  if (!program) {
    return (
      <div className="text-center py-16">
        <p className="text-fern/60">Program not found.</p>
        <button onClick={onBack} className="mt-3 text-sm text-fern hover:text-moss transition-colors">
          Back to programs
        </button>
      </div>
    )
  }

  const budPct  = pct(program.spent, program.budget)
  const benefPct = pct(program.beneficiaries, program.targetBenef)
  const teamMembers = TEAM.filter(t => program.team.includes(t.id))
  const leadMember  = TEAM.find(t => t.id === program.lead)
  const activity    = ACTIVITY.filter(a => a.programId === program.id)

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back */}
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-fern hover:text-moss transition-colors">
        <ChevronLeft size={14} /> Back to Programs
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="font-fraunces text-2xl font-semibold text-forest">{program.name}</h2>
            <StatusBadge status={program.status} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-fern/60">
            <span className="flex items-center gap-1"><MapPin size={11} />{program.region}, {program.country}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(program.startDate)} – {formatDate(program.endDate)}</span>
            <span className="flex items-center gap-1"><Users size={11} />{teamMembers.length} team members</span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="px-3 py-1.5 rounded-lg border border-mist text-sm text-fern hover:bg-foam transition-colors">Edit</button>
          <button className="px-3 py-1.5 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">Add Field Data</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Beneficiaries', value: formatNumber(program.beneficiaries), sub: `of ${formatNumber(program.targetBenef)}` },
          { label: 'Budget Used',   value: formatCurrency(program.spent),        sub: `of ${formatCurrency(program.budget)}` },
          { label: 'Completion',    value: `${program.progress}%`,               sub: 'overall progress' },
          { label: 'Indicators',    value: program.indicators.length,             sub: 'being tracked' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xl font-fraunces font-semibold text-forest">{s.value}</p>
            <p className="text-[10px] text-fern/50 mt-0.5">{s.sub}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fern/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-mist">
        <nav className="flex gap-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-moss text-moss'
                  : 'border-transparent text-fern/60 hover:text-fern'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab panes */}
      <div className="animate-fade-in">

        {/* ── Overview ──────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 card p-5 space-y-4">
              <h3 className="font-fraunces text-base font-semibold text-forest">Description</h3>
              <p className="text-sm text-forest/70 leading-relaxed">{program.description}</p>
              <div className="pt-3 border-t border-mist space-y-3">
                <ProgressBar label="Beneficiaries reached" value={benefPct} showPct />
                <ProgressBar label="Budget utilized" value={budPct} showPct color={budPct > 85 ? 'gold' : 'green'} />
                <ProgressBar label="Overall completion" value={program.progress} showPct />
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-5 space-y-3">
                <h3 className="font-fraunces text-sm font-semibold text-forest">Sectors</h3>
                <div className="flex flex-wrap gap-1.5">
                  {program.sector.map(s => <TagBadge key={s} label={s} />)}
                </div>
              </div>
              <div className="card p-5 space-y-3">
                <h3 className="font-fraunces text-sm font-semibold text-forest">Program Lead</h3>
                {leadMember && (
                  <div className="flex items-center gap-2.5">
                    <Avatar name={leadMember.name} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-forest">{leadMember.name}</p>
                      <p className="text-xs text-fern/50">{leadMember.role.replace(/-/g, ' ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Indicators ──────────────────────────────────────────────────── */}
        {tab === 'indicators' && (
          <div className="space-y-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={program.indicators.map(i => ({
                  name: i.label.split(' ').slice(0, 3).join(' '),
                  Target: i.target, Current: i.current,
                }))} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C8EDD8" strokeOpacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#2E7D52', opacity: 0.7 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #C8EDD8', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="Target"  fill="#C8EDD8" radius={[4,4,0,0]} />
                  <Bar dataKey="Current" fill="#4CAF78" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mist bg-snow">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Indicator</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-fern/55 uppercase tracking-wide">Baseline</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-fern/55 uppercase tracking-wide">Target</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-fern/55 uppercase tracking-wide">Current</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {program.indicators.map(ind => (
                    <tr key={ind.id} className="border-b border-mist/40 hover:bg-foam/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-forest text-sm">{ind.label}</p>
                        <p className="text-xs text-fern/50 mt-0.5">{ind.unit}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${IND_TYPE_COLOR[ind.type]}`}>
                          {ind.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs text-fern/70">{ind.baseline}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-forest">{ind.target}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-moss">{ind.current}</td>
                      <td className="px-4 py-3.5 w-36">
                        <ProgressBar value={pct(ind.current, ind.target)} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Budget ──────────────────────────────────────────────────────── */}
        {tab === 'budget' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Budget', value: formatCurrency(program.budget), cls: 'text-forest' },
                { label: 'Spent',        value: formatCurrency(program.spent),  cls: 'text-moss' },
                { label: 'Remaining',    value: formatCurrency(program.budget - program.spent), cls: 'text-fern' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <p className={`text-xl font-fraunces font-semibold ${s.cls}`}>{s.value}</p>
                  <p className="text-xs text-fern/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mist bg-snow">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-fern/55 uppercase tracking-wide">Allocated</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-fern/55 uppercase tracking-wide">Spent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {program.budgetLines.map(bl => (
                    <tr key={bl.id} className="border-b border-mist/40 hover:bg-foam/50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-forest">{bl.category}</td>
                      <td className="px-4 py-3.5 text-forest/70">{bl.description}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs">{formatCurrency(bl.allocated)}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-moss">{formatCurrency(bl.spent)}</td>
                      <td className="px-4 py-3.5 w-36">
                        <ProgressBar value={pct(bl.spent, bl.allocated)} size="sm" color={pct(bl.spent, bl.allocated) > 90 ? 'gold' : 'green'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Team ────────────────────────────────────────────────────────── */}
        {tab === 'team' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teamMembers.map(m => (
              <div key={m.id} className="card p-4 flex items-center gap-3">
                <Avatar name={m.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-forest truncate">{m.name}</p>
                  <p className="text-xs text-fern/55 capitalize mt-0.5">{m.role.replace(/-/g, ' ')}</p>
                  <p className="text-xs text-fern/40 mt-0.5">{m.region}</p>
                </div>
                {m.id === program.lead && (
                  <span className="text-[9px] font-bold uppercase tracking-wide text-gold bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Lead
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Activity ────────────────────────────────────────────────────── */}
        {tab === 'activity' && (
          <div className="space-y-2.5">
            {activity.length === 0 ? (
              <p className="text-sm text-fern/60 py-8 text-center">No activity recorded yet.</p>
            ) : (
              activity.map(ev => (
                <div key={ev.id} className="card p-4 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage flex-shrink-0 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-forest/80">
                      <span className="font-semibold text-forest">{ev.actor}</span> {ev.message}
                    </p>
                    <p className="text-xs text-fern/45 mt-1">{ev.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  )
}
