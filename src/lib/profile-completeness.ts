// ── Profile Completeness Utility ──────────────────────────────────────────────
// Scores an organization record across 9 profile fields.
// Used by the Donor Matching page completeness nudge.

export interface OrgCompleteness {
  score:       number   // 0–100 (rounded to nearest whole number)
  emptyFields: string[] // internal field keys that are empty
}

// 9 fields × ~11 pts each = 100 pts (we use exact division)
const FIELDS: { key: string; label: string; tab: 'grant-profile' | 'profile-tags' }[] = [
  { key: 'mission_statement',      label: 'Mission Statement',       tab: 'grant-profile' },
  { key: 'founding_year',          label: 'Founding Year',           tab: 'grant-profile' },
  { key: 'beneficiary_types',      label: 'Beneficiary Types',       tab: 'grant-profile' },
  { key: 'past_program_summaries', label: 'Past Program Summaries',  tab: 'grant-profile' },
  { key: 'key_achievements',       label: 'Key Achievements',        tab: 'grant-profile' },
  { key: 'focus_areas',            label: 'Focus Areas',             tab: 'profile-tags' },
  { key: 'eligible_geographies',   label: 'Eligible Geographies',    tab: 'profile-tags' },
  { key: 'program_types',          label: 'Program Types',           tab: 'profile-tags' },
  { key: 'annual_budget_range',    label: 'Annual Budget Range',     tab: 'profile-tags' },
]

export const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  FIELDS.map(f => [f.key, f.label])
)

export const FIELD_TAB: Record<string, 'grant-profile' | 'profile-tags'> = Object.fromEntries(
  FIELDS.map(f => [f.key, f.tab])
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCompleteness(org: Record<string, any>): OrgCompleteness {
  const emptyFields: string[] = []

  for (const { key } of FIELDS) {
    const val = org[key]
    const isEmpty =
      val === null ||
      val === undefined ||
      val === '' ||
      (Array.isArray(val) && val.length === 0)

    if (isEmpty) emptyFields.push(key)
  }

  const filled = FIELDS.length - emptyFields.length
  const score  = Math.round((filled / FIELDS.length) * 100)

  return { score, emptyFields }
}
