'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bookmark, BookmarkCheck, ExternalLink, AlertCircle, X, ChevronDown } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { computeMatchScore } from '@/lib/funder-match'
import type { SavedRow, FunderOpportunity } from './page'

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
}

const FOCUS_OPTIONS   = ['health','education','WASH','food security','livelihoods','protection','gender','climate','governance']
const GEO_OPTIONS     = ['Sub-Saharan Africa','West Africa','East Africa','Southern Africa','North Africa','Southeast Asia','South Asia','Latin America','Middle East','Global']
const BUDGET_LABELS: Record<string, string> = {
  under_100k: 'Under $100K', '100k_500k': '$100K–$500K',
  '500k_1m': '$500K–$1M', '1m_5m': '$1M–$5M', above_5m: 'Above $5M',
}

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

function deadlineUrgency(deadline: string | null): 'normal' | 'amber' | 'red' {
  if (!deadline) return 'normal'
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days <= 14) return 'red'
  if (days <= 30) return 'amber'
  return 'normal'
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Rolling'
  return new Date(deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onDone }: { msg: string; ok: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 300,
      background: ok ? COLORS.forest : COLORS.crimson,
      color: '#fff', padding: '12px 20px', borderRadius: 10,
      fontSize: 14, fontWeight: 500, boxShadow: SHADOW.toast,
    }}>
      {msg}
    </div>
  )
}

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: highlight ? `${COLORS.gold}22` : COLORS.foam,
      color: highlight ? COLORS.forest : COLORS.slate,
      border: `1px solid ${highlight ? COLORS.gold : COLORS.mist}40`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── FunderCard ────────────────────────────────────────────────────────────────

function FunderCard({
  opp, ngoProfile, savedId, savedStatus, onSave, onUnsave,
}: {
  opp:         FunderOpportunity
  ngoProfile:  NgoProfile
  savedId?:    string
  savedStatus?: 'saved' | 'applied' | 'declined'
  onSave:      (oppId: string) => Promise<void>
  onUnsave:    (savedId: string) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const match    = computeMatchScore(ngoProfile, opp)
  const urgency  = deadlineUrgency(opp.application_deadline)
  const isSaved  = !!savedId

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
      background: '#ffffff',
      border: `1px solid ${COLORS.mist}`,
      borderRadius: 14,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            {opp.funder_name}
          </p>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, margin: 0, lineHeight: 1.4 }}>
            {opp.opportunity_title}
          </h3>
        </div>
        {/* Match score badge */}
        <div style={{
          flexShrink: 0, textAlign: 'center',
          background: match.score >= 60 ? `${COLORS.sage}20` : COLORS.foam,
          border: `1px solid ${match.score >= 60 ? COLORS.sage : COLORS.mist}60`,
          borderRadius: 10, padding: '6px 12px',
          minWidth: 56,
        }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: match.score >= 60 ? COLORS.forest : COLORS.slate, margin: 0 }}>
            {match.score}
          </p>
          <p style={{ fontSize: 10, color: COLORS.stone, margin: 0 }}>match</p>
        </div>
      </div>

      {/* Funding range + deadline */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '0 0 2px' }}>Funding</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, margin: 0 }}>
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

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {opp.focus_areas.map(f => (
          <Pill key={f} label={f} highlight={ngoProfile.focus_areas.includes(f)} />
        ))}
        {opp.eligible_geographies.map(g => (
          <Pill key={g} label={g} highlight={ngoProfile.eligible_geographies.includes(g)} />
        ))}
      </div>

      {/* Match summary */}
      <p style={{ fontSize: 12, color: COLORS.stone, margin: 0, fontStyle: 'italic' }}>
        {match.summary}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: isSaved ? `${COLORS.sage}20` : COLORS.foam,
            color: isSaved ? COLORS.forest : COLORS.slate,
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
              background: COLORS.forest, color: '#ffffff',
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

// ── SavedCard ─────────────────────────────────────────────────────────────────

