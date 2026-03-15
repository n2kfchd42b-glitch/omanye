// ── OMANYE Donor Filter ───────────────────────────────────────────────────────
// Server-side only. Strips fields from program/indicator data based on the
// donor's access level. NEVER trust the client to hide fields — strip here.

import type { AccessLevel } from '@/lib/supabase/database.types'
import type {
  Program,
  Indicator,
  DonorProgramView,
  DonorIndicatorView,
} from '@/lib/programs'
import type {
  BudgetSummary,
  CategorySpend,
  FundingTranche,
  DonorBudgetView,
  DonorBudgetSummary,
  DonorCategorySpend,
} from '@/lib/budget'

// ── filterProgram ─────────────────────────────────────────────────────────────
// Returns a donor-safe view of a program based on their access level.
// Indicators (if any) are also filtered — pass the full list, get back only
// what the access level permits.

export function filterProgram(
  program:     Program,
  accessLevel: AccessLevel,
  indicators:  Indicator[] = [],
): DonorProgramView {
  // Base fields always visible (SUMMARY_ONLY and above)
  const base: DonorProgramView = {
    id:               program.id,
    name:             program.name,
    status:           program.status,
    description:      program.description,
    objective:        program.objective,
    location_country: program.location_country,
    location_region:  program.location_region,
    primary_funder:   program.primary_funder,
    tags:             program.tags,
    cover_image_url:  program.cover_image_url,
    access_level:     accessLevel,
  }

  if (accessLevel === 'SUMMARY_ONLY') {
    // No indicators, no budget
    return base
  }

  // INDICATORS and above: include visible indicators
  if (
    accessLevel === 'INDICATORS' ||
    accessLevel === 'INDICATORS_AND_BUDGET' ||
    accessLevel === 'FULL'
  ) {
    const visibleIndicators = indicators
      .filter(ind => ind.visible_to_donors)
      .map<DonorIndicatorView>(ind => ({
        id:            ind.id,
        name:          ind.name,
        description:   ind.description,
        category:      ind.category,
        unit:          ind.unit,
        target_value:  ind.target_value,
        current_value: ind.current_value,
        frequency:     ind.frequency,
        data_source:   ind.data_source,
      }))

    base.indicators = visibleIndicators
  }

  // INDICATORS_AND_BUDGET and FULL: include budget
  if (accessLevel === 'INDICATORS_AND_BUDGET' || accessLevel === 'FULL') {
    base.total_budget = program.total_budget
    base.currency     = program.currency
  }

  return base
}

// ── filterIndicators ──────────────────────────────────────────────────────────
// Returns only donor-visible indicators for a given access level.
// Always returns empty array for SUMMARY_ONLY.

export function filterIndicators(
  indicators:  Indicator[],
  accessLevel: AccessLevel,
): DonorIndicatorView[] {
  if (accessLevel === 'SUMMARY_ONLY') return []

  return indicators
    .filter(ind => ind.visible_to_donors)
    .map<DonorIndicatorView>(ind => ({
      id:            ind.id,
      name:          ind.name,
      description:   ind.description,
      category:      ind.category,
      unit:          ind.unit,
      target_value:  ind.target_value,
      current_value: ind.current_value,
      frequency:     ind.frequency,
      data_source:   ind.data_source,
    }))
}

// ── canSeeBudget ─────────────────────────────────────────────────────────────

export function canSeeBudget(accessLevel: AccessLevel): boolean {
  return accessLevel === 'INDICATORS_AND_BUDGET' || accessLevel === 'FULL'
}

// ── canSeeIndicators ──────────────────────────────────────────────────────────

export function canSeeIndicators(accessLevel: AccessLevel): boolean {
  return accessLevel !== 'SUMMARY_ONLY'
}

// ── filterBudget ──────────────────────────────────────────────────────────────
// Returns a donor-safe budget view based on access level.
// Returns null for SUMMARY_ONLY and INDICATORS (no budget data at all).
// INDICATORS_AND_BUDGET: summary + category aggregates + donor's own tranches.
// FULL: summary + category aggregates + all program tranches.

export function filterBudget(
  program:      Pick<Program, 'total_budget' | 'currency'>,
  accessLevel:  AccessLevel,
  categorySpend: CategorySpend[],
  summary:      BudgetSummary | null,
  tranches:     FundingTranche[],
  donorId:      string,
): DonorBudgetView | null {
  if (accessLevel === 'SUMMARY_ONLY' || accessLevel === 'INDICATORS') {
    return null
  }

  const donorSummary: DonorBudgetSummary | null = summary
    ? {
        total_allocated:  summary.total_allocated,
        total_spent:      summary.total_spent,
        total_remaining:  summary.total_remaining,
        burn_rate_pct:    summary.burn_rate_pct,
      }
    : null

  const donorCategories: DonorCategorySpend[] = categorySpend.map(cat => ({
    category_id:      cat.category_id,
    name:             cat.name,
    allocated_amount: cat.allocated_amount,
    currency:         cat.currency,
    color:            cat.color,
    spent:            cat.spent,
    remaining:        cat.remaining,
    burn_rate_pct:    cat.burn_rate_pct,
  }))

  // INDICATORS_AND_BUDGET: only tranches belonging to this donor
  // FULL: all tranches for the program
  const visibleTranches: FundingTranche[] =
    accessLevel === 'FULL'
      ? tranches
      : tranches.filter(t => t.donor_id === donorId)

  return {
    total_budget:     program.total_budget,
    currency:         program.currency,
    budget_summary:   donorSummary,
    category_spend:   donorCategories,
    funding_tranches: visibleTranches,
  }
}
