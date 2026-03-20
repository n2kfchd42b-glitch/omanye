// ── Grant Writing Assistant — Shared Types ─────────────────────────────────────

export type GrantStatus = 'draft' | 'submitted' | 'awarded' | 'rejected'

export const GRANT_STATUS_LABELS: Record<GrantStatus, string> = {
  draft:     'Draft',
  submitted: 'Submitted',
  awarded:   'Awarded',
  rejected:  'Rejected',
}

export const GRANT_STATUS_COLORS: Record<GrantStatus, { bg: string; text: string }> = {
  draft:     { bg: '#1A2B4A', text: '#A0AEC0' },
  submitted: { bg: '#1A3A5C', text: '#60A5FA' },
  awarded:   { bg: '#38A16920', text: '#38A169' },
  rejected:  { bg: '#E53E3E20', text: '#E53E3E' },
}

export const SECTION_KEYS = [
  'executive_summary',
  'problem_statement',
  'objectives_and_outcomes',
  'program_activities',
  'budget_overview',
  'expected_impact',
] as const

export type SectionKey = typeof SECTION_KEYS[number]

export const SECTION_LABELS: Record<SectionKey, string> = {
  executive_summary:      'Executive Summary',
  problem_statement:      'Problem Statement',
  objectives_and_outcomes: 'Objectives and Outcomes',
  program_activities:     'Program Activities',
  budget_overview:        'Budget Overview',
  expected_impact:        'Expected Impact',
}

export type GrantSections = Partial<Record<SectionKey, string>>

export interface GrantInputForm {
  funder_name:              string
  opportunity_title:        string
  funding_amount_requested: number
  currency:                 string
  application_deadline:     string
  funder_priorities:        string
  geographic_focus:         string
  target_beneficiary_count: number
  program_duration_months:  number
  specific_requirements:    string
}

export interface Grant {
  id:                       string
  organization_id:          string
  program_id:               string | null
  funder_name:              string
  opportunity_title:        string
  funding_amount_requested: number
  currency:                 string
  application_deadline:     string | null
  status:                   GrantStatus
  current_version:          number
  created_by:               string
  created_at:               string
  updated_at:               string
}

export interface GrantVersion {
  id:                string
  grant_id:          string
  version_number:    number
  content:           GrantSections
  generation_inputs: Partial<GrantInputForm>
  generated_by:      string
  created_at:        string
}

export interface GrantWithVersion extends Grant {
  grant_versions: GrantVersion[]
}
