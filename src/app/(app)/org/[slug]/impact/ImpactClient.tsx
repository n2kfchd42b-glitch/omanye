'use client'

import React, { useState } from 'react'
import { TrendingUp, AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { IMPACT_FOCUS_AREAS, IMPACT_GEOGRAPHY_REGIONS } from '@/lib/impact/benchmarks'
import type { ImpactResult } from '@/lib/impact/calculator'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EstimateRecord {
  id:                      string
  program_type:            string
  geography_region:        string
  total_budget:            number
  currency:                string
  duration_months:         number
  target_beneficiary_count?: number
  notes?:                  string
  results:                 ImpactResult
  confidence_level:        'high' | 'moderate'
  created_at:              string
}

interface Props {
  orgSlug:          string
  orgId:            string
  orgName:          string
  userId:           string
  initialEstimates: unknown[]
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'GHS', 'NGN', 'ZAR', 'UGX', 'TZS']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: `1px solid ${COLORS.mist}`, borderRadius: 8,
  fontSize: 14, color: COLORS.charcoal, background: COLORS.pearl,
  outline: 'none', boxSizing: 'border-box', fontFamily: FONTS.body,
}

// ── ImpactClient ──────────────────────────────────────────────────────────────

export default function ImpactClient({ orgSlug, orgId, orgName, userId, initialEstimates }: Props) {
  const [programType,      setProgramType]      = useState('')
  const [geographyRegion,  setGeographyRegion]  = useState('')
  const [totalBudget,      setTotalBudget]       = useState('')
  const [currency,         setCurrency]          = useState('USD')
  const [durationMonths,   setDurationMonths]    = useState('')
  const [targetCount,      setTargetCount]       = useState('')
  const [notes,            setNotes]             = useState('')
  const [errors,           setErrors]            = useState<Record<string, string>>({})
  const [loading,          setLoading]           = useState(false)
  const [result,           setResult]            = useState<ImpactResult | null>(null)
  const [estimates,        setEstimates]         = useState<EstimateRecord[]>(initialEstimates as EstimateRecord[])

  // Prevent unused variable warnings
  void orgSlug; void orgName; void userId

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!programType)                             e.programType = 'Select a program type'
    if (!geographyRegion)                         e.geographyRegion = 'Select a geography'
    if (!totalBudget || Number(totalBudget) <= 0) e.totalBudget = 'Enter a valid budget'
    if (!durationMonths || Number(durationMonths) <= 0)
                                                  e.durationMonths = 'Enter program duration in months'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleEstimate() {
    if (!validate()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/impact/estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          organization_id:         orgId,
          program_type:            programType,
          geography_region:        geographyRegion,
          total_budget:            Number(totalBudget),
          currency,
          duration_months:         Number(durationMonths),
          target_beneficiary_count: targetCount ? Number(targetCount) : undefined,
          notes:                    notes || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrors({ _form: (j as { message?: string }).message ?? 'Estimate failed' })
        return
      }
      const j = await res.json() as { result: ImpactResult; estimate: EstimateRecord }
      setResult(j.result)
      setEstimates(prev => [j.estimate, ...prev].slice(0, 5))
    } catch {
      setErrors({ _form: 'Request failed — please try again' })
    } finally {
      setLoading(false)
    }
  }

  function loadEstimate(est: EstimateRecord) {
    setProgramType(est.program_type)
    setGeographyRegion(est.geography_region)
    setTotalBudget(String(est.total_budget))
    setCurrency(est.currency)
    setDurationMonths(String(est.duration_months))
    setTargetCount(est.target_beneficiary_count ? String(est.target_beneficiary_count) : '')
    setNotes(est.notes ?? '')
    setResult(est.results)
    setErrors({})
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <TrendingUp size={22} style={{ color: COLORS.gold }} />
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.charcoal, margin: 0 }}>
            Impact Estimator
          </h1>
        </div>
        <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>
          Estimate program reach and cost efficiency from sector benchmarks. No AI — fully deterministic.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── Left: Input Form ── */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{
            background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
            borderRadius: 14, padding: '24px 28px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, margin: '0 0 20px' }}>
              Program Parameters
            </p>

            {errors._form && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: '#3A1A1A', border: `1px solid ${COLORS.crimson}40`,
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.crimson,
              }}>
                <AlertCircle size={14} /> {errors._form}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Program Type */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Program Type <span style={{ color: COLORS.crimson }}>*</span>
                </label>
                <select
                  value={programType}
                  onChange={e => { setProgramType(e.target.value); setErrors(p => { const n={...p}; delete n.programType; return n }) }}
                  style={{ ...inputStyle, borderColor: errors.programType ? COLORS.crimson : COLORS.mist }}
                >
                  <option value="">Select type…</option>
                  {IMPACT_FOCUS_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.programType && <p style={{ fontSize: 11, color: COLORS.crimson, marginTop: 3 }}>{errors.programType}</p>}
              </div>

              {/* Geography */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Target Geography <span style={{ color: COLORS.crimson }}>*</span>
                </label>
                <select
                  value={geographyRegion}
                  onChange={e => { setGeographyRegion(e.target.value); setErrors(p => { const n={...p}; delete n.geographyRegion; return n }) }}
                  style={{ ...inputStyle, borderColor: errors.geographyRegion ? COLORS.crimson : COLORS.mist }}
                >
                  <option value="">Select region…</option>
                  {IMPACT_GEOGRAPHY_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.geographyRegion && <p style={{ fontSize: 11, color: COLORS.crimson, marginTop: 3 }}>{errors.geographyRegion}</p>}
              </div>

              {/* Total Budget */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Total Program Budget <span style={{ color: COLORS.crimson }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    style={{ ...inputStyle, width: 86, flexShrink: 0 }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number" min={0}
                    value={totalBudget}
                    onChange={e => { setTotalBudget(e.target.value); setErrors(p => { const n={...p}; delete n.totalBudget; return n }) }}
                    placeholder="e.g. 200000"
                    style={{ ...inputStyle, flex: 1, borderColor: errors.totalBudget ? COLORS.crimson : COLORS.mist }}
                  />
                </div>
                {errors.totalBudget && <p style={{ fontSize: 11, color: COLORS.crimson, marginTop: 3 }}>{errors.totalBudget}</p>}
              </div>

              {/* Duration */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Program Duration (months) <span style={{ color: COLORS.crimson }}>*</span>
                </label>
                <input
                  type="number" min={1}
                  value={durationMonths}
                  onChange={e => { setDurationMonths(e.target.value); setErrors(p => { const n={...p}; delete n.durationMonths; return n }) }}
                  placeholder="e.g. 24"
                  style={{ ...inputStyle, borderColor: errors.durationMonths ? COLORS.crimson : COLORS.mist }}
                />
                {errors.durationMonths && <p style={{ fontSize: 11, color: COLORS.crimson, marginTop: 3 }}>{errors.durationMonths}</p>}
              </div>

              {/* Target Beneficiaries (optional) */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Target Beneficiary Count
                  <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.stone, marginLeft: 6 }}>optional</span>
                </label>
                <input
                  type="number" min={0}
                  value={targetCount}
                  onChange={e => setTargetCount(e.target.value)}
                  placeholder="e.g. 5000"
                  style={inputStyle}
                />
              </div>

              {/* Notes (optional) */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
                  Internal Notes
                  <span style={{ fontSize: 11, fontWeight: 400, color: COLORS.stone, marginLeft: 6 }}>optional</span>
                </label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Q1 planning estimate"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              onClick={handleEstimate}
              disabled={loading}
              style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 26px',
                background: loading ? COLORS.foam : `linear-gradient(135deg, ${COLORS.forest}, #1A3A5C)`,
                color: loading ? COLORS.stone : COLORS.gold,
                border: `1px solid ${COLORS.gold}30`, borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.body, boxShadow: '0 4px 16px rgba(212,175,92,0.15)',
              }}
            >
              {loading
                ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Calculating…</>
                : <><TrendingUp size={14} /> Calculate Impact</>
              }
            </button>
          </div>
        </div>

        {/* ── Results Panel ── */}
        {result && (
          <div style={{ gridColumn: '1 / -1' }}>
            <ResultsPanel result={result} currency={currency} />
          </div>
        )}

        {/* ── Recent Estimates ── */}
        {estimates.length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <RecentEstimates estimates={estimates} onLoad={loadEstimate} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── ResultsPanel ──────────────────────────────────────────────────────────────

function ResultsPanel({ result, currency }: { result: ImpactResult; currency: string }) {
  const suf = result.budget_sufficiency

  const sufficiencyColor =
    suf === 'sufficient'   ? '#38A169' :
    suf === 'borderline'   ? COLORS.amber :
    suf === 'insufficient' ? COLORS.crimson :
    undefined

  const sufficiencyBg =
    suf === 'sufficient'   ? '#38A16915' :
    suf === 'borderline'   ? `${COLORS.amber}15` :
    suf === 'insufficient' ? `${COLORS.crimson}15` :
    undefined

  return (
    <div style={{
      background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
      borderRadius: 14, padding: '24px 28px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <CheckCircle size={18} style={{ color: '#38A169' }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal, margin: 0 }}>
          Estimation Results
        </p>
        <span style={{
          marginLeft: 'auto',
          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
          background: result.confidence_level === 'high' ? '#38A16920' : `${COLORS.amber}20`,
          color: result.confidence_level === 'high' ? '#38A169' : COLORS.amber,
        }}>
          {result.confidence_level === 'high' ? '✓ Exact benchmark' : '~ Regional estimate'}
        </span>
      </div>

      {/* Headline reach */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.forest}CC, #1A3A5CCC)`,
        border: `1px solid ${COLORS.gold}30`, borderRadius: 12,
        padding: '20px 24px', marginBottom: 16, textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: COLORS.gold, fontWeight: 600, letterSpacing: 1, margin: '0 0 6px', textTransform: 'uppercase' }}>
          Estimated Reach
        </p>
        <p style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', margin: '0 0 4px', fontFamily: FONTS.heading }}>
          {result.estimated_beneficiaries_min.toLocaleString()}
          <span style={{ color: COLORS.gold }}> – </span>
          {result.estimated_beneficiaries_max.toLocaleString()}
        </p>
        <p style={{ fontSize: 13, color: COLORS.slate, margin: 0 }}>{result.primary_output_unit}</p>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard
          label="Cost per Beneficiary"
          value={`${currency} ${result.cost_per_beneficiary_actual_min.toLocaleString()} – ${result.cost_per_beneficiary_actual_max.toLocaleString()}`}
          sub="estimated range"
        />
        <MetricCard
          label="Population Coverage"
          value={`${result.estimated_coverage_percent_min}% – ${result.estimated_coverage_percent_max}%`}
          sub="typical sector range"
        />
        <MetricCard
          label="Monthly Reach"
          value={`${result.monthly_reach_min.toLocaleString()} – ${result.monthly_reach_max.toLocaleString()}`}
          sub="avg. per month"
        />
      </div>

      {/* Budget sufficiency */}
      {suf && result.budget_sufficiency_explanation && (
        <div style={{
          padding: '14px 16px', borderRadius: 10, marginBottom: 16,
          background: sufficiencyBg, border: `1px solid ${sufficiencyColor}30`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          {suf === 'sufficient'   && <CheckCircle size={16} style={{ color: sufficiencyColor, flexShrink: 0, marginTop: 1 }} />}
          {suf === 'borderline'   && <AlertCircle size={16} style={{ color: sufficiencyColor, flexShrink: 0, marginTop: 1 }} />}
          {suf === 'insufficient' && <AlertCircle size={16} style={{ color: sufficiencyColor, flexShrink: 0, marginTop: 1 }} />}
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: sufficiencyColor, margin: '0 0 3px', textTransform: 'capitalize' }}>
              Budget {suf}
            </p>
            <p style={{ fontSize: 12, color: COLORS.slate, margin: 0 }}>
              {result.budget_sufficiency_explanation}
            </p>
          </div>
        </div>
      )}

      {/* Secondary outputs */}
      {result.secondary_outputs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.stone, margin: '0 0 8px' }}>
            Typical additional outcomes:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.secondary_outputs.map((o, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11,
                background: COLORS.foam, color: COLORS.slate,
                border: `1px solid ${COLORS.mist}`,
              }}>
                {o}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark source note */}
      <div style={{
        padding: '10px 14px', borderRadius: 8,
        background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <Info size={13} style={{ color: COLORS.stone, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: COLORS.stone, margin: 0, lineHeight: 1.5 }}>
          These estimates are based on sector benchmarks and actual results will vary.
          Source: {result.source_note}
          {!result.is_exact_match && (
            <span style={{ color: COLORS.amber }}>
              {' '}· No exact match for this combination — using closest available benchmark.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
      borderRadius: 10,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal, margin: '0 0 2px' }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: COLORS.stone, margin: 0 }}>{sub}</p>
    </div>
  )
}

// ── RecentEstimates ───────────────────────────────────────────────────────────

function RecentEstimates({ estimates, onLoad }: {
  estimates: EstimateRecord[]
  onLoad:    (e: EstimateRecord) => void
}) {
  return (
    <div style={{
      background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
      borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, margin: '0 0 16px' }}>
        Recent Estimates
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {estimates.map(est => (
          <div
            key={est.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', gap: 12, flexWrap: 'wrap',
              background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
              borderRadius: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, margin: '0 0 3px' }}>
                {est.program_type} · {est.geography_region}
              </p>
              <p style={{ fontSize: 12, color: COLORS.slate, margin: '0 0 3px' }}>
                Budget: {est.currency} {Number(est.total_budget).toLocaleString()} · {est.duration_months} months
              </p>
              <p style={{ fontSize: 12, color: COLORS.sky, margin: 0 }}>
                Est. {est.results.estimated_beneficiaries_min.toLocaleString()}–{est.results.estimated_beneficiaries_max.toLocaleString()} {est.results.primary_output_unit}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: COLORS.stone }}>
                {new Date(est.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => onLoad(est)}
                style={{
                  padding: '6px 14px', background: COLORS.forest,
                  color: '#ffffff', border: 'none', borderRadius: 7,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
                }}
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

