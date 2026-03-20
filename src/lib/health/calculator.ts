// ── Program Health Score Calculator ───────────────────────────────────────────
// Pure functions — no database access. Accepts pre-fetched data and returns
// a full health score object. Used by both the Next.js API routes and the
// Supabase edge function (via the recalculate endpoint).

// ── Input types ───────────────────────────────────────────────────────────────

export interface ProgramData {
  id:                                    string
  start_date:                            string | null   // ISO date
  end_date:                              string | null   // ISO date
  total_budget:                          number | null
  expected_submission_cadence_per_week:  number | null   // defaults to 2 if null
}

export interface IndicatorData {
  id:             string
  name:           string
  current_value:  number
  target_value:   number | null
  baseline_value: number | null
}

/** Budget rollup — allocated across all categories, spent on APPROVED expenditures */
export interface BudgetData {
  total_allocated: number
  total_spent:     number
}

// ── Output types ──────────────────────────────────────────────────────────────

export type RAGStatus = 'green' | 'amber' | 'red'

export interface HealthScoreResult {
  composite_score:      number       // 0–100 integer
  budget_score:         number       // 0–33
  indicator_score:      number       // 0–33
  field_activity_score: number       // 0–33
  rag_status:           RAGStatus
  score_factors:        string[]     // plain-language explanations
  calculated_at:        string       // ISO timestamp
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fraction of the program timeline that has elapsed, clamped to [0, 1]. */
function elapsedFraction(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0.5   // fallback: assume midpoint

  const start = new Date(startDate).getTime()
  const end   = new Date(endDate).getTime()
  const now   = Date.now()

  if (end <= start) return 0.5
  return Math.max(0, Math.min(1, (now - start) / (end - start)))
}

// ── Budget health (0–33 pts) ──────────────────────────────────────────────────
// Compares actual spend to expected burn rate at this point in the timeline.
// Overspend and underspend are penalized, but underspend deductions are
// capped at half of the equivalent overspend deduction.

function calcBudgetScore(
  budget: BudgetData,
  elapsed: number,
): { score: number; factors: string[] } {
  const factors: string[] = []

  if (budget.total_allocated <= 0) {
    factors.push('No budget allocated — budget health score defaulted')
    return { score: 33, factors }
  }

  if (elapsed <= 0) {
    factors.push('Program has not started — no expected spend yet')
    return { score: 33, factors }
  }

  const expected = budget.total_allocated * elapsed
  const spent    = budget.total_spent

  if (expected <= 0) {
    return { score: 33, factors: ['Expected spend is zero — budget health score defaulted'] }
  }

  const variance    = (spent - expected) / expected   // positive = overspend
  const absVariance = Math.abs(variance)
  const isOverspend = variance > 0
  const pct         = Math.round(absVariance * 100)

  let score: number

  if (absVariance <= 0.10) {
    score = 33
    factors.push('Budget burn rate is on track')
  } else if (absVariance > 0.30) {
    if (isOverspend) {
      score = 0
      factors.push(`Budget is ${pct}% overspent vs. expected burn rate`)
    } else {
      // Underspend beyond 30%: cap deduction at half of maximum (half of 33)
      score = Math.round(33 / 2)
      factors.push(`Budget is ${pct}% underspent vs. expected burn rate`)
    }
  } else {
    // Linear interpolation between 10% (full score) and 30% (zero/half deduction)
    const deductionFactor = (absVariance - 0.10) / 0.20   // 0 at 10%, 1 at 30%
    const fullDeduction   = 33 * deductionFactor
    if (isOverspend) {
      score = Math.round(33 - fullDeduction)
      factors.push(`Budget is ${pct}% overspent vs. expected burn rate`)
    } else {
      score = Math.round(33 - fullDeduction / 2)
      factors.push(`Budget is ${pct}% underspent vs. expected burn rate`)
    }
  }

  return { score: Math.max(0, Math.min(33, score)), factors }
}

// ── Indicator health (0–33 pts) ───────────────────────────────────────────────
// Each indicator is on track if its current value is within 10% of the
// linearly-interpolated expected value at this point in the timeline.

function calcIndicatorScore(
  indicators: IndicatorData[],
  elapsed: number,
): { score: number; factors: string[] } {
  const factors: string[] = []

  if (indicators.length === 0) {
    factors.push('No indicators configured — indicator health score defaulted')
    return { score: 33, factors }
  }

  const offTrack: string[] = []
  let onTrackCount = 0

  for (const ind of indicators) {
    const target   = ind.target_value   ?? 0
    const baseline = ind.baseline_value ?? 0
    const current  = ind.current_value

    // Expected value by linear interpolation
    const expected = baseline + (target - baseline) * elapsed

    // On track: current within 10% of expected
    // Use absolute tolerance relative to the range to avoid division-by-zero
    const range     = Math.abs(target - baseline)
    const tolerance = range > 0 ? range * 0.10 : Math.abs(expected) * 0.10 || 1
    const isOnTrack = Math.abs(current - expected) <= tolerance

    if (isOnTrack) {
      onTrackCount++
    } else {
      offTrack.push(ind.name)
    }
  }

  const ratio = onTrackCount / indicators.length
  const score = Math.round(ratio * 33)

  if (offTrack.length === 0) {
    factors.push(`All ${indicators.length} indicator${indicators.length !== 1 ? 's' : ''} are on track`)
  } else if (offTrack.length === indicators.length) {
    factors.push(`All ${indicators.length} indicators are behind target`)
  } else {
    factors.push(
      `${offTrack.length} of ${indicators.length} indicators are behind target` +
      (offTrack.length <= 3 ? `: ${offTrack.join(', ')}` : '')
    )
  }

  return { score: Math.max(0, Math.min(33, score)), factors }
}

// ── Field activity health (0–33 pts) ─────────────────────────────────────────
// Compares the actual submission count over the last 30 days to the expected
// cadence. Default cadence is 2 submissions/week if not configured.

function calcFieldActivityScore(
  recentSubmissionCount: number,
  cadencePerWeek: number | null,
): { score: number; factors: string[] } {
  const factors: string[] = []
  const cadence  = cadencePerWeek ?? 2
  const expected = cadence * (30 / 7)   // expected submissions over 30 days

  if (expected <= 0) {
    return { score: 33, factors: ['No submission cadence configured — field health score defaulted'] }
  }

  const ratio = recentSubmissionCount / expected
  const score = Math.round(Math.min(1, ratio) * 33)

  if (recentSubmissionCount === 0) {
    factors.push('No field submissions received in the last 30 days')
  } else if (ratio >= 1) {
    factors.push(
      `${recentSubmissionCount} field submissions in the last 30 days — meets expected cadence`
    )
  } else {
    const shortfall = Math.round(expected - recentSubmissionCount)
    factors.push(
      `${recentSubmissionCount} of ~${Math.round(expected)} expected field submissions in the last 30 days` +
      (shortfall > 0 ? ` (${shortfall} short)` : '')
    )
  }

  return { score: Math.max(0, Math.min(33, score)), factors }
}

// ── RAG status ────────────────────────────────────────────────────────────────

function ragStatus(composite: number): RAGStatus {
  if (composite >= 75) return 'green'
  if (composite >= 50) return 'amber'
  return 'red'
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateProgramHealth(
  program:               ProgramData,
  indicators:            IndicatorData[],
  budget:                BudgetData,
  recentSubmissionCount: number,
): HealthScoreResult {
  const elapsed = elapsedFraction(program.start_date, program.end_date)

  const { score: budgetScore,        factors: budgetFactors }        = calcBudgetScore(budget, elapsed)
  const { score: indicatorScore,     factors: indicatorFactors }     = calcIndicatorScore(indicators, elapsed)
  const { score: fieldActivityScore, factors: fieldActivityFactors } = calcFieldActivityScore(
    recentSubmissionCount,
    program.expected_submission_cadence_per_week,
  )

  // Sum of the three dimensions (each 0–33, rounding means we can reach 99 or 100)
  const composite = Math.min(100, budgetScore + indicatorScore + fieldActivityScore)

  return {
    composite_score:      composite,
    budget_score:         budgetScore,
    indicator_score:      indicatorScore,
    field_activity_score: fieldActivityScore,
    rag_status:           ragStatus(composite),
    score_factors:        [...budgetFactors, ...indicatorFactors, ...fieldActivityFactors],
    calculated_at:        new Date().toISOString(),
  }
}
