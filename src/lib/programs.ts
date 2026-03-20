// ── OMANYE Programs & Indicators Types ───────────────────────────────────────

import type {
  ProgramStatusDB,
  ProgramVisibility,
  IndicatorFrequency,
  UpdateType,
  AccessLevel,
} from '@/lib/supabase/database.types'

// Re-export enums from database types for convenience
export type { ProgramStatusDB as ProgramStatus, ProgramVisibility, IndicatorFrequency, UpdateType }

// ── Enums as const objects for iteration ─────────────────────────────────────

export const PROGRAM_STATUSES: ProgramStatusDB[] = ['PLANNING', 'ACTIVE', 'COMPLETED', 'SUSPENDED']

export const PROGRAM_VISIBILITIES: ProgramVisibility[] = ['PRIVATE', 'DONOR_ONLY', 'PUBLIC']

export const INDICATOR_FREQUENCIES: IndicatorFrequency[] = [
  'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONCE',
]

export const UPDATE_TYPES: UpdateType[] = [
  'PROGRESS', 'MILESTONE', 'CHALLENGE', 'DONOR_REPORT', 'FIELD_DISPATCH',
]

// ── Labels ────────────────────────────────────────────────────────────────────

export const PROGRAM_STATUS_LABELS: Record<ProgramStatusDB, string> = {
  PLANNING:  'Planning',
  ACTIVE:    'Active',
  COMPLETED: 'Completed',
  SUSPENDED: 'Suspended',
}

export const VISIBILITY_LABELS: Record<ProgramVisibility, string> = {
  PRIVATE:    'Private',
  DONOR_ONLY: 'Donor Only',
  PUBLIC:     'Public',
}

export const VISIBILITY_DESCRIPTIONS: Record<ProgramVisibility, string> = {
  PRIVATE:    'Only your organization team can see this program.',
  DONOR_ONLY: 'Visible to donors you have explicitly granted access.',
  PUBLIC:     'Visible on your public organization profile (coming soon).',
}

export const FREQUENCY_LABELS: Record<IndicatorFrequency, string> = {
  WEEKLY:    'Weekly',
  MONTHLY:   'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY:  'Annually',
  ONCE:      'One-time',
}

export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  PROGRESS:       'Progress Update',
  MILESTONE:      'Milestone',
  CHALLENGE:      'Challenge',
  DONOR_REPORT:   'Donor Report',
  FIELD_DISPATCH: 'Field Dispatch',
}

export const UPDATE_TYPE_COLORS: Record<UpdateType, { bg: string; text: string }> = {
  PROGRESS:       { bg: '#38A16920', text: '#38A169' },
  MILESTONE:      { bg: '#FEF3C7', text: '#78350F' },
  CHALLENGE:      { bg: '#FEE2E2', text: '#991B1B' },
  DONOR_REPORT:   { bg: '#DBEAFE', text: '#1E40AF' },
  FIELD_DISPATCH: { bg: '#F3E8FF', text: '#6B21A8' },
}

// ── Domain interfaces ─────────────────────────────────────────────────────────

export interface Program {
  id:               string
  organization_id:  string
  name:             string
  status:           ProgramStatusDB
  description:      string | null
  objective:        string | null
  start_date:       string | null
  end_date:         string | null
  location_country: string | null
  location_region:  string | null
  primary_funder:   string | null
  total_budget:     number | null
  currency:         string
  logframe_url:     string | null
  cover_image_url:  string | null
  tags:             string[]
  visibility:       ProgramVisibility
  expected_submission_cadence_per_week: number | null
  deleted_at:       string | null
  created_at:       string
  updated_at:       string
}

export interface Indicator {
  id:                string
  program_id:        string
  organization_id:   string
  name:              string
  description:       string | null
  category:          string | null
  unit:              string | null
  target_value:      number | null
  current_value:     number
  baseline_value:    number | null
  frequency:         IndicatorFrequency
  data_source:       string | null
  is_key_indicator:  boolean
  visible_to_donors: boolean
  sort_order:        number
  created_by:        string | null
  created_at:        string
  updated_at:        string
}

export interface IndicatorUpdate {
  id:                     string
  indicator_id:           string
  program_id:             string
  organization_id:        string
  previous_value:         number | null
  new_value:              number
  reporting_period_start: string | null
  reporting_period_end:   string | null
  notes:                  string | null
  source:                 string | null
  submitted_by:           string | null
  submitted_at:           string
}

export interface ProgramUpdate {
  id:                string
  program_id:        string
  organization_id:   string
  title:             string
  body:              string | null
  update_type:       UpdateType
  visible_to_donors: boolean
  attachments:       Attachment[]
  published_at:      string | null
  created_by:        string | null
  created_at:        string
  updated_at:        string
}

export interface Attachment {
  name: string
  url:  string
  type: string
}

// ── Donor-filtered view ───────────────────────────────────────────────────────
// Server-side only — never expose full Program to client before filtering.

export interface DonorProgramView {
  id:              string
  name:            string
  status:          ProgramStatusDB
  description:     string | null
  objective:       string | null
  location_country: string | null
  location_region: string | null
  primary_funder:  string | null
  tags:            string[]
  cover_image_url: string | null
  // Only present for INDICATORS_AND_BUDGET or FULL
  total_budget?:   number | null
  currency?:       string
  // Access metadata (not from DB, added by donorFilter)
  access_level:    AccessLevel
  // Only present for INDICATORS or above (filtered list)
  indicators?:     DonorIndicatorView[]
}

export interface DonorIndicatorView {
  id:            string
  name:          string
  description:   string | null
  category:      string | null
  unit:          string | null
  target_value:  number | null
  current_value: number
  frequency:     IndicatorFrequency
  data_source:   string | null
}

// ── Create / update payloads ──────────────────────────────────────────────────

export interface CreateProgramPayload {
  name:             string
  status?:          ProgramStatusDB
  description?:     string
  objective?:       string
  start_date?:      string
  end_date?:        string
  location_country?: string
  location_region?: string
  primary_funder?:  string
  total_budget?:    number
  currency?:        string
  logframe_url?:    string
  tags?:            string[]
  visibility?:      ProgramVisibility
  expected_submission_cadence_per_week?: number | null
}

export interface UpdateProgramPayload extends Partial<CreateProgramPayload> {
  cover_image_url?: string
}

export interface CreateIndicatorPayload {
  program_id:         string
  name:               string
  description?:       string
  category?:          string
  unit?:              string
  target_value?:      number
  baseline_value?:    number
  frequency?:         IndicatorFrequency
  data_source?:       string
  is_key_indicator?:  boolean
  visible_to_donors?: boolean
  sort_order?:        number
}

export interface SubmitIndicatorUpdatePayload {
  new_value:              number
  reporting_period_start?: string
  reporting_period_end?:   string
  notes?:                  string
  source?:                 string
}

export interface CreateProgramUpdatePayload {
  title:              string
  body?:              string
  update_type?:       UpdateType
  visible_to_donors?: boolean
  attachments?:       Attachment[]
  published_at?:      string
}
