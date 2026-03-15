'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Lock, TrendingUp, AlertCircle, Calendar,
  MapPin, Link2, BarChart3, FileText, Loader2, Globe,
  DollarSign, Wallet, Percent, TrendingDown,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField, Select, Textarea } from '@/components/atoms/FormField'
import { formatCurrency, pct, formatDate } from '@/lib/utils'
import { submitAccessRequest } from '@/app/actions/programs'
import type { DonorProgramView, ProgramUpdate } from '@/lib/programs'
import { UPDATE_TYPE_LABELS, UPDATE_TYPE_COLORS } from '@/lib/programs'
import type { AccessLevel } from '@/lib/supabase/database.types'
import { ACCESS_LEVEL_LABELS, ACCESS_LEVEL_DESCRIPTIONS } from '@/lib/auth/types'
import { canSeeIndicators, canSeeBudget } from '@/lib/donorFilter'
import type { DonorBudgetView } from '@/lib/budget'
import {
  TRANCHE_STATUS_LABELS,
  TRANCHE_STATUS_COLORS,
} from '@/lib/budget'

interface Props {
  program:        DonorProgramView
  rawProgram:     { start_date: string | null; end_date: string | null; logframe_url: string | null }
  updates:        ProgramUpdate[]
  org:            { id: string; name: string; slug: string; logo_url: string | null } | null
  accessLevel:    AccessLevel
  canDownload:    boolean
  expiresAt:      string | null
  pendingRequest: { requested_access_level: AccessLevel; status: string; created_at: string } | null
  organizationId: string
  donorBudget:    DonorBudgetView | null
}

type TabId = 'overview' | 'indicators' | 'updates' | 'budget'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Overview',   icon: <BarChart3 size={13} /> },
  { id: 'indicators', label: 'Indicators', icon: <TrendingUp size={13} /> },
  { id: 'updates',    label: 'Updates',    icon: <FileText size={13} /> },
  { id: 'budget',     label: 'Budget',     icon: <Wallet size={13} /> },
]

const ACCESS_LEVEL_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: 'INDICATORS',            label: ACCESS_LEVEL_LABELS.INDICATORS },
  { value: 'INDICATORS_AND_BUDGET', label: ACCESS_LEVEL_LABELS.INDICATORS_AND_BUDGET },
  { value: 'FULL',                  label: ACCESS_LEVEL_LABELS.FULL },
]

