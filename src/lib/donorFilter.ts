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
