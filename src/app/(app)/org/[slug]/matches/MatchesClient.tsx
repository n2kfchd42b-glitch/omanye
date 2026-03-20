'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle, MinusCircle, ExternalLink, Bookmark, BookmarkCheck,
  AlertCircle, ChevronDown, ChevronUp, Target, ArrowUpDown,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { getRankedMatches, getMatchExplanation } from '@/lib/funder-match'
import { getCompleteness, FIELD_LABELS, FIELD_TAB } from '@/lib/profile-completeness'
import FundersClient from '../funders/FundersClient'
import type { SavedRow, FunderOpportunity } from '../funders/page'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NgoProfile {
  focus_areas:          string[]
  eligible_geographies: string[]
  program_types:        string[]
  annual_budget_range:  string | null
}

interface Props {
  orgSlug:      string
  orgId:        string
  ngoProfile:   NgoProfile
  initialSaved: SavedRow[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orgData:      Record<string, any>
}

type SortBy = 'score' | 'deadline' | 'amount'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number | null): string {
  if (n === null) return '?'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fundingRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Unspecified'
  if (min === null) return `Up to ${formatCurrency(max)}`
  if (max === null) return `From ${formatCurrency(min)}`
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Rolling'
  return new Date(deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function deadlineUrgency(deadline: string | null): 'normal' | 'amber' | 'red' {
  if (!deadline) return 'normal'
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days <= 14) return 'red'
  if (days <= 30) return 'amber'
  return 'normal'
}

function scoreColor(score: number): string {
  if (score >= 75) return '#38A169'
  if (score >= 50) return COLORS.gold
  if (score >= 25) return '#60A5FA'
  return COLORS.stone
}

// ── CircularScore ─────────────────────────────────────────────────────────────

function CircularScore({ score }: { score: number }) {
  const r    = 22
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(1, score / 100)) * circ
  const color = scoreColor(score)
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" aria-label={`Match score ${score}`}>
      <circle cx={28} cy={28} r={r} fill="none" stroke={COLORS.foam} strokeWidth={5} />
      <circle
        cx={28} cy={28} r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text
        x={28} y={33}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={color}
        fontFamily={FONTS.body}
      >
        {score}
      </text>
    </svg>
  )
}

// ── MatchBreakdownPanel ────────────────────────────────────────────────────────

function MatchBreakdownPanel({ exp, opp }: {
  exp: ReturnType<typeof getMatchExplanation>
  opp: FunderOpportunity
}) {
  const hasBudgetCriteria = opp.funding_range_min !== null || opp.funding_range_max !== null
  return (
    <div style={{
      background: COLORS.foam,
      border: `1px solid ${COLORS.mist}40`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.stone, margin: 0 }}>
        Match Breakdown
      </p>

      {/* Focus Areas */}
      {(exp.matched_focus_areas.length > 0 || exp.unmatched_focus_areas.length > 0) && (
        <div>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 6px', fontWeight: 600 }}>Focus Areas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {exp.matched_focus_areas.map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#38A169' }}>
                <CheckCircle size={12} /> {f}
              </span>
            ))}
            {exp.unmatched_focus_areas.map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.stone }}>
                <MinusCircle size={12} /> {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Geographies */}
      {(exp.matched_geographies.length > 0 || exp.unmatched_geographies.length > 0) && (
        <div>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 6px', fontWeight: 600 }}>Geographies</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {exp.matched_geographies.map(g => (
              <span key={g} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#38A169' }}>
                <CheckCircle size={12} /> {g}
              </span>
            ))}
            {exp.unmatched_geographies.map(g => (
              <span key={g} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.stone }}>
                <MinusCircle size={12} /> {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Budget Fit */}
      {hasBudgetCriteria && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: 0, fontWeight: 600 }}>Budget:</p>
          {exp.budget_fit ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#38A169' }}>
              <CheckCircle size={12} /> Fits ({fundingRange(opp.funding_range_min, opp.funding_range_max)})
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.stone }}>
              <MinusCircle size={12} /> Outside range ({fundingRange(opp.funding_range_min, opp.funding_range_max)})
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── MatchCard ─────────────────────────────────────────────────────────────────

