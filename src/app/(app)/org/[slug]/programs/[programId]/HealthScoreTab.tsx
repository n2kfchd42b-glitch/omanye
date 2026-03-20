'use client'

// ── Program Health Score Tab ───────────────────────────────────────────────────
// Displays the latest health score for a program with dimension breakdown,
// score factors, trend sparkline, and (admin-only) cadence configuration +
// recalculate trigger.

import React, { useState, useEffect, useTransition } from 'react'
import { Heart, RefreshCw, TrendingUp, Settings2 } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { updateProgram } from '@/app/actions/programs'
import type { Program } from '@/lib/programs'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthScore {
  id:                   string
  composite_score:      number
  budget_score:         number
  indicator_score:      number
  field_activity_score: number
  rag_status:           'green' | 'amber' | 'red'
  score_factors:        string[]
  calculated_at:        string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<string, string> = {
  green: '#38A169',
  amber: '#D4AF5C',
  red:   '#E53E3E',
}

const RAG_LABELS: Record<string, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red:   'Critical',
}

// ── Main tab ──────────────────────────────────────────────────────────────────

interface Props {
  programId: string
  program:   Program
  isAdmin:   boolean
}

export default function HealthScoreTab({ programId, program, isAdmin }: Props) {
  const [scores,    setScores]    = useState<HealthScore[]>([])
  const [loading,   setLoading]   = useState(true)
  const [recalcing, setRecalcing] = useState(false)
  const [recalcDone, setRecalcDone] = useState(false)

  const latest = scores[0] ?? null

  const fetchScores = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('program_health_scores')
      .select('id, composite_score, budget_score, indicator_score, field_activity_score, rag_status, score_factors, calculated_at')
      .eq('program_id', programId)
      .order('calculated_at', { ascending: false })
      .limit(10)
    setScores((data ?? []) as HealthScore[])
  }

  useEffect(() => {
    fetchScores().finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])

  const handleRecalc = async () => {
    setRecalcing(true)
    try {
      await fetch('/api/health/recalculate', { method: 'POST' })
      await fetchScores()
      setRecalcDone(true)
      setTimeout(() => setRecalcDone(false), 4000)
    } finally {
      setRecalcing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: COLORS.stone, fontFamily: FONTS.body }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }}>

      {/* ── Current score card ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Heart size={15} style={{ color: COLORS.crimson }} />
            <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest }}>
              Program Health
            </h3>
          </div>
          {isAdmin && (
            <button
              onClick={handleRecalc}
              disabled={recalcing}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                border: `1px solid ${COLORS.mist}`, background: COLORS.foam,
                color: recalcDone ? '#38A169' : COLORS.slate,
                cursor: recalcing ? 'not-allowed' : 'pointer',
                opacity: recalcing ? 0.6 : 1, transition: 'color 0.2s',
                fontFamily: FONTS.body,
              }}
            >
              <RefreshCw size={11} style={{ animation: recalcing ? 'spin 1s linear infinite' : 'none' }} />
              {recalcDone ? 'Recalculated' : 'Recalculate'}
            </button>
          )}
        </div>

        {latest == null ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.stone, fontSize: 13, fontFamily: FONTS.body }}>
            No health score yet.{isAdmin && ' Click Recalculate to compute the first score.'}
          </div>
        ) : (
          <>
            {/* Score circle + RAG label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `5px solid ${RAG_COLORS[latest.rag_status] ?? COLORS.mist}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: RAG_COLORS[latest.rag_status], lineHeight: 1 }}>
                  {latest.composite_score}
                </span>
                <span style={{ fontSize: 9, color: COLORS.stone, marginTop: 2 }}>/100</span>
              </div>
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 12,
                  background: (RAG_COLORS[latest.rag_status] ?? COLORS.mist) + '18',
                  marginBottom: 8,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: RAG_COLORS[latest.rag_status], display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: RAG_COLORS[latest.rag_status] }}>
                    {RAG_LABELS[latest.rag_status] ?? latest.rag_status}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: COLORS.stone, fontFamily: FONTS.body }}>
                  Last calculated:{' '}
                  {new Date(latest.calculated_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Dimension breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <DimensionBar label="Budget health"    score={latest.budget_score}         max={33} />
              <DimensionBar label="Indicator health" score={latest.indicator_score}      max={33} />
              <DimensionBar label="Field activity"   score={latest.field_activity_score} max={33} />
            </div>

            {/* Score factors */}
            {latest.score_factors.length > 0 && (
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 700, color: COLORS.stone,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  marginBottom: 8, fontFamily: FONTS.body,
                }}>
                  Score factors
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {latest.score_factors.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: COLORS.charcoal, fontFamily: FONTS.body }}>
                      <span style={{ color: COLORS.stone, flexShrink: 0, marginTop: 1 }}>·</span>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Trend sparkline ─────────────────────────────────────────────────── */}
      {scores.length > 1 && (
        <div className="card" style={{ padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <TrendingUp size={13} style={{ color: COLORS.fern }} />
            <h4 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 600, color: COLORS.forest }}>
              Score Trend
            </h4>
          </div>
          <ScoreTrendChart scores={[...scores].reverse()} />
        </div>
      )}

      {/* ── Cadence config (admin only) ──────────────────────────────────────── */}
      {isAdmin && (
        <CadenceConfig
          programId={programId}
          initialCadence={program.expected_submission_cadence_per_week ?? null}
        />
      )}
    </div>
  )
}

