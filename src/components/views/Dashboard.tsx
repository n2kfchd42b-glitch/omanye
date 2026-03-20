'use client'

import React, { useState, useEffect } from 'react'
import {
  FolderOpen, Database, Users, TrendingUp,
  Plus, AlertCircle, ArrowRight, BarChart2,
  HandCoins, Bell, Activity, Heart, RefreshCw,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge }  from '@/components/atoms/Badge'
import { ProgressBar }  from '@/components/atoms/ProgressBar'
import { EmptyState }   from '@/components/atoms/EmptyState'
import { firstName, todayDisplay, formatCurrency } from '@/lib/utils'
import type { ViewId, User, Program, Dataset, TeamMember } from '@/lib/types'
import type { DashboardStats, ActivityItem } from '@/app/(app)/org/[slug]/dashboard/page'

interface DashboardProps {
  user:            User
  programs:        Program[]
  datasets:        Dataset[]
  team:            TeamMember[]
  onNavigate:      (v: ViewId, id?: number) => void
  stats?:          DashboardStats
  recentActivity?: ActivityItem[]
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], React.ReactNode> = {
  indicator_update: <TrendingUp  size={13} />,
  program_update:   <BarChart2   size={13} />,
  expenditure:      <HandCoins   size={13} />,
  access_request:   <Bell        size={13} />,
}

const ACTIVITY_COLORS: Record<ActivityItem['type'], string> = {
  indicator_update: COLORS.sage,
  program_update:   COLORS.fern,
  expenditure:      COLORS.gold,
  access_request:   '#E53E3E',
}