function MatchCard({
  opp, score, explanation, savedId, savedStatus, onSave, onUnsave,
}: {
  opp:         FunderOpportunity
  score:       number
  explanation: ReturnType<typeof getMatchExplanation>
  savedId?:    string
  savedStatus?: 'saved' | 'applied' | 'declined'
  onSave:      (oppId: string) => Promise<void>
  onUnsave:    (savedId: string) => Promise<void>
}) {
  const [saving,   setSaving]   = useState(false)
  const isSaved   = !!savedId
  const urgency   = deadlineUrgency(opp.application_deadline)
  const deadlineColor =
    urgency === 'red'   ? COLORS.crimson :
    urgency === 'amber' ? '#F59E0B'       :
    COLORS.stone

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      if (isSaved) await onUnsave(savedId!)
      else         await onSave(opp.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: '#1A2B4A',
      border: `1px solid ${score >= 75 ? '#38A16940' : score >= 50 ? `${COLORS.gold}30` : `${COLORS.mist}40`}`,
      borderRadius: 14,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      boxShadow: score >= 75 ? '0 2px 12px rgba(56,161,105,0.1)' : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            {opp.funder_name}
          </p>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.4 }}>
            {opp.opportunity_title}
          </h3>
          {score >= 75 && (
            <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: '#38A16920', color: '#38A169', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              High Confidence Match
            </span>
          )}
        </div>
        <CircularScore score={score} />
      </div>

      {/* Funding + Deadline */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 2px' }}>Funding</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', margin: 0 }}>
            {fundingRange(opp.funding_range_min, opp.funding_range_max)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 2px' }}>Deadline</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: deadlineColor, margin: 0 }}>
            {formatDeadline(opp.application_deadline)}
            {urgency === 'red'   && ' · Closing soon!'}
            {urgency === 'amber' && ' · Closing in 30 days'}
          </p>
        </div>
      </div>

      {/* Match breakdown panel */}
      <MatchBreakdownPanel exp={explanation} opp={opp} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: isSaved ? `${COLORS.sage}20` : COLORS.foam,
            color: isSaved ? COLORS.gold : COLORS.slate,
            border: `1px solid ${isSaved ? COLORS.sage : COLORS.mist}`,
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
          }}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {isSaved ? (savedStatus === 'applied' ? 'Applied' : savedStatus === 'declined' ? 'Declined' : 'Saved') : 'Save'}
        </button>

        {opp.external_link && (
          <a
            href={opp.external_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: COLORS.gold, color: COLORS.forest,
              border: 'none', textDecoration: 'none', fontFamily: FONTS.body,
            }}
          >
            <ExternalLink size={14} />
            Apply
          </a>
        )}
      </div>
    </div>
  )
}

// ── MatchSummaryBar ───────────────────────────────────────────────────────────

function MatchSummaryBar({ total, above50, above75, completeness }: {
  total:        number
  above50:      number
  above75:      number
  completeness: number
}) {
  const stats = [
    { label: 'Total Active', value: total },
    { label: 'Matched 50+',  value: above50, color: COLORS.gold },
    { label: 'Matched 75+',  value: above75, color: '#38A169' },
    { label: 'Profile',      value: `${completeness}%`, color: completeness >= 80 ? '#38A169' : completeness >= 50 ? COLORS.gold : COLORS.stone },
  ]
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 1,
      background: COLORS.foam,
      border: `1px solid ${COLORS.mist}40`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          flex: '1 1 120px',
          padding: '14px 20px',
          borderRight: i < stats.length - 1 ? `1px solid ${COLORS.mist}40` : 'none',
        }}>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {s.label}
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: (s.color ?? '#ffffff'), margin: 0 }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── CompletenessNudge ─────────────────────────────────────────────────────────

