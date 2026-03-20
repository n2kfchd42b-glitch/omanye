// ── Funder Opportunities Types ─────────────────────────────────────────────────

export type FunderOpportunityStatus = 'active' | 'archived'

export interface FunderOpportunity {
  id:                   string
  funder_name:          string
  opportunity_title:    string
  description:          string
  focus_areas:          string[]
  eligible_geographies: string[]
  funding_range_min:    number | null
  funding_range_max:    number | null
  eligible_org_types:   string[]
  application_deadline: string | null  // ISO date string YYYY-MM-DD
  external_link:        string | null
  status:               FunderOpportunityStatus
  created_at:           string
  updated_at:           string
}

export interface FunderOpportunityFilters {
  status?:       FunderOpportunityStatus
  focus_area?:   string
  geography?:    string
  search?:       string
  deadline_from?: string
  deadline_to?:  string
  limit?:        number
  offset?:       number
}
