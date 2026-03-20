// ── Funder Match Score Utility ─────────────────────────────────────────────────
// Shared between the Funder Feed client-side sorting and the weekly digest
// edge function. Works in both browser and Deno environments.

export interface NgoProfile {
  focus_areas:          string[]
  eligible_geographies: string[]
  program_types:        string[]
  annual_budget_range:  string | null
}

export interface FunderOpportunity {
  focus_areas:          string[]
  eligible_geographies: string[]
  eligible_org_types:   string[]
  funding_range_min:    number | null
  funding_range_max:    number | null
}

export interface MatchResult {
  score:   number   // 0–100
  summary: string   // human-readable e.g. "3 of 5 focus areas, 2 of 3 geographies, budget fits"
}

// Budget range midpoints in USD (used for range-fit check)
const BUDGET_MIDPOINTS: Record<string, number> = {
  under_100k: 50_000,
  '100k_500k': 300_000,
  '500k_1m':   750_000,
  '1m_5m':   3_000_000,
  above_5m: 10_000_000,
}

function overlap(a: string[], b: string[]): number {
  if (!b.length) return 0
  return a.filter(x => b.includes(x)).length
}

export function computeMatchScore(
  ngo: NgoProfile,
  opp: FunderOpportunity,
): MatchResult {
  // ── Focus area score (40 pts) ─────────────────────────────────────────────
  const focusDenom   = opp.focus_areas.length || 1
  const focusMatched = overlap(ngo.focus_areas, opp.focus_areas)
  const focusScore   = (focusMatched / focusDenom) * 40

  // ── Geography score (40 pts) ──────────────────────────────────────────────
  const geoDenom   = opp.eligible_geographies.length || 1
  const geoMatched = overlap(ngo.eligible_geographies, opp.eligible_geographies)
  const geoScore   = (geoMatched / geoDenom) * 40

  // ── Budget fit score (20 pts) ─────────────────────────────────────────────
  let budgetScore = 0
  let budgetFits  = false
  if (ngo.annual_budget_range && BUDGET_MIDPOINTS[ngo.annual_budget_range] !== undefined) {
    const mid = BUDGET_MIDPOINTS[ngo.annual_budget_range]
    const min = opp.funding_range_min ?? 0
    const max = opp.funding_range_max ?? Infinity
    if (mid >= min && mid <= max) {
      budgetScore = 20
      budgetFits  = true
    }
  }

  const score = Math.round(focusScore + geoScore + budgetScore)

  // ── Summary string ────────────────────────────────────────────────────────
  const parts: string[] = []

  if (opp.focus_areas.length > 0) {
    parts.push(`${focusMatched} of ${opp.focus_areas.length} focus area${opp.focus_areas.length !== 1 ? 's' : ''}`)
  }
  if (opp.eligible_geographies.length > 0) {
    parts.push(`${geoMatched} of ${opp.eligible_geographies.length} ${geoMatched === 1 ? 'geography' : 'geographies'}`)
  }
  if (opp.funding_range_min !== null || opp.funding_range_max !== null) {
    parts.push(budgetFits ? 'budget fits' : 'budget outside range')
  }

  const summary = parts.length ? `Matched ${parts.join(', ')}` : 'No criteria to match'

  return { score, summary }
}