function CompletenessNudge({ score, emptyFields, orgSlug, onDismiss }: {
  score:       number
  emptyFields: string[]
  orgSlug:     string
  onDismiss:   () => void
}) {
  return (
    <div style={{
      background: '#1A2B4A',
      border: `1px solid ${COLORS.gold}30`,
      borderRadius: 12,
      padding: '16px 20px',
      marginBottom: 20,
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Target size={16} style={{ color: COLORS.gold, flexShrink: 0 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Complete your profile to improve matching
          </p>
        </div>
        {/* Progress bar */}
        <div style={{ background: COLORS.foam, borderRadius: 6, height: 6, marginBottom: 10 }}>
          <div style={{ width: `${score}%`, height: '100%', borderRadius: 6, background: score >= 80 ? '#38A169' : COLORS.gold, transition: 'width 0.4s ease' }} />
        </div>
        <p style={{ fontSize: 12, color: COLORS.stone, margin: '0 0 10px' }}>
          {score}% complete — fill in the fields below to improve your match quality:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {emptyFields.slice(0, 6).map(f => {
            const tab = FIELD_TAB[f] === 'grant-profile' ? 'profile' : 'tags'
            return (
              <a
                key={f}
                href={`/org/${orgSlug}/settings?tab=${tab}`}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: COLORS.foam, color: COLORS.gold,
                  border: `1px solid ${COLORS.gold}30`,
                  textDecoration: 'none', fontFamily: FONTS.body,
                }}
              >
                {FIELD_LABELS[f] ?? f} →
              </a>
            )
          })}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent', border: 'none', color: COLORS.stone,
          cursor: 'pointer', fontSize: 12, fontFamily: FONTS.body,
          padding: '4px 8px', flexShrink: 0,
        }}
      >
        Dismiss
      </button>
    </div>
  )
}

// ── NoProfilePrompt ───────────────────────────────────────────────────────────

