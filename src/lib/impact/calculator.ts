// ── Impact Calculation Engine ─────────────────────────────────────────────────
// Deterministic estimation from benchmark tables. NO LLM involved.

import { getBenchmark, type BenchmarkEntry, type BenchmarkResult } from './benchmarks'

// ── Input / Output types ──────────────────────────────────────────────────────

export interface ImpactInput {
  program_type:            string   // maps to focus_area in benchmarks
  geography_region:        string
  total_budget:            number   // in stated currency
  duration_months:         number
  target_beneficiary_count?: number // optional
}

export type BudgetSufficiency = 'sufficient' | 'borderline' | 'insufficient'

export interface ImpactResult {
  // Reach estimates
  estimated_beneficiaries_min:         number
  estimated_beneficiaries_max:         number

  // Cost efficiency
  cost_per_beneficiary_actual_min:     number
  cost_per_beneficiary_actual_max:     number

  // Coverage
  estimated_coverage_percent_min:      number
  estimated_coverage_percent_max:      number

  // Monthly reach
  monthly_reach_min:                   number
  monthly_reach_max:                   number

  // Budget sufficiency (only present when target_beneficiary_count provided)
  budget_sufficiency?:                 BudgetSufficiency
  budget_sufficiency_explanation?:     string
  budget_gap?:                         number   // positive = surplus, negative = gap

  // Benchmark metadata
  benchmark_used:                      BenchmarkEntry
  benchmark_key:                       string
  is_exact_match:                      boolean
  confidence_level:                    'high' | 'moderate'

  // Output info
  primary_output_unit:                 string
  secondary_outputs:                   string[]
  source_note:                         string
}

// ── calculateImpact ───────────────────────────────────────────────────────────

export function calculateImpact(input: ImpactInput): ImpactResult {
  const {
    program_type,
    geography_region,
    total_budget,
    duration_months,
    target_beneficiary_count,
  } = input

  if (total_budget <= 0) throw new Error('total_budget must be > 0')
  if (duration_months <= 0) throw new Error('duration_months must be > 0')

  const benchmarkResult: BenchmarkResult = getBenchmark(program_type, geography_region)
  const b: BenchmarkEntry = benchmarkResult.entry

  // ── Core reach estimates ───────────────────────────────────────────────────
  // Divide budget by cost_per_beneficiary bounds (min cost → max reach, max cost → min reach)
  const estimated_beneficiaries_max = Math.round(total_budget / b.cost_per_beneficiary_min)
  const estimated_beneficiaries_min = Math.round(total_budget / b.cost_per_beneficiary_max)

  // ── Actual cost per beneficiary ───────────────────────────────────────────
  const cost_per_beneficiary_actual_min = parseFloat(
    (total_budget / estimated_beneficiaries_max).toFixed(2)
  )
  const cost_per_beneficiary_actual_max = parseFloat(
    (total_budget / Math.max(estimated_beneficiaries_min, 1)).toFixed(2)
  )

  // ── Coverage estimates ────────────────────────────────────────────────────
  // Use benchmark typical coverage ranges directly
  const estimated_coverage_percent_min = b.typical_coverage_percent_min
  const estimated_coverage_percent_max = b.typical_coverage_percent_max

  // ── Monthly reach ─────────────────────────────────────────────────────────
  const monthly_reach_min = Math.round(estimated_beneficiaries_min / duration_months)
  const monthly_reach_max = Math.round(estimated_beneficiaries_max / duration_months)

  // ── Budget sufficiency ────────────────────────────────────────────────────
  let budget_sufficiency: BudgetSufficiency | undefined
  let budget_sufficiency_explanation: string | undefined
  let budget_gap: number | undefined

  if (target_beneficiary_count && target_beneficiary_count > 0) {
    const cost_to_reach_target_mid = target_beneficiary_count *
      ((b.cost_per_beneficiary_min + b.cost_per_beneficiary_max) / 2)

    const cost_at_min = target_beneficiary_count * b.cost_per_beneficiary_min
    const cost_at_max = target_beneficiary_count * b.cost_per_beneficiary_max

    budget_gap = parseFloat((total_budget - cost_to_reach_target_mid).toFixed(2))

    if (total_budget >= cost_at_max) {
      // Budget covers even at highest cost — definitely sufficient
      budget_sufficiency = 'sufficient'
      budget_sufficiency_explanation =
        `Budget is likely sufficient to reach ${target_beneficiary_count.toLocaleString()} beneficiaries under typical sector cost conditions.`
    } else if (total_budget >= cost_at_min) {
      // Budget covers at optimistic cost, not at pessimistic cost
      budget_sufficiency = 'borderline'
      budget_sufficiency_explanation =
        `Budget may be sufficient at lower sector costs but could fall short by up to ${Math.abs(cost_at_max - total_budget).toLocaleString()} USD at higher costs.`
    } else {
      // Even at minimum cost, budget is insufficient
      const shortfall = Math.round(cost_at_min - total_budget)
      budget_sufficiency = 'insufficient'
      budget_sufficiency_explanation =
        `Budget is likely insufficient. An additional ${shortfall.toLocaleString()} USD would be needed to reach the target at minimum sector costs.`
    }
  }

  return {
    estimated_beneficiaries_min,
    estimated_beneficiaries_max,
    cost_per_beneficiary_actual_min,
    cost_per_beneficiary_actual_max,
    estimated_coverage_percent_min,
    estimated_coverage_percent_max,
    monthly_reach_min,
    monthly_reach_max,
    budget_sufficiency,
    budget_sufficiency_explanation,
    budget_gap,
    benchmark_used:   b,
    benchmark_key:    benchmarkResult.matched_key,
    is_exact_match:   benchmarkResult.is_exact_match,
    confidence_level: benchmarkResult.is_exact_match ? 'high' : 'moderate',
    primary_output_unit: b.primary_output_unit,
    secondary_outputs:   b.secondary_outputs,
    source_note:         b.source_note,
  }
}
