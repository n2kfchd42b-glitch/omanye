// ── Impact Benchmark Data ─────────────────────────────────────────────────────
// Sector-specific cost and coverage estimates derived from publicly available
// data from WHO, UNICEF, World Bank, OCHA, and academic meta-analyses.
// Used exclusively for deterministic estimation — no LLM involved.

// ── Predefined lists (mirror src/app/(app)/org/[slug]/settings/OrgSettingsClient.tsx)

export const IMPACT_FOCUS_AREAS = [
  'health', 'education', 'WASH', 'food security', 'livelihoods',
  'protection', 'gender', 'climate', 'governance',
] as const

export const IMPACT_GEOGRAPHY_REGIONS = [
  'Sub-Saharan Africa', 'West Africa', 'East Africa', 'Southern Africa', 'North Africa',
  'Southeast Asia', 'South Asia', 'Latin America', 'Middle East', 'Global',
] as const

export type ImpactFocusArea      = typeof IMPACT_FOCUS_AREAS[number]
export type ImpactGeographyRegion = typeof IMPACT_GEOGRAPHY_REGIONS[number]

// ── Benchmark entry shape ─────────────────────────────────────────────────────

export interface BenchmarkEntry {
  cost_per_beneficiary_min:      number  // USD
  cost_per_beneficiary_max:      number  // USD
  typical_coverage_percent_min:  number  // % of target population reachable
  typical_coverage_percent_max:  number
  primary_output_unit:           string  // "people reached", "households served", etc.
  secondary_outputs:             string[]
  source_note:                   string
}

// ── Global fallback ───────────────────────────────────────────────────────────

const GLOBAL_FALLBACK: BenchmarkEntry = {
  cost_per_beneficiary_min:     25,
  cost_per_beneficiary_max:     120,
  typical_coverage_percent_min: 40,
  typical_coverage_percent_max: 75,
  primary_output_unit:          'people reached',
  secondary_outputs:            ['community capacity strengthened', 'awareness raised'],
  source_note:                  'Global cross-sector average (World Bank, 2022–2024)',
}

// ── Benchmark table ───────────────────────────────────────────────────────────
// Key format: `${focus_area}::${geography_region}`

type BenchmarkKey = `${string}::${string}`