function NoProfilePrompt({ orgSlug }: { orgSlug: string }) {
  return (
    <div style={{
      padding: '60px 40px',
      textAlign: 'center',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <Target size={48} style={{ color: COLORS.gold, marginBottom: 16 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: '0 0 12px', fontFamily: FONTS.heading }}>
        Profile tags required for matching
      </h2>
      <p style={{ fontSize: 14, color: COLORS.stone, lineHeight: 1.6, margin: '0 0 24px' }}>
        Donor Matching needs your focus areas, eligible geographies, program types, and budget range to rank funders for you.
        Add these in Settings to unlock personalized match scores.
      </p>
      <a
        href={`/org/${orgSlug}/settings?tab=tags`}
        style={{
          display: 'inline-block',
          padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          background: COLORS.gold, color: COLORS.forest,
          textDecoration: 'none', fontFamily: FONTS.body,
        }}
      >
        Complete Profile Tags →
      </a>
    </div>
  )
}

// ── SortControls ──────────────────────────────────────────────────────────────

function SortControls({ sortBy, onSort }: { sortBy: SortBy; onSort: (s: SortBy) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
      <ArrowUpDown size={14} style={{ color: COLORS.stone }} />
      <span style={{ fontSize: 12, color: COLORS.stone, fontWeight: 600 }}>Sort by:</span>
      {([
        ['score',    'Match Score'],
        ['deadline', 'Deadline'],
        ['amount',   'Funding Amount'],
      ] as [SortBy, string][]).map(([id, label]) => (
        <button
          key={id}
          onClick={() => onSort(id)}
          style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: sortBy === id ? 700 : 500,
            background: sortBy === id ? COLORS.gold : COLORS.foam,
            color: sortBy === id ? COLORS.forest : COLORS.slate,
            border: `1px solid ${sortBy === id ? COLORS.gold : COLORS.mist}`,
            cursor: 'pointer', fontFamily: FONTS.body,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 400,
      background: ok ? COLORS.forest : COLORS.crimson,
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 500, boxShadow: SHADOW.toast,
      border: `1px solid ${ok ? COLORS.gold : COLORS.crimson}40`,
    }}>
      {msg}
    </div>
  )
}

// ── MatchesClient (main) ──────────────────────────────────────────────────────

export default function MatchesClient({ orgSlug, orgId, ngoProfile, initialSaved, orgData }: Props) {
  const [tab,        setTab]        = useState<'matches' | 'funders' | 'saved'>('matches')
  const [funders,    setFunders]    = useState<FunderOpportunity[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [sortBy,     setSortBy]     = useState<SortBy>('score')
  const [showLower,  setShowLower]  = useState(false)
  const [saved,      setSaved]      = useState<SavedRow[]>(initialSaved)
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)
  const [dismissed,  setDismissed]  = useState(false)

  const completeness = useMemo(() => getCompleteness(orgData), [orgData])

  // Check localStorage for completeness nudge dismissal
  useEffect(() => {
    const key = `omanye_match_dismiss_${orgId}_${completeness.score}`
    setDismissed(localStorage.getItem(key) === '1')
  }, [orgId, completeness.score])

  function handleDismiss() {
    const key = `omanye_match_dismiss_${orgId}_${completeness.score}`
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  // Fetch all active funders on mount (Top Matches tab only needs this)
  useEffect(() => {
    fetch('/api/funders?status=active&limit=100')
      .then(r => r.json())
      .then(j => setFunders((j as { data: FunderOpportunity[] }).data ?? []))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const hasProfile = ngoProfile.focus_areas.length > 0 ||
    ngoProfile.eligible_geographies.length > 0 ||
    ngoProfile.program_types.length > 0 ||
    !!ngoProfile.annual_budget_range

  // Compute ranked matches + explanations client-side
  const ranked = useMemo(() => {
    return getRankedMatches(ngoProfile, funders).map(({ opp, score }) => ({
      opp,
      score,
      explanation: getMatchExplanation(ngoProfile, opp),
    }))
  }, [funders, ngoProfile])

  // Apply sort
  const sorted = useMemo(() => {
    return [...ranked].sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'deadline') {
        const da = a.opp.application_deadline ? new Date(a.opp.application_deadline).getTime() : Infinity
        const db = b.opp.application_deadline ? new Date(b.opp.application_deadline).getTime() : Infinity
        return da - db
      }
      // amount — sort by max funding desc
      return (b.opp.funding_range_max ?? 0) - (a.opp.funding_range_max ?? 0)
    })
  }, [ranked, sortBy])

  const above50    = ranked.filter(m => m.score >= 50).length
  const above75    = ranked.filter(m => m.score >= 75).length

  // Top matches: score >= 25, cap at 20 visible; lower: score < 25
  const topMatches   = sorted.filter(m => m.score >= 25).slice(0, 20)
  const lowerMatches = sorted.filter(m => m.score < 25)

  const savedByOppId = Object.fromEntries(saved.map(s => [s.opportunity_id, s]))

  // Save handlers
  const handleSave = useCallback(async (oppId: string) => {
    const res = await fetch('/api/funders/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity_id: oppId }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setToast({ msg: (j as { message?: string }).message ?? 'Failed to save', ok: false })
      return
    }
    const { data } = await res.json() as { data: SavedRow }
    const opp = funders.find(o => o.id === oppId)
    if (opp) setSaved(prev => [{ ...data, funder_opportunities: opp }, ...prev])
    setToast({ msg: 'Opportunity saved', ok: true })
  }, [funders])

  const handleUnsave = useCallback(async (savedId: string) => {
    const res = await fetch(`/api/funders/save/${savedId}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      setToast({ msg: 'Failed to remove', ok: false }); return
    }
    setSaved(prev => prev.filter(s => s.id !== savedId))
    setToast({ msg: 'Removed from saved', ok: true })
  }, [])

  // ── Tab styles ─────────────────────────────────────────────────────────────
  function tabStyle(id: string) {
    const active = tab === id
    return {
      padding: '10px 24px',
      fontSize: 14,
      fontWeight: active ? 700 : 400,
      color: active ? COLORS.gold : COLORS.stone,
      borderBottom: active ? `2px solid ${COLORS.gold}` : '2px solid transparent',
      marginBottom: -2,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: FONTS.body,
    } as React.CSSProperties
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
          Donor Matching
        </h1>
        <p style={{ fontSize: 13, color: COLORS.stone, margin: 0 }}>
          Ranked funder matches based on your organization profile.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.mist}40`, marginBottom: 28 }}>
        <button style={tabStyle('matches')} onClick={() => setTab('matches')}>
          Top Matches {above75 > 0 && (
            <span style={{ marginLeft: 6, background: '#38A16920', color: '#38A169', fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>
              {above75} high
            </span>
          )}
        </button>
        <button style={tabStyle('funders')} onClick={() => setTab('funders')}>
          All Funders
        </button>
        <button style={tabStyle('saved')} onClick={() => setTab('saved')}>
          Saved ({saved.length})
        </button>
      </div>

      {/* ── TOP MATCHES TAB ── */}
      {tab === 'matches' && (
        <>
          {!hasProfile ? (
            <NoProfilePrompt orgSlug={orgSlug} />
          ) : (
            <>
              {/* Completeness nudge */}
              {completeness.score < 80 && !dismissed && (
                <CompletenessNudge
                  score={completeness.score}
                  emptyFields={completeness.emptyFields}
                  orgSlug={orgSlug}
                  onDismiss={handleDismiss}
                />
              )}

              {/* Summary bar */}
              <MatchSummaryBar
                total={funders.length}
                above50={above50}
                above75={above75}
                completeness={completeness.score}
              />

              {/* Sort controls */}
              <SortControls sortBy={sortBy} onSort={setSortBy} />

              {/* Loading skeleton */}
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 220, background: COLORS.foam, borderRadius: 14, opacity: 0.6 }} />
                  ))}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div style={{ padding: 40, textAlign: 'center', color: COLORS.crimson }}>
                  <AlertCircle size={28} style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 14, margin: '0 0 16px' }}>{error}</p>
                  <button
                    onClick={() => { setError(null); setLoading(true); fetch('/api/funders?status=active&limit=100').then(r => r.json()).then(j => setFunders((j as { data: FunderOpportunity[] }).data ?? [])).catch(e => setError((e as Error).message)).finally(() => setLoading(false)) }}
                    style={{ padding: '9px 20px', background: COLORS.gold, color: COLORS.forest, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: FONTS.body, fontWeight: 700 }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Results */}
              {!loading && !error && (
                <>
                  {topMatches.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                      <Target size={40} style={{ color: COLORS.stone, marginBottom: 12 }} />
                      <p style={{ fontSize: 15, color: COLORS.stone, margin: '0 0 8px' }}>
                        No strong matches found yet.
                      </p>
                      <p style={{ fontSize: 13, color: COLORS.stone, margin: 0 }}>
                        Complete your profile tags or browse all funders to discover opportunities.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {topMatches.map(({ opp, score, explanation }) => {
                        const sr = savedByOppId[opp.id]
                        return (
                          <MatchCard
                            key={opp.id}
                            opp={opp}
                            score={score}
                            explanation={explanation}
                            savedId={sr?.id}
                            savedStatus={sr?.status}
                            onSave={handleSave}
                            onUnsave={handleUnsave}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Lower matches section */}
                  {lowerMatches.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                      <button
                        onClick={() => setShowLower(s => !s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          width: '100%', padding: '12px 16px', borderRadius: 10,
                          background: COLORS.foam, color: COLORS.stone,
                          border: `1px solid ${COLORS.mist}40`,
                          cursor: 'pointer', fontFamily: FONTS.body, fontSize: 13, fontWeight: 600,
                          marginBottom: showLower ? 16 : 0,
                        }}
                      >
                        {showLower ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showLower ? 'Hide' : 'Show'} {lowerMatches.length} lower matches (score below 25)
                      </button>
                      {showLower && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {lowerMatches.map(({ opp, score, explanation }) => {
                            const sr = savedByOppId[opp.id]
                            return (
                              <MatchCard
                                key={opp.id}
                                opp={opp}
                                score={score}
                                explanation={explanation}
                                savedId={sr?.id}
                                savedStatus={sr?.status}
                                onSave={handleSave}
                                onUnsave={handleUnsave}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── ALL FUNDERS TAB ── */}
      {tab === 'funders' && (
        <FundersClient
          orgSlug={orgSlug}
          orgId={orgId}
          ngoProfile={ngoProfile}
          initialSaved={saved}
          defaultTab="feed"
        />
      )}

      {/* ── SAVED TAB ── */}
      {tab === 'saved' && (
        <FundersClient
          orgSlug={orgSlug}
          orgId={orgId}
          ngoProfile={ngoProfile}
          initialSaved={saved}
          defaultTab="saved"
        />
      )}
    </div>
  )
}