export default function DonorProgramDetailClient({
  program, rawProgram, updates, org,
  accessLevel, canDownload, expiresAt, pendingRequest, organizationId, donorBudget,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
  const [showRequestModal, setShowRequestModal] = useState(false)

  const hasIndicators = canSeeIndicators(accessLevel)
  const hasBudget     = canSeeBudget(accessLevel)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 4px' }}>
      {/* Back */}
      <button
        onClick={() => router.push('/donor/programs')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: COLORS.slate, cursor: 'pointer', background: 'none',
          border: 'none', padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} /> Back to Programs
      </button>

      {/* Pending access request banner */}
      {pendingRequest && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '12px 16px', borderRadius: 10,
          background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 13, color: '#78350F',
        }}>
          <AlertCircle size={15} />
          Your request for <strong>{ACCESS_LEVEL_LABELS[pendingRequest.requested_access_level]}</strong> access is pending review.
        </div>
      )}

      {/* Program header */}
      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height:     120,
          background: program.cover_image_url
            ? `url(${program.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.moss} 100%)`,
          position:  'relative',
        }}>
          <div style={{ position: 'absolute', top: 12, left: 16 }}>
            <StatusBadge status={program.status.toLowerCase()} />
          </div>
          <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: 'rgba(0,0,0,0.4)', color: '#fff',
            }}>
              {ACCESS_LEVEL_LABELS[accessLevel]}
            </span>
          </div>
        </div>
        <div style={{ padding: '20px 24px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
                {program.name}
              </h1>
              {org && (
                <div style={{ fontSize: 12, color: COLORS.stone, marginBottom: 8 }}>{org.name}</div>
              )}
              {program.objective && (
                <p style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6, marginBottom: 10 }}>{program.objective}</p>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: COLORS.stone }}>
                {program.primary_funder && (
                  <GenericBadge label={program.primary_funder} bg={COLORS.gold + '22'} text={COLORS.gold} />
                )}
                {(program.location_country || program.location_region) && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} />
                    {[program.location_region, program.location_country].filter(Boolean).join(', ')}
                  </span>
                )}
                {rawProgram.start_date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={10} />
                    {formatDate(rawProgram.start_date)} – {rawProgram.end_date ? formatDate(rawProgram.end_date) : 'Ongoing'}
                  </span>
                )}
                {hasBudget && program.total_budget && (
                  <span style={{ fontWeight: 700, color: COLORS.charcoal }}>
                    {formatCurrency(program.total_budget, program.currency ?? 'USD')}
                  </span>
                )}
              </div>
              {expiresAt && (
                <div style={{ fontSize: 11, color: COLORS.stone, marginTop: 8 }}>
                  Access expires: {new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>
            {!pendingRequest && (
              <button
                onClick={() => setShowRequestModal(true)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: '#fff', border: `1px solid ${COLORS.mist}`,
                  color: COLORS.slate, cursor: 'pointer', flexShrink: 0,
                }}
              >
                Request Access
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${COLORS.mist}` }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display:    'flex', alignItems: 'center', gap: 6,
              padding:    '10px 16px', fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              color:      tab === t.id ? COLORS.fern : COLORS.slate,
              background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? COLORS.fern : 'transparent'}`,
              cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab program={program} rawProgram={rawProgram} hasBudget={hasBudget} />
      )}
      {tab === 'indicators' && (
        <IndicatorsTab
          program={program}
          accessLevel={accessLevel}
          hasAccess={hasIndicators}
          onRequestAccess={() => setShowRequestModal(true)}
          hasPendingRequest={!!pendingRequest}
        />
      )}
      {tab === 'updates' && (
        <UpdatesTab updates={updates} />
      )}
      {tab === 'budget' && (
        <DonorBudgetTab
          accessLevel={accessLevel}
          donorBudget={donorBudget}
          currency={program.currency ?? 'USD'}
          onRequestAccess={() => setShowRequestModal(true)}
          hasPendingRequest={!!pendingRequest}
        />
      )}

      {showRequestModal && (
        <RequestAccessModal
          programId={program.id}
          programName={program.name}
          orgName={org?.name ?? ''}
          organizationId={organizationId}
          currentLevel={accessLevel}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({
  program: p, rawProgram, hasBudget,
}: {
  program:     DonorProgramView
  rawProgram:  { start_date: string | null; end_date: string | null; logframe_url: string | null }
  hasBudget:   boolean
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      {p.description && (
        <div className="card" style={{ padding: '20px 22px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 10 }}>About this program</h3>
          <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7 }}>{p.description}</p>
        </div>
      )}
      {hasBudget && p.total_budget && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Budget</h3>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.forest, fontFamily: FONTS.heading }}>
            {formatCurrency(p.total_budget, p.currency ?? 'USD')}
          </div>
          <div style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>{p.currency ?? 'USD'}</div>
        </div>
      )}
      {(rawProgram.start_date || rawProgram.end_date) && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timeline</h3>
          {rawProgram.start_date && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: COLORS.stone }}>Start</span>
              <span style={{ fontWeight: 600, color: COLORS.charcoal }}>{formatDate(rawProgram.start_date)}</span>
            </div>
          )}
          {rawProgram.end_date && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: COLORS.stone }}>End</span>
              <span style={{ fontWeight: 600, color: COLORS.charcoal }}>{formatDate(rawProgram.end_date)}</span>
            </div>
          )}
        </div>
      )}
      {p.tags?.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Tags</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {p.tags.map(t => (
              <span key={t} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 12, background: COLORS.foam, border: `1px solid ${COLORS.mist}`, color: COLORS.slate }}>{t}</span>
            ))}
          </div>
        </div>
      )}
      {rawProgram.logframe_url && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Logframe</h3>
          <a
            href={rawProgram.logframe_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.fern, textDecoration: 'none', fontWeight: 600 }}
          >
            <Link2 size={13} /> View Logframe
          </a>
        </div>
      )}
    </div>
  )
}