export function Dashboard({
  user, programs, datasets, team, onNavigate, stats, recentActivity,
}: DashboardProps) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Use server-fetched stats when available; fall back to client-side computation
  const activePrograms = stats?.activePrograms ?? programs.filter(p => p.status === 'active').length
  const totalBudget    = programs.reduce((s, p) => s + p.budget, 0)
  const showNudge      = (stats?.activePrograms ?? programs.length) === 0

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 600, color: COLORS.forest }}>
          Welcome back, {firstName(user.name)} 👋
        </h2>
        <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>
          {todayDisplay()} · {user.org}
        </p>
      </div>

      {/* Setup nudge */}
      {showNudge && (
        <div
          className="fade-up-1"
          style={{
            background: COLORS.foam,
            border: `1px solid ${COLORS.mist}`,
            borderLeft: `3px solid ${COLORS.sage}`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}
        >
          <AlertCircle size={16} style={{ color: COLORS.sage, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>Complete your workspace setup</p>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>
              Add your first program to start tracking activities and sharing data with donors.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div
        className="fade-up-2"
        style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}
      >
        <StatCard
          icon={FolderOpen}
          label="Active Programs"
          value={stats ? activePrograms || '—' : (programs.length ? activePrograms : '—')}
          color={COLORS.moss}
        />
        <StatCard
          icon={Activity}
          label="Indicators"
          value={stats?.totalIndicators ?? '—'}
          color={COLORS.fern}
        />
        <StatCard
          icon={HandCoins}
          label="Active Donors"
          value={stats?.activeDonors ?? '—'}
          color={COLORS.sky}
        />
        <StatCard
          icon={Bell}
          label="Pending Requests"
          value={stats?.pendingRequests ?? '—'}
          color={(stats?.pendingRequests ?? 0) > 0 ? '#E53E3E' : COLORS.gold}
        />
      </div>

      {/* Two-column */}
      <div
        className="fade-up-3"
        style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}
      >
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest }}>Programs</h3>
            <button
              onClick={() => onNavigate('programs')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.sage, cursor: 'pointer' }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {programs.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={20} />}
              title="No programs yet"
              description="Create your first program to track activities."
              compact
              action={
                <button
                  onClick={() => onNavigate('programs')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8,
                    background: COLORS.moss, color: COLORS.forest,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Plus size={12} /> Add Program
                </button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {programs.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('program-detail', p.id)}
                  style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: COLORS.snow, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
                  onMouseLeave={e => (e.currentTarget.style.background = COLORS.snow)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{p.name}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <ProgressBar value={p.progress} showLabel />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 16 }}>
            Recent Activity
          </h3>
          {recentActivity && recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentActivity.map((item, i) => (
                <div
                  key={item.id + item.type}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '9px 0',
                    borderBottom: i < recentActivity.length - 1 ? `1px solid ${COLORS.mist}` : 'none',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: ACTIVITY_COLORS[item.type] + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ACTIVITY_COLORS[item.type],
                  }}>
                    {ACTIVITY_ICONS[item.type]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 600, color: COLORS.forest,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 1 }}>
                      {item.subtitle} · {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart2 size={20} />}
              title="No activity yet"
              description="Activity will appear here as your team works."
              compact
            />
          )}
        </div>
      </div>

      {/* Program Health Overview */}
      {stats !== undefined && (
        <div className="fade-up-4" style={{ marginBottom: 28 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Heart size={15} style={{ color: COLORS.crimson }} />
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest }}>
                  Program Health
                </h3>
              </div>
              {user.role === 'Admin' && (
                <RecalcButton />
              )}
            </div>
            {stats?.healthSummary == null ? (
              <p style={{ fontSize: 13, color: COLORS.stone }}>
                No health data yet — click Recalculate to score your active programs.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: 12 }}>
                <RAGSummaryCard color="#38A169" label="On Track"  count={stats.healthSummary.green} />
                <RAGSummaryCard color={COLORS.amber} label="At Risk"   count={stats.healthSummary.amber} />
                <RAGSummaryCard color={COLORS.crimson} label="Critical" count={stats.healthSummary.red} />
              </div>
            )}
            {stats?.healthSummary && stats.healthSummary.unscored > 0 && (
              <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 12 }}>
                {stats.healthSummary.unscored} active program{stats.healthSummary.unscored !== 1 ? 's' : ''} not yet scored
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick action cards */}
      <div className="fade-up-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        <QuickCard icon={FolderOpen} label="New Program"   desc="Create and track a program"          onClick={() => onNavigate('programs')} />
        <QuickCard icon={Database}   label="Connect Data"  desc="Link KoBoToolbox, REDCap or upload"  onClick={() => onNavigate('data-hub')} />
        <QuickCard icon={Users}      label="Invite Team"   desc="Add members to your workspace"       onClick={() => onNavigate('team')} />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="card card-hover" style={{ padding: '18px 20px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: color + '1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.forest, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>{label}</p>
    </div>
  )
}

function RAGSummaryCard({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{
      padding:      '14px 16px',
      borderRadius: 10,
      background:   color + '14',
      border:       `1px solid ${color}30`,
      textAlign:    'center',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, margin: '0 auto 8px' }} />
      <p style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{count}</p>
      <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>{label}</p>
    </div>
  )
}

function RecalcButton() {
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    setDone(false)
    try {
      await fetch('/api/health/recalculate', { method: 'POST' })
      setDone(true)
      setTimeout(() => setDone(false), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          5,
        padding:      '5px 12px',
        borderRadius: 7,
        fontSize:     12,
        fontWeight:   500,
        cursor:       loading ? 'not-allowed' : 'pointer',
        border:       `1px solid ${COLORS.mist}`,
        background:   COLORS.foam,
        color:        done ? '#38A169' : COLORS.slate,
        opacity:      loading ? 0.6 : 1,
        transition:   'color 0.2s',
        fontFamily:   FONTS.body,
      }}
    >
      <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      {done ? 'Recalculated' : 'Recalculate'}
    </button>
  )
}

function QuickCard({ icon: Icon, label, desc, onClick }: {
  icon: React.ElementType; label: string; desc: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="card card-hover"
      style={{ padding: '18px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: COLORS.foam,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} style={{ color: COLORS.fern }} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{label}</p>
        <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>{desc}</p>
      </div>
    </button>
  )
}
