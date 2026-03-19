'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, TrendingUp, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, ResponsiveContainer, Cell,
} from 'recharts'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { formatDate, pct } from '@/lib/utils'
import type { MaeSummary } from '@/types/field'
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS } from '@/types/field'

// ── Tab bar (same as field/page.tsx) ─────────────────────────────────────────

const PROGRAM_TABS = [
  { id: 'overview',   label: 'Overview',   href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}` },
  { id: 'indicators', label: 'Indicators', href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=indicators` },
  { id: 'updates',    label: 'Updates',    href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=updates` },
  { id: 'budget',     label: 'Budget',     href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=budget` },
  { id: 'reports',    label: 'Reports',    href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=reports` },
  { id: 'field',      label: 'Field Data', href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}/field` },
  { id: 'mae',        label: 'M&E',        href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}/mae` },
]

function ProgramTabBar({ slug, programId, active }: { slug: string; programId: string; active: string }) {
  const router = useRouter()
  return (
    <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${COLORS.mist}`, padding: '0 24px', background: '#1A2B4A', overflowX: 'auto' }}>
      {PROGRAM_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href(slug, programId))}
          style={{
            padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap',
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? COLORS.forest : COLORS.stone,
            borderBottom: active === tab.id ? `2px solid ${COLORS.forest}` : '2px solid transparent',
            background: 'none', cursor: 'pointer', marginBottom: -1,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Indicator {
  id:         string
  name:       string
  target:     number
  current:    number
  unit:       string
  is_key:     boolean
  updates:    { value: number; recorded_at: string }[]
}

interface MonthlySubmission {
  month:  string
  count:  number
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card" style={{ padding: '16px 20px', flex: '1 1 160px' }}>
      <p style={{ fontSize: 11, color: COLORS.stone, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.forest, lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: 12 }}>
      <p style={{ fontWeight: 600, color: COLORS.forest, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MaeDashboardPage() {
  const params = useParams<{ slug: string; programId: string }>()
  const router = useRouter()

  const [programName,   setProgramName]   = useState('')
  const [summary,       setSummary]       = useState<MaeSummary | null>(null)
  const [indicators,    setIndicators]    = useState<Indicator[]>([])
  const [submissions,   setSubmissions]   = useState<{ submission_date: string; status: string }[]>([])
  const [loading,       setLoading]       = useState(true)
  const [activeLines,   setActiveLines]   = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: prog } = await supabase.from('programs').select('name').eq('id', params.programId).single()
      setProgramName((prog as { name: string } | null)?.name ?? '')

      // Fetch indicators with updates (cast via unknown to bypass strict DB types)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = supabase

      const { data: indsRaw } = await db
        .from('indicators')
        .select('id, name, target, current_value, unit, is_key')
        .eq('program_id', params.programId)
        .order('sort_order', { ascending: true })

      const inds = (indsRaw ?? []) as { id: string; name: string; target: number; current_value: number; unit: string; is_key: boolean }[]

      // Fetch indicator updates for each indicator (for time series)
      let indicatorsWithUpdates: Indicator[] = []
      if (inds.length > 0) {
        const { data: updatesRaw } = await db
          .from('indicator_updates')
          .select('indicator_id, new_value, recorded_at')
          .in('indicator_id', inds.map((i: { id: string }) => i.id))
          .order('recorded_at', { ascending: true })

        const updatesMap = new Map<string, { value: number; recorded_at: string }[]>()
        for (const u of (updatesRaw ?? []) as { indicator_id: string; new_value: number; recorded_at: string }[]) {
          const arr = updatesMap.get(u.indicator_id) ?? []
          arr.push({ value: u.new_value, recorded_at: u.recorded_at })
          updatesMap.set(u.indicator_id, arr)
        }

        indicatorsWithUpdates = inds.map(ind => ({
          id:      ind.id,
          name:    ind.name,
          target:  ind.target ?? 0,
          current: ind.current_value ?? 0,
          unit:    ind.unit ?? '',
          is_key:  ind.is_key ?? false,
          updates: updatesMap.get(ind.id) ?? [],
        }))
      }

      setIndicators(indicatorsWithUpdates)
      setActiveLines(new Set(indicatorsWithUpdates.filter(i => i.is_key).map(i => i.id).slice(0, 5)))

      // Fetch summary
      const [summaryRes, subRaw] = await Promise.all([
        fetch(`/api/field/summary?program_id=${params.programId}`),
        db
          .from('field_submissions')
          .select('submission_date, status')
          .eq('program_id', params.programId)
          .order('submission_date', { ascending: true }),
      ])

      if (summaryRes.ok) {
        const j = await summaryRes.json()
        setSummary(j.data)
      }

      setSubmissions(((subRaw as { data: unknown[] })?.data ?? []) as { submission_date: string; status: string }[])
    } catch (err) {
      console.error('M&E load error:', err)
    } finally {
      setLoading(false)
    }
  }, [params.programId, params.slug, router])

  useEffect(() => { load() }, [load])

  // ── Chart data ──────────────────────────────────────────────────────────────

  // Indicator achievement chart data
  const achievementData = indicators.map(ind => {
    const pctVal = ind.target > 0 ? Math.round((ind.current / ind.target) * 100) : 0
    return {
      name:    ind.name.length > 18 ? ind.name.slice(0, 18) + '…' : ind.name,
      fullName: ind.name,
      target:  ind.target,
      current: ind.current,
      pct:     pctVal,
      color:   pctVal >= 75 ? '#38A169' : pctVal >= 50 ? '#D4AF5C' : '#C0392B',
    }
  })

  // Progress over time — pivot by month
  const timeSeriesIndicators = indicators.filter(i => activeLines.has(i.id) && i.updates.length > 0)
  const allDates = Array.from(new Set(
    timeSeriesIndicators.flatMap(i => i.updates.map(u => u.recorded_at.slice(0, 10)))
  )).sort()

  const timeSeriesData = allDates.map(date => {
    const entry: Record<string, unknown> = { date: formatDate(date) }
    for (const ind of timeSeriesIndicators) {
      const update = [...ind.updates].reverse().find(u => u.recorded_at.slice(0, 10) <= date)
      entry[ind.id] = update?.value ?? null
    }
    return entry
  })

  // Submissions over time (monthly)
  const monthlyMap = new Map<string, number>()
  for (const sub of submissions) {
    const month = sub.submission_date?.slice(0, 7)
    if (month) monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1)
  }
  const monthlyData: MonthlySubmission[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  const LINE_COLORS = ['#38A169', '#D4AF5C', '#2563EB', '#8B5CF6', '#EC4899', '#0891B2']

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => router.push(`/org/${params.slug}/programs/${params.programId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: COLORS.stone, background: 'none', cursor: 'pointer', fontSize: 13, border: 'none' }}
        >
          <ArrowLeft size={14} /> {programName || 'Program'}
        </button>
        <span style={{ color: COLORS.mist }}>/</span>
        <span style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest }}>M&E Dashboard</span>
      </div>

      {/* Tab bar */}
      <ProgramTabBar slug={params.slug} programId={params.programId} active="mae" />

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Summary stat cards ── */}
        {summary && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatCard label="Total Submissions"  value={summary.total_submissions} />
            <StatCard label="This Month"          value={summary.submissions_this_month} />
            <StatCard label="Reviewed"            value={summary.by_status.REVIEWED ?? 0}
              sub={`${pct(summary.by_status.REVIEWED ?? 0, summary.total_submissions)}% of total`} />
            <StatCard label="Flagged"             value={summary.by_status.FLAGGED ?? 0} />
            <StatCard label="Active Forms"        value={summary.active_forms_count} />
          </div>
        )}

        {/* ── Indicator Achievement Chart ── */}
        {achievementData.length > 0 && (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                Indicator Achievement
              </h3>
              <p style={{ fontSize: 12, color: COLORS.stone }}>Target vs current value for all indicators</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={achievementData} margin={{ top: 5, right: 16, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.foam} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: COLORS.stone }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: COLORS.stone }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="target"  name="Target"  fill={COLORS.mist} radius={[3,3,0,0]} />
                <Bar dataKey="current" name="Current" radius={[3,3,0,0]}>
                  {achievementData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend for colors */}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: COLORS.stone }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#38A169', display: 'inline-block' }} />
                ≥75% (On Track)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.gold, display: 'inline-block' }} />
                50–74% (At Risk)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#C0392B', display: 'inline-block' }} />
                &lt;50% (Off Track)
              </span>
            </div>
          </div>
        )}

        {/* ── Progress Over Time ── */}
        {timeSeriesData.length > 0 && (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                  Progress Over Time
                </h3>
                <p style={{ fontSize: 12, color: COLORS.stone }}>Key indicator values across reporting periods</p>
              </div>
              {/* Toggle which indicators to show */}
              {indicators.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 360, justifyContent: 'flex-end' }}>
                  {indicators.filter(i => i.updates.length > 0).map((ind, idx) => (
                    <button
                      key={ind.id}
                      onClick={() => setActiveLines(prev => {
                        const next = new Set(prev)
                        next.has(ind.id) ? next.delete(ind.id) : next.add(ind.id)
                        return next
                      })}
                      style={{
                        padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                        background: activeLines.has(ind.id) ? LINE_COLORS[idx % LINE_COLORS.length] : COLORS.foam,
                        color: activeLines.has(ind.id) ? '#fff' : COLORS.stone,
                        cursor: 'pointer', border: 'none',
                        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                      title={ind.name}
                    >
                      {ind.name.length > 14 ? ind.name.slice(0, 14) + '…' : ind.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeSeriesData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.foam} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.stone }} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.stone }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {timeSeriesIndicators.map((ind, idx) => (
                  <Line
                    key={ind.id}
                    type="monotone"
                    dataKey={ind.id}
                    name={ind.name.length > 20 ? ind.name.slice(0, 20) + '…' : ind.name}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Submissions Over Time ── */}
        {monthlyData.length > 0 && (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                Submissions Over Time
              </h3>
              <p style={{ fontSize: 12, color: COLORS.stone }}>Monthly field data collection volume</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="subFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.forest} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.forest} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.foam} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: COLORS.stone }} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.stone }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Submissions"
                  stroke={COLORS.gold}
                  strokeWidth={2}
                  fill="url(#subFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Collection Coverage ── */}
        {summary && summary.by_location.length > 0 && (
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                Collection Coverage
              </h3>
              <p style={{ fontSize: 12, color: COLORS.stone }}>Submission volume by location</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {summary.by_location.map(loc => {
                const maxCount = Math.max(...summary.by_location.map(l => l.count))
                const width    = maxCount > 0 ? (loc.count / maxCount) * 100 : 0
                return (
                  <div key={loc.location_name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ minWidth: 140, fontSize: 13, color: COLORS.charcoal, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {loc.location_name}
                    </span>
                    <div style={{ flex: 1, height: 8, background: COLORS.foam, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${width}%`, background: COLORS.forest, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ minWidth: 32, fontSize: 12, color: COLORS.stone, textAlign: 'right', fontWeight: 600 }}>
                      {loc.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Status breakdown ── */}
        {summary && (
          <div className="card" style={{ padding: '20px 24px' }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 14 }}>
              Submission Status Breakdown
            </h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {Object.entries(summary.by_status).map(([status, count]) => {
                const s = SUBMISSION_STATUS_COLORS[status as keyof typeof SUBMISSION_STATUS_COLORS]
                return (
                  <div key={status} style={{ padding: '10px 16px', borderRadius: 10, background: s?.bg ?? COLORS.foam, flex: '1 1 100px', textAlign: 'center' }}>
                    <p style={{ fontSize: 22, fontWeight: 700, fontFamily: FONTS.heading, color: s?.text ?? COLORS.forest }}>{count}</p>
                    <p style={{ fontSize: 11, color: s?.text ?? COLORS.stone, fontWeight: 600 }}>
                      {SUBMISSION_STATUS_LABELS[status as keyof typeof SUBMISSION_STATUS_LABELS] ?? status}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {indicators.length === 0 && (!summary || summary.total_submissions === 0) && (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <BarChart3 size={32} style={{ color: COLORS.stone, marginBottom: 12, margin: '0 auto 12px' }} />
            <p style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, marginBottom: 6 }}>No M&E data yet</p>
            <p style={{ fontSize: 13, color: COLORS.stone, maxWidth: 360, margin: '0 auto' }}>
              Add indicators and submit field data to see M&E analytics here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