function SavedCard({
  row, ngoProfile, onStatusChange, onNotesChange, onRemove,
}: {
  row:            SavedRow
  ngoProfile:     NgoProfile
  onStatusChange: (id: string, status: 'saved' | 'applied' | 'declined') => Promise<void>
  onNotesChange:  (id: string, notes: string) => Promise<void>
  onRemove:       (id: string) => void
}) {
  const opp     = row.funder_opportunities
  const match   = computeMatchScore(ngoProfile, opp)
  const urgency = deadlineUrgency(opp.application_deadline)
  const deadlineColor =
    urgency === 'red'   ? COLORS.crimson :
    urgency === 'amber' ? '#F59E0B'       :
    COLORS.stone

  const [notes,    setNotes]    = useState(row.notes ?? '')
  const [savingStatus, setSavingStatus] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleNotesBlur() {
    if (notesTimer.current) clearTimeout(notesTimer.current)
    onNotesChange(row.id, notes)
  }

  async function handleStatus(s: 'saved' | 'applied' | 'declined') {
    setSavingStatus(true)
    try { await onStatusChange(row.id, s) }
    finally { setSavingStatus(false) }
  }

  return (
    <div style={{
      background: '#ffffff', border: `1px solid ${COLORS.mist}`,
      borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>
            {opp.funder_name}
          </p>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest, margin: 0, lineHeight: 1.4 }}>
            {opp.opportunity_title}
          </h3>
        </div>
        <button
          onClick={() => onRemove(row.id)}
          style={{ color: COLORS.stone, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          title="Remove from saved"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <span style={{ fontSize: 13, color: COLORS.slate }}>
          {fundingRange(opp.funding_range_min, opp.funding_range_max)}
        </span>
        <span style={{ fontSize: 13, color: deadlineColor }}>
          {formatDeadline(opp.application_deadline)}
        </span>
        <span style={{ fontSize: 12, color: COLORS.stone, fontStyle: 'italic' }}>
          {match.summary}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {opp.focus_areas.map(f => <Pill key={f} label={f} highlight={ngoProfile.focus_areas.includes(f)} />)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: COLORS.stone }}>Status:</span>
        {(['saved','applied','declined'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleStatus(s)}
            disabled={savingStatus}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: row.status === s ? COLORS.forest : COLORS.foam,
              color: row.status === s ? '#fff' : COLORS.slate,
              border: `1px solid ${row.status === s ? COLORS.forest : COLORS.mist}`,
              cursor: savingStatus ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
        {opp.external_link && (
          <a
            href={opp.external_link} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto',
              fontSize: 12, color: COLORS.sky, textDecoration: 'none', fontFamily: FONTS.body,
            }}
          >
            <ExternalLink size={12} /> Apply
          </a>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, color: COLORS.stone, display: 'block', marginBottom: 4 }}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={2}
          placeholder="Add notes about this opportunity…"
          style={{
            width: '100%', padding: '8px 10px', fontSize: 13,
            border: `1px solid ${COLORS.mist}`, borderRadius: 8,
            background: COLORS.foam, color: COLORS.ink, fontFamily: FONTS.body,
            resize: 'vertical', boxSizing: 'border-box', outline: 'none',
          }}
        />
      </div>

      <p style={{ fontSize: 11, color: COLORS.stone, margin: 0 }}>
        Saved {new Date(row.saved_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}

// ── Remove confirmation modal ─────────────────────────────────────────────────

function RemoveConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{ background: '#1A2B4A', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', boxShadow: SHADOW.modal }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle size={18} style={{ color: COLORS.crimson }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Remove from saved?</h3>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
          This opportunity will be removed from your saved list. Any notes will be lost.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px 0', background: 'transparent', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '10px 0', background: COLORS.crimson, color: '#fff',
            border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
          }}>Remove</button>
        </div>
      </div>
    </div>
  )
}

// ── FundersClient (main) ──────────────────────────────────────────────────────

export default function FundersClient({ orgSlug, orgId: _orgId, ngoProfile, initialSaved }: Props) {
  const router = useRouter()

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'feed' | 'saved'>('feed')

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  function showToast(msg: string, ok = true) { setToast({ msg, ok }) }

  // ── Feed state ────────────────────────────────────────────────────────────
  const [feedOpps,    setFeedOpps]    = useState<FunderOpportunity[]>([])
  const [feedLoading, setFeedLoading] = useState(true)
  const [feedError,   setFeedError]   = useState<string | null>(null)
  const [total,       setTotal]       = useState(0)
  const [offset,      setOffset]      = useState(0)
  const LIMIT = 20

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [filterFocus, setFilterFocus] = useState('')
  const [filterGeo,   setFilterGeo]   = useState('')
  const [filterDead,  setFilterDead]  = useState('')   // '30' | '14' | ''

  // ── Saved state ───────────────────────────────────────────────────────────
  const [saved, setSaved] = useState<SavedRow[]>(initialSaved)

  // map opportunityId -> savedRow for fast lookup
  const savedByOppId = Object.fromEntries(saved.map(s => [s.opportunity_id, s]))

  // ── Remove modal ──────────────────────────────────────────────────────────
  const [removeTarget, setRemoveTarget] = useState<string | null>(null) // savedId

  const hasProfile = ngoProfile.focus_areas.length > 0 ||
    ngoProfile.eligible_geographies.length > 0 ||
    ngoProfile.program_types.length > 0

  // ── Fetch feed ────────────────────────────────────────────────────────────
  const fetchFeed = useCallback(async (newOffset: number, append: boolean) => {
    setFeedLoading(true)
    setFeedError(null)
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), offset: String(newOffset), status: 'active' })
      if (search)      p.set('search',   search)
      if (filterFocus) p.set('focus_area', filterFocus)
      if (filterGeo)   p.set('geography',  filterGeo)
      if (filterDead) {
        const d = new Date()
        d.setDate(d.getDate() + parseInt(filterDead))
        p.set('deadline_to', d.toISOString().slice(0, 10))
      }
      const res = await fetch(`/api/funders?${p}`)
      if (!res.ok) throw new Error('Failed to load funders')
      const json = await res.json() as { data: FunderOpportunity[]; count: number }
      setTotal(json.count)
      setFeedOpps(prev => append ? [...prev, ...json.data] : json.data)
      setOffset(newOffset)
    } catch (e) {
      setFeedError((e as Error).message)
    } finally {
      setFeedLoading(false)
    }
  }, [search, filterFocus, filterGeo, filterDead])

  // Initial load and filter changes reset to page 0
  useEffect(() => {
    fetchFeed(0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterFocus, filterGeo, filterDead])

  // ── Sort feed by match score then deadline ────────────────────────────────
  const sortedOpps = [...feedOpps].sort((a, b) => {
    const sa = computeMatchScore(ngoProfile, a).score
    const sb = computeMatchScore(ngoProfile, b).score
    if (sb !== sa) return sb - sa
    // then by deadline proximity
    const da = a.application_deadline ? new Date(a.application_deadline).getTime() : Infinity
    const db = b.application_deadline ? new Date(b.application_deadline).getTime() : Infinity
    return da - db
  })

  // ── Save / Unsave ─────────────────────────────────────────────────────────
  async function handleSave(oppId: string) {
    const res = await fetch('/api/funders/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunity_id: oppId }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      showToast((j as { message?: string }).message ?? 'Failed to save', false)
      return
    }
    const { data } = await res.json() as { data: SavedRow }
    // The join isn't returned — find the opp from feed
    const opp = feedOpps.find(o => o.id === oppId)
    if (opp) {
      setSaved(prev => [{ ...data, funder_opportunities: opp }, ...prev])
    }
    showToast('Opportunity saved')
  }

  async function handleUnsave(savedId: string) {
    const res = await fetch(`/api/funders/save/${savedId}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      showToast('Failed to remove', false); return
    }
    setSaved(prev => prev.filter(s => s.id !== savedId))
    showToast('Removed from saved')
  }

  function handleRemoveRequest(savedId: string) { setRemoveTarget(savedId) }
  async function handleRemoveConfirm() {
    if (!removeTarget) return
    await handleUnsave(removeTarget)
    setRemoveTarget(null)
  }

  async function handleStatusChange(savedId: string, status: 'saved' | 'applied' | 'declined') {
    const res = await fetch(`/api/funders/save/${savedId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { showToast('Failed to update status', false); return }
    setSaved(prev => prev.map(s => s.id === savedId ? { ...s, status } : s))
  }

  async function handleNotesChange(savedId: string, notes: string) {
    await fetch(`/api/funders/save/${savedId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaved(prev => prev.map(s => s.id === savedId ? { ...s, notes } : s))
  }

  // ── Saved grouped by status ───────────────────────────────────────────────
  const savedGrouped = {
    saved:    saved.filter(s => s.status === 'saved'),
    applied:  saved.filter(s => s.status === 'applied'),
    declined: saved.filter(s => s.status === 'declined'),
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}
      {removeTarget && (
        <RemoveConfirmModal
          onConfirm={handleRemoveConfirm}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.forest, margin: '0 0 4px' }}>
          Funding
        </h1>
        <p style={{ fontSize: 13, color: COLORS.stone, margin: 0 }}>
          Discover grants and track applications for your organization.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.mist}`, marginBottom: 28 }}>
        {(['feed', 'saved'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? COLORS.forest : COLORS.stone,
              borderBottom: tab === t ? `2px solid ${COLORS.forest}` : '2px solid transparent',
              marginBottom: -2, background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            {t === 'feed' ? 'Funder Feed' : `Saved (${saved.length})`}
          </button>
        ))}
      </div>

      {/* ── FEED TAB ── */}
      {tab === 'feed' && (
        <div>
          {/* Profile tags prompt or match banner */}
          {!hasProfile ? (
            <div style={{
              padding: '16px 20px', borderRadius: 12, marginBottom: 24,
              background: '#FFF8E1', border: '1px solid #FFD54F60',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#795548', margin: '0 0 4px' }}>
                  Complete your profile tags to unlock funder matching
                </p>
                <p style={{ fontSize: 13, color: '#8D6E63', margin: 0 }}>
                  Add your focus areas, geographies, and budget range so we can match you to the best opportunities.
                </p>
              </div>
              <a
                href={`/org/${orgSlug}/settings`}
                style={{
                  padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: COLORS.forest, color: '#fff', textDecoration: 'none',
                  fontFamily: FONTS.body, flexShrink: 0,
                }}
              >
                Go to Settings →
              </a>
            </div>
          ) : (
            <div style={{
              padding: '12px 18px', borderRadius: 10, marginBottom: 24,
              background: `${COLORS.sage}12`, border: `1px solid ${COLORS.sage}40`,
            }}>
              <p style={{ fontSize: 13, color: COLORS.forest, margin: 0 }}>
                Showing <strong>{total}</strong> active {total === 1 ? 'opportunity' : 'opportunities'} matched to your profile
                {ngoProfile.focus_areas.length > 0 && ` · ${ngoProfile.focus_areas.join(', ')}`}
              </p>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.stone }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search funders & titles…"
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                  border: `1px solid ${COLORS.mist}`, borderRadius: 9, fontSize: 13,
                  color: COLORS.ink, background: '#fff', outline: 'none',
                  boxSizing: 'border-box', fontFamily: FONTS.body,
                }}
              />
            </div>

            <FilterSelect value={filterFocus} onChange={setFilterFocus} placeholder="Focus Area" options={FOCUS_OPTIONS} />
            <FilterSelect value={filterGeo}   onChange={setFilterGeo}   placeholder="Geography"  options={GEO_OPTIONS} />
            <FilterSelect
              value={filterDead} onChange={setFilterDead} placeholder="Deadline"
              options={[{ value: '14', label: 'Next 14 days' }, { value: '30', label: 'Next 30 days' }, { value: '90', label: 'Next 90 days' }]}
            />

            {(search || filterFocus || filterGeo || filterDead) && (
              <button
                onClick={() => { setSearch(''); setFilterFocus(''); setFilterGeo(''); setFilterDead('') }}
                style={{
                  padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  background: COLORS.foam, color: COLORS.stone, border: `1px solid ${COLORS.mist}`,
                  cursor: 'pointer', fontFamily: FONTS.body, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          {/* Feed content */}
          {feedLoading && feedOpps.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 180, background: COLORS.foam, borderRadius: 14, animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : feedError ? (
            <div style={{ padding: 40, textAlign: 'center', color: COLORS.crimson }}>
              <AlertCircle size={28} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 14, margin: 0 }}>{feedError}</p>
              <button
                onClick={() => fetchFeed(0, false)}
                style={{ marginTop: 16, padding: '9px 20px', background: COLORS.forest, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: FONTS.body }}
              >
                Retry
              </button>
            </div>
          ) : sortedOpps.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: COLORS.stone, margin: 0 }}>No opportunities match your current filters.</p>
              <button
                onClick={() => { setSearch(''); setFilterFocus(''); setFilterGeo(''); setFilterDead('') }}
                style={{ marginTop: 12, fontSize: 13, color: COLORS.sky, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {sortedOpps.map(opp => {
                  const sr = savedByOppId[opp.id]
                  return (
                    <FunderCard
                      key={opp.id}
                      opp={opp}
                      ngoProfile={ngoProfile}
                      savedId={sr?.id}
                      savedStatus={sr?.status}
                      onSave={handleSave}
                      onUnsave={handleUnsave}
                    />
                  )
                })}
              </div>

              {/* Load more */}
              {offset + LIMIT < total && (
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <button
                    onClick={() => fetchFeed(offset + LIMIT, true)}
                    disabled={feedLoading}
                    style={{
                      padding: '10px 28px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                      background: COLORS.foam, color: COLORS.forest, border: `1px solid ${COLORS.mist}`,
                      cursor: feedLoading ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <ChevronDown size={16} />
                    {feedLoading ? 'Loading…' : `Load more (${total - offset - LIMIT} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SAVED TAB ── */}
      {tab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Bookmark size={32} style={{ color: COLORS.mist, marginBottom: 12 }} />
              <p style={{ fontSize: 15, color: COLORS.stone, margin: 0 }}>
                No saved opportunities yet. Browse the feed and save ones that interest you.
              </p>
              <button
                onClick={() => setTab('feed')}
                style={{ marginTop: 16, padding: '9px 22px', background: COLORS.forest, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: FONTS.body, fontWeight: 600 }}
              >
                Browse feed
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {(['saved', 'applied', 'declined'] as const).map(status => {
                const group = savedGrouped[status]
                if (group.length === 0) return null
                return (
                  <section key={status}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.stone, margin: '0 0 14px' }}>
                      {status === 'saved' ? 'Saved' : status === 'applied' ? 'Applied' : 'Declined'} ({group.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {group.map(row => (
                        <SavedCard
                          key={row.id}
                          row={row}
                          ngoProfile={ngoProfile}
                          onStatusChange={handleStatusChange}
                          onNotesChange={handleNotesChange}
                          onRemove={handleRemoveRequest}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── FilterSelect ──────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, placeholder, options,
}: {
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  options:     string[] | { value: string; label: string }[]
}) {
  const isObj = options.length > 0 && typeof options[0] === 'object'
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '9px 32px 9px 12px', border: `1px solid ${value ? COLORS.forest : COLORS.mist}`,
          borderRadius: 9, fontSize: 13, color: value ? COLORS.forest : COLORS.stone,
          background: value ? `${COLORS.forest}08` : '#fff', outline: 'none',
          appearance: 'none', cursor: 'pointer', fontFamily: FONTS.body, fontWeight: value ? 600 : 400,
        }}
      >
        <option value="">{placeholder}</option>
        {(options as ({ value: string; label: string } | string)[]).map(opt => {
          const v = isObj ? (opt as { value: string; label: string }).value : opt as string
          const l = isObj ? (opt as { value: string; label: string }).label : opt as string
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.stone, pointerEvents: 'none' }} />
    </div>
  )
}