// ── Dimension bar ──────────────────────────────────────────────────────────────

function DimensionBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct      = Math.round((score / max) * 100)
  const barColor = pct >= 75 ? '#38A169' : pct >= 50 ? '#D4AF5C' : '#E53E3E'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, fontFamily: FONTS.body }}>
        <span style={{ color: COLORS.charcoal }}>{label}</span>
        <span style={{ color: barColor, fontWeight: 700 }}>
          {score}<span style={{ color: COLORS.stone, fontWeight: 400 }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 4, background: COLORS.mist }}>
        <div style={{ height: 7, borderRadius: 4, width: `${pct}%`, background: barColor, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

// ── Score trend sparkline ──────────────────────────────────────────────────────

function ScoreTrendChart({ scores }: { scores: HealthScore[] }) {
  const W = 560, H = 64, PAD = 8
  const n = scores.length
  if (n < 2) return null

  const pts = scores.map((s, i) => ({
    x:     PAD + (i / (n - 1)) * (W - PAD * 2),
    y:     H - PAD - (s.composite_score / 100) * (H - PAD * 2),
    score: s.composite_score,
    rag:   s.rag_status,
    date:  s.calculated_at,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        {/* Reference lines at 75 (green threshold) and 50 (amber threshold) */}
        {[75, 50].map(v => {
          const y = H - PAD - (v / 100) * (H - PAD * 2)
          return (
            <g key={v}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke={COLORS.mist} strokeWidth={0.75} strokeDasharray="4 3" />
              <text x={W - PAD + 4} y={y + 3} fontSize={8} fill={COLORS.stone}>{v}</text>
            </g>
          )
        })}
        <polyline
          points={polyline}
          fill="none"
          stroke={COLORS.fern}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={4}
            fill={RAG_COLORS[p.rag] ?? COLORS.stone}
            stroke={COLORS.forest} strokeWidth={1.5}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.stone, marginTop: 4, fontFamily: FONTS.body }}>
        <span>
          {new Date(scores[0].calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span>
          {new Date(scores[scores.length - 1].calculated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

// ── Cadence config ─────────────────────────────────────────────────────────────

function CadenceConfig({
  programId, initialCadence,
}: {
  programId:      string
  initialCadence: number | null
}) {
  const [editing,    setEditing]    = useState(false)
  const [cadence,    setCadence]    = useState(String(initialCadence ?? 2))
  const [displayed,  setDisplayed]  = useState(initialCadence ?? 2)
  const [isPending, startTransition] = useTransition()
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updateProgram(programId, {
        expected_submission_cadence_per_week: cadence ? parseFloat(cadence) : 2,
      })
      if (res.error) { setError(res.error); return }
      setDisplayed(cadence ? parseFloat(cadence) : 2)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Settings2 size={13} style={{ color: COLORS.stone }} />
          <h4 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 600, color: COLORS.forest }}>
            Health Settings
          </h4>
        </div>
        {saved && <span style={{ fontSize: 12, color: '#38A169', fontFamily: FONTS.body }}>Saved!</span>}
      </div>
      <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 14, lineHeight: 1.6, fontFamily: FONTS.body }}>
        Expected field submissions per week — used to score field activity health.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              step={0.5}
              value={cadence}
              onChange={e => setCadence(e.target.value)}
              autoFocus
              style={{
                width: 80, padding: '5px 10px', borderRadius: 7,
                border: `1px solid ${COLORS.mist}`, background: '#1A2B4A',
                fontSize: 13, color: COLORS.charcoal, fontFamily: FONTS.body,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{
                padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                background: COLORS.moss, color: '#fff', border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.body, opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '5px 10px', borderRadius: 7, fontSize: 12,
                background: 'transparent', border: `1px solid ${COLORS.mist}`,
                color: COLORS.slate, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.charcoal, fontFamily: FONTS.body }}>
              {displayed}
            </span>
            <span style={{ fontSize: 12, color: COLORS.stone, fontFamily: FONTS.body }}>
              per week
            </span>
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
                color: COLORS.slate, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Edit
            </button>
          </>
        )}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: COLORS.crimson, marginTop: 10, fontFamily: FONTS.body }}>{error}</p>
      )}
    </div>
  )
}