const BENCHMARKS: Partial<Record<BenchmarkKey, BenchmarkEntry>> = {

  // ── Health ──────────────────────────────────────────────────────────────────
  'health::Sub-Saharan Africa': {
    cost_per_beneficiary_min:     18,
    cost_per_beneficiary_max:     85,
    typical_coverage_percent_min: 35,
    typical_coverage_percent_max: 70,
    primary_output_unit:          'people receiving health services',
    secondary_outputs: [
      'reduction in preventable disease incidence',
      'improved maternal and child health outcomes',
      'community health workers trained',
    ],
    source_note: 'WHO Global Health Observatory; DCP3; Disease Control Priorities, 2021–2023',
  },

  'health::Southeast Asia': {
    cost_per_beneficiary_min:     22,
    cost_per_beneficiary_max:     90,
    typical_coverage_percent_min: 40,
    typical_coverage_percent_max: 75,
    primary_output_unit:          'people receiving health services',
    secondary_outputs: [
      'vaccination coverage improved',
      'skilled birth attendance increased',
      'non-communicable disease screening delivered',
    ],
    source_note: 'WHO SEARO; World Bank Health Nutrition Population data, 2022',
  },

  'health::South Asia': {
    cost_per_beneficiary_min:     15,
    cost_per_beneficiary_max:     70,
    typical_coverage_percent_min: 45,
    typical_coverage_percent_max: 80,
    primary_output_unit:          'people receiving health services',
    secondary_outputs: [
      'maternal mortality reduction',
      'under-5 mortality reduction',
      'malnutrition rates reduced',
    ],
    source_note: 'UNICEF South Asia; WHO SEARO Health Data, 2022–2024',
  },

  // ── Education ───────────────────────────────────────────────────────────────
  'education::Sub-Saharan Africa': {
    cost_per_beneficiary_min:     30,
    cost_per_beneficiary_max:     140,
    typical_coverage_percent_min: 30,
    typical_coverage_percent_max: 65,
    primary_output_unit:          'learners enrolled or supported',
    secondary_outputs: [
      'school retention rates improved',
      'learning outcomes (literacy, numeracy) improved',
      'teachers trained or supported',
    ],
    source_note: 'World Bank SABER; GPE Learning Data, 2021–2023; UNESCO UIS',
  },

  'education::South Asia': {
    cost_per_beneficiary_min:     20,
    cost_per_beneficiary_max:     100,
    typical_coverage_percent_min: 40,
    typical_coverage_percent_max: 75,
    primary_output_unit:          'learners enrolled or supported',
    secondary_outputs: [
      'girl child school attendance increased',
      'school infrastructure improved',
      'remedial learning delivered',
    ],
    source_note: 'UNICEF South Asia Education Reports; World Bank, 2022',
  },

  // ── WASH ────────────────────────────────────────────────────────────────────
  'WASH::Sub-Saharan Africa': {
    cost_per_beneficiary_min:     40,
    cost_per_beneficiary_max:     180,
    typical_coverage_percent_min: 30,
    typical_coverage_percent_max: 60,
    primary_output_unit:          'people with improved water or sanitation access',
    secondary_outputs: [
      'diarrhoeal disease incidence reduced',
      'open defecation-free communities declared',
      'hygiene behaviour change achieved',
    ],
    source_note: 'WHO/UNICEF JMP; IRC WASH sector benchmarks, 2020–2023',
  },

  'WASH::Latin America': {
    cost_per_beneficiary_min:     50,
    cost_per_beneficiary_max:     200,
    typical_coverage_percent_min: 40,
    typical_coverage_percent_max: 70,
    primary_output_unit:          'people with improved water or sanitation access',
    secondary_outputs: [
      'rural water systems constructed or rehabilitated',
      'water quality testing conducted',
      'community water committees formed',
    ],
    source_note: 'PAHO; World Bank LAC WASH Progress Report, 2022',
  },

  // ── Food Security ────────────────────────────────────────────────────────────
  'food security::East Africa': {
    cost_per_beneficiary_min:     35,
    cost_per_beneficiary_max:     150,
    typical_coverage_percent_min: 35,
    typical_coverage_percent_max: 65,
    primary_output_unit:          'households receiving food or livelihood support',
    secondary_outputs: [
      'food consumption scores improved',
      'dietary diversity increased',
      'agricultural productivity improved',
    ],
    source_note: 'WFP VAM; FAO FAOSTAT; FEWS NET East Africa, 2021–2024',
  },

  // ── Livelihoods ─────────────────────────────────────────────────────────────
  'livelihoods::West Africa': {
    cost_per_beneficiary_min:     60,
    cost_per_beneficiary_max:     250,
    typical_coverage_percent_min: 25,
    typical_coverage_percent_max: 55,
    primary_output_unit:          'people with improved income or economic outcomes',
    secondary_outputs: [
      'household income increased',
      'savings group membership established',
      'market access improved',
    ],
    source_note: 'ILO; World Bank Jobs & Development; CGIAR Livelihoods benchmarks, 2022',
  },

  // ── Protection ──────────────────────────────────────────────────────────────
  'protection::Middle East': {
    cost_per_beneficiary_min:     80,
    cost_per_beneficiary_max:     350,
    typical_coverage_percent_min: 20,
    typical_coverage_percent_max: 50,
    primary_output_unit:          'people receiving protection services or legal aid',
    secondary_outputs: [
      'documentation and legal status support provided',
      'psychosocial support delivered',
      'GBV survivors supported',
    ],
    source_note: 'UNHCR Regional Cost Data; IRC Protection Benchmarks, 2022–2024',
  },

  // ── Additional commonly useful entries ──────────────────────────────────────
  'health::West Africa': {
    cost_per_beneficiary_min:     20,
    cost_per_beneficiary_max:     90,
    typical_coverage_percent_min: 35,
    typical_coverage_percent_max: 70,
    primary_output_unit:          'people receiving health services',
    secondary_outputs: [
      'malaria prevention coverage increased',
      'community case management delivered',
    ],
    source_note: 'WHO AFRO; PMI Malaria Data West Africa, 2022',
  },

  'education::East Africa': {
    cost_per_beneficiary_min:     25,
    cost_per_beneficiary_max:     120,
    typical_coverage_percent_min: 35,
    typical_coverage_percent_max: 65,
    primary_output_unit:          'learners enrolled or supported',
    secondary_outputs: [
      'school feeding delivered',
      'learning assessments conducted',
    ],
    source_note: 'UNESCO UIS; WFP School Feeding, 2022',
  },

  'WASH::South Asia': {
    cost_per_beneficiary_min:     30,
    cost_per_beneficiary_max:     130,
    typical_coverage_percent_min: 40,
    typical_coverage_percent_max: 72,
    primary_output_unit:          'people with improved water or sanitation access',
    secondary_outputs: [
      'ODF villages declared',
      'handwashing facilities installed',
    ],
    source_note: 'UNICEF WASH South Asia; WHO/UNICEF JMP, 2023',
  },
}

// ── getBenchmark ──────────────────────────────────────────────────────────────

export interface BenchmarkResult {
  entry:         BenchmarkEntry
  is_exact_match: boolean
  matched_key:   string
}

export function getBenchmark(
  focus_area:       string,
  geography_region: string,
): BenchmarkResult {
  const exactKey = `${focus_area}::${geography_region}` as BenchmarkKey

  if (BENCHMARKS[exactKey]) {
    return {
      entry:         BENCHMARKS[exactKey]!,
      is_exact_match: true,
      matched_key:   exactKey,
    }
  }

  // Try partial match: same focus_area, any geography
  const areaMatch = Object.entries(BENCHMARKS).find(
    ([k]) => k.startsWith(`${focus_area}::`)
  )
  if (areaMatch) {
    return {
      entry:         areaMatch[1]!,
      is_exact_match: false,
      matched_key:   areaMatch[0],
    }
  }

  // Try partial match: any focus_area, same geography
  const geoMatch = Object.entries(BENCHMARKS).find(
    ([k]) => k.endsWith(`::${geography_region}`)
  )
  if (geoMatch) {
    return {
      entry:         geoMatch[1]!,
      is_exact_match: false,
      matched_key:   geoMatch[0],
    }
  }

  // Fallback to global average
  return {
    entry:         GLOBAL_FALLBACK,
    is_exact_match: false,
    matched_key:   'global::fallback',
  }
}