// ── Indicators Tab ────────────────────────────────────────────────────────────

function IndicatorsTab({
  program, accessLevel, hasAccess, onRequestAccess, hasPendingRequest,
}: {
  program:           DonorProgramView
  accessLevel:       AccessLevel
  hasAccess:         boolean
  onRequestAccess:   () => void
  hasPendingRequest: boolean
}) {
  if (!hasAccess) {
    return (
      <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
        <Lock size={32} color={COLORS.stone} style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
          Indicators Locked
        </h3>
        <p style={{ fontSize: 13, color: COLORS.slate, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Your current access level ({ACCESS_LEVEL_LABELS[accessLevel]}) does not include indicator data.
          Request higher access to unlock KPI progress and targets.
        </p>
        {!hasPendingRequest && (
          <button
            onClick={onRequestAccess}
            style={{
              padding: '9px 20px', borderRadius: 8,
              background: COLORS.moss, color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Request Indicator Access
          </button>
        )}
        {hasPendingRequest && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#FEF3C7', color: '#78350F', fontSize: 12, fontWeight: 600 }}>
            <AlertCircle size={13} /> Access request pending
          </div>
        )}
      </div>
    )
  }

  const indicators = program.indicators ?? []

  if (indicators.length === 0) {
    return (
      <div className="card" style={{ padding: 0 }}>
        <EmptyState icon={<TrendingUp size={24} />} title="No indicators shared" description="The NGO has not shared any indicators for this program yet." />
      </div>
    )
  }

  // Group by category
  const grouped: Record<string, typeof indicators> = {}
  for (const ind of indicators) {
    const cat = ind.category ?? 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(ind)
  }

  return (
    <div>
      {Object.entries(grouped).map(([cat, inds]) => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 800, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {cat} · {inds.length}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {inds.map(ind => (
              <div key={ind.id} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>{ind.name}</h4>
                    {ind.description && <p style={{ fontSize: 12, color: COLORS.slate }}>{ind.description}</p>}
                  </div>
                  {ind.unit && (
                    <span style={{ fontSize: 11, color: COLORS.stone, flexShrink: 0 }}>{ind.unit}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: COLORS.stone }}>
                    {ind.current_value.toLocaleString()}{ind.unit ? ` ${ind.unit}` : ''} current
                  </span>
                  <span style={{ color: COLORS.charcoal, fontWeight: 700 }}>
                    {ind.target_value ? `${pct(ind.current_value, ind.target_value)}% of ${ind.target_value.toLocaleString()}` : 'No target'}
                  </span>
                </div>
                <ProgressBar value={pct(ind.current_value, ind.target_value ?? 0)} />
                {ind.data_source && (
                  <div style={{ fontSize: 10, color: COLORS.stone, marginTop: 6 }}>Source: {ind.data_source}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Updates Tab ───────────────────────────────────────────────────────────────

function UpdatesTab({ updates }: { updates: ProgramUpdate[] }) {
  if (updates.length === 0) {
    return (
      <div className="card" style={{ padding: 0 }}>
        <EmptyState icon={<FileText size={24} />} title="No updates yet" description="The NGO has not shared any public updates for this program yet." />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {updates.map(u => {
        const typeColors = UPDATE_TYPE_COLORS[u.update_type]
        return (
          <div key={u.id} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: typeColors.bg, color: typeColors.text }}>
                {UPDATE_TYPE_LABELS[u.update_type]}
              </span>
              <span style={{ fontSize: 12, color: COLORS.stone }}>
                {u.published_at ? formatDate(u.published_at) : ''}
              </span>
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>{u.title}</h4>
            {u.body && (
              <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{u.body}</p>
            )}
            {u.attachments?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {u.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7,
                    background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
                    fontSize: 12, color: COLORS.fern, textDecoration: 'none',
                  }}>
                    📎 {a.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Donor Budget Tab ──────────────────────────────────────────────────────────

function DonorBudgetTab({
  accessLevel, donorBudget, currency, onRequestAccess, hasPendingRequest,
}: {
  accessLevel:       AccessLevel
  donorBudget:       DonorBudgetView | null
  currency:          string
  onRequestAccess:   () => void
  hasPendingRequest: boolean
}) {
  const fmt = (n: number) => formatCurrency(n, currency)

  // Locked state for SUMMARY_ONLY and INDICATORS
  if (!donorBudget) {
    return (
      <div className="card" style={{ padding: '40px 32px', textAlign: 'center', border: `2px solid ${COLORS.gold}33` }}>
        <Lock size={32} color={COLORS.stone} style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
          Budget Data Locked
        </h3>
        <p style={{ fontSize: 13, color: COLORS.slate, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Your current access level ({ACCESS_LEVEL_LABELS[accessLevel]}) does not include budget information.
          Request <strong>Budget + Indicators</strong> or <strong>Full Access</strong> to unlock aggregated financial data.
        </p>
        <p style={{ fontSize: 11, color: COLORS.stone, marginBottom: 20 }}>
          Note: Individual expenditures are never shared with donors.
        </p>
        {!hasPendingRequest ? (
          <button
            onClick={onRequestAccess}
            style={{
              padding: '9px 20px', borderRadius: 8,
              background: COLORS.moss, color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Request Budget Access
          </button>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#FEF3C7', color: '#78350F', fontSize: 12, fontWeight: 600 }}>
            <AlertCircle size={13} /> Access request pending
          </div>
        )}
      </div>
    )
  }

  const summary  = donorBudget.budget_summary
  const catSpend = donorBudget.category_spend
  const tranches = donorBudget.funding_tranches
  const isFullAccess = accessLevel === 'FULL'

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {donorBudget.total_budget != null && (
          <div className="card" style={{ flex: 1, minWidth: 140, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <DollarSign size={13} color={COLORS.fern} />
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Budget</span>
            </div>
            <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 800, color: COLORS.forest }}>
              {fmt(donorBudget.total_budget)}
            </div>
          </div>
        )}
        {summary && (
          <>
            <div className="card" style={{ flex: 1, minWidth: 140, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <TrendingDown size={13} color={COLORS.amber} />
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Spent</span>
              </div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 800, color: COLORS.forest }}>{fmt(summary.total_spent)}</div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Wallet size={13} color={COLORS.fern} />
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remaining</span>
              </div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 800, color: COLORS.forest }}>{fmt(summary.total_remaining)}</div>
            </div>
            <div className="card" style={{ flex: 1, minWidth: 140, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Percent size={13} color={COLORS.gold} />
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Burn Rate</span>
              </div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 800, color: COLORS.forest }}>
                {summary.burn_rate_pct != null ? `${summary.burn_rate_pct}%` : '—'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category breakdown */}
      {catSpend.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.mist}` }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest }}>
              Budget Breakdown by Category
            </h3>
            <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>
              Aggregated figures only — individual expenditures are not disclosed.
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Category', 'Allocated', 'Spent', 'Remaining', 'Burn Rate'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catSpend.map((cat, i) => (
                <tr key={cat.category_id} style={{ borderBottom: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: cat.color, display: 'inline-block' }} />
                      {cat.name}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{fmt(cat.allocated_amount)}</td>
                  <td style={{ padding: '10px 16px' }}>{fmt(cat.spent)}</td>
                  <td style={{ padding: '10px 16px', color: cat.remaining < 0 ? '#C0392B' : undefined }}>{fmt(cat.remaining)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ color: (cat.burn_rate_pct ?? 0) > 90 ? '#C0392B' : (cat.burn_rate_pct ?? 0) > 70 ? COLORS.amber : COLORS.fern }}>
                      {cat.burn_rate_pct != null ? `${cat.burn_rate_pct}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Funding tranches */}
      {tranches.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.mist}` }}>
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest }}>
              Funding Tranches {isFullAccess ? '' : '(Your Contributions)'}
            </h3>
          </div>
          <div style={{ padding: '12px 0' }}>
            {tranches.map(t => {
              const colors = TRANCHE_STATUS_COLORS[t.status]
              return (
                <div key={t.id} style={{ padding: '12px 20px', borderBottom: `1px solid ${COLORS.mist}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.charcoal, marginBottom: 3 }}>
                      Tranche {t.tranche_number}{t.funder_name ? ` — ${t.funder_name}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.slate }}>
                      Expected: <strong>{fmt(t.expected_amount)}</strong> by {formatDate(t.expected_date)}
                      {t.received_amount != null && (
                        <> · Received: <strong>{fmt(t.received_amount)}</strong>{t.received_date ? ` on ${formatDate(t.received_date)}` : ''}</>
                      )}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                    background: colors.bg, color: colors.text,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, display: 'inline-block' }} />
                    {TRANCHE_STATUS_LABELS[t.status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {catSpend.length === 0 && tranches.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.stone, fontSize: 14 }}>
          No budget data has been published for this program yet.
        </div>
      )}
    </div>
  )
}

// ── RequestAccessModal ────────────────────────────────────────────────────────

function RequestAccessModal({
  programId, programName, orgName, organizationId, currentLevel, onClose,
}: {
  programId:      string
  programName:    string
  orgName:        string
  organizationId: string
  currentLevel:   AccessLevel
  onClose:        () => void
}) {
  // Only show levels higher than current
  const availableLevels = ACCESS_LEVEL_OPTIONS.filter(o => {
    const order: Record<AccessLevel, number> = {
      SUMMARY_ONLY: 0, INDICATORS: 1, INDICATORS_AND_BUDGET: 2, FULL: 3,
    }
    return order[o.value] > order[currentLevel]
  })

  const [level,   setLevel]   = useState<AccessLevel>(availableLevels[0]?.value ?? 'INDICATORS')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error,  setError]    = useState<string | null>(null)
  const [success,setSuccess]  = useState(false)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await submitAccessRequest({
        program_id:             programId,
        organization_id:        organizationId,
        requested_access_level: level,
        message:                message.trim() || undefined,
      })
      if (res.error) { setError(res.error); return }
      setSuccess(true)
      setTimeout(onClose, 1500)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,43,30,0.55)',
    }} onClick={onClose}>
      <div
        className="card"
        style={{ width: 460, maxWidth: '95vw', padding: '26px 28px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
          Request Additional Access
        </h3>
        <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 20 }}>
          {programName} · {orgName}
        </p>

        {success ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ fontSize: 14, color: COLORS.fern, fontWeight: 700 }}>Request submitted!</p>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 4 }}>The NGO team will review your request.</p>
          </div>
        ) : availableLevels.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: COLORS.slate }}>You already have the highest access level (Full Access).</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Access level requested" htmlFor="ra-level">
                <Select
                  id="ra-level"
                  options={availableLevels}
                  value={level}
                  onChange={e => setLevel(e.target.value as AccessLevel)}
                />
              </FormField>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: COLORS.foam, border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.slate }}>
                {ACCESS_LEVEL_DESCRIPTIONS[level]}
              </div>
              <FormField label="Message to NGO (optional)" htmlFor="ra-msg">
                <Textarea
                  id="ra-msg"
                  rows={3}
                  placeholder="Explain why you need this level of access…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </FormField>
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, background: '#fff', border: `1px solid ${COLORS.mist}`, cursor: 'pointer', color: COLORS.slate }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  background: isPending ? COLORS.mist : COLORS.moss,
                  color: isPending ? COLORS.stone : '#fff',
                  border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Submit Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
