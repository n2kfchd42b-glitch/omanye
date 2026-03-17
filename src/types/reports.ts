// ── OMANYE Report Types ───────────────────────────────────────────────────────

import type { AccessLevel } from '@/lib/supabase/database.types'

// ── Enums ──────────────────────────────────────────────────────────────────────

export type ReportType =
  | 'PROGRESS'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'FIELD'
  | 'DONOR_BRIEF'
  | 'FINAL'

export type ReportStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SUBMITTED'
  | 'ARCHIVED'

// Section keys — fixed list (not a DB table)
export type ReportSection =
  | 'EXECUTIVE_SUMMARY'
  | 'PROGRAM_OVERVIEW'
  | 'KEY_INDICATORS'
  | 'BUDGET_SUMMARY'
  | 'FIELD_DATA_SUMMARY'
  | 'CHALLENGES'
  | 'APPENDIX'

// ── Constants ──────────────────────────────────────────────────────────────────

export const REPORT_TYPES: ReportType[] = [
  'PROGRESS',
  'QUARTERLY',
  'ANNUAL',
  'FIELD',
  'DONOR_BRIEF',
  'FINAL',
]

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PROGRESS:    'Progress Report',
  QUARTERLY:   'Quarterly Report',
  ANNUAL:      'Annual Report',
  FIELD:       'Field Report',
  DONOR_BRIEF: 'Donor Brief',
  FINAL:       'Final Report',
}

export const REPORT_TYPE_COLORS: Record<ReportType, { bg: string; text: string }> = {
  PROGRESS:    { bg: '#E6F5EC', text: '#1A5C3A' },
  QUARTERLY:   { bg: '#DBEAFE', text: '#1E40AF' },
  ANNUAL:      { bg: '#FEF3C7', text: '#92400E' },
  FIELD:       { bg: '#F0FDF4', text: '#166534' },
  DONOR_BRIEF: { bg: '#FDF4FF', text: '#7E22CE' },
  FINAL:       { bg: '#FEE2E2', text: '#991B1B' },
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT:     'Draft',
  GENERATED: 'Generated',
  SUBMITTED: 'Submitted',
  ARCHIVED:  'Archived',
}

export const REPORT_STATUS_COLORS: Record<ReportStatus, { bg: string; text: string; dot: string }> = {
  DRAFT:     { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  GENERATED: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  SUBMITTED: { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  ARCHIVED:  { bg: '#F1F5F9', text: '#64748B', dot: '#CBD5E1' },
}

export const ALL_SECTIONS: ReportSection[] = [
  'EXECUTIVE_SUMMARY',
  'PROGRAM_OVERVIEW',
  'KEY_INDICATORS',
  'BUDGET_SUMMARY',
  'FIELD_DATA_SUMMARY',
  'CHALLENGES',
  'APPENDIX',
]

export const SECTION_LABELS: Record<ReportSection, string> = {
  EXECUTIVE_SUMMARY:  'Executive Summary',
  PROGRAM_OVERVIEW:   'Program Overview',
  KEY_INDICATORS:     'Key Indicators Table',
  BUDGET_SUMMARY:     'Budget Summary',
  FIELD_DATA_SUMMARY: 'Field Data Collection Summary',
  CHALLENGES:         'Challenges & Recommendations',
  APPENDIX:           'Appendix',
}

export const SECTION_DESCRIPTIONS: Record<ReportSection, string> = {
  EXECUTIVE_SUMMARY:  'Auto-generated narrative overview of program performance',
  PROGRAM_OVERVIEW:   'Objective, location, funder, and timeline',
  KEY_INDICATORS:     'Indicator progress table: target, current, and % achieved',
  BUDGET_SUMMARY:     'Allocated vs spent per category with burn rate',
  FIELD_DATA_SUMMARY: 'Field dispatch status and recent field collection updates',
  CHALLENGES:         'Free text challenges and recommendations',
  APPENDIX:           'Raw data tables for indicators and expenditures',
}

// Sections filtered by donor access level
export const SECTIONS_BY_ACCESS: Record<AccessLevel, ReportSection[]> = {
  SUMMARY_ONLY:          ['EXECUTIVE_SUMMARY', 'PROGRAM_OVERVIEW'],
  INDICATORS:            ['EXECUTIVE_SUMMARY', 'PROGRAM_OVERVIEW', 'KEY_INDICATORS'],
  INDICATORS_AND_BUDGET: ['EXECUTIVE_SUMMARY', 'PROGRAM_OVERVIEW', 'KEY_INDICATORS', 'BUDGET_SUMMARY'],
  FULL:                  ['EXECUTIVE_SUMMARY', 'PROGRAM_OVERVIEW', 'KEY_INDICATORS', 'BUDGET_SUMMARY', 'FIELD_DATA_SUMMARY', 'CHALLENGES', 'APPENDIX'],
}

// ── Core interfaces ────────────────────────────────────────────────────────────

export interface Report {
  id:                     string
  organization_id:        string
  program_id:             string
  title:                  string
  report_type:            ReportType
  reporting_period_start: string | null
  reporting_period_end:   string | null
  sections:               ReportSection[]
  content:                GeneratedReportContent
  challenges:             string | null
  status:                 ReportStatus
  visible_to_donors:      boolean
  submitted_to:           string[]
  generated_at:           string | null
  submitted_at:           string | null
  created_by:             string
  created_at:             string
  updated_at:             string
  // Joined fields
  program_name?:          string
  creator_name?:          string
  organization_name?:     string
}

export interface IndicatorReportRow {
  id:           string
  name:         string
  category:     string
  unit:         string
  target:       number
  current:      number
  pct_achieved: number
  status:       'on_track' | 'at_risk' | 'off_track'
}

// ── Section content interfaces ─────────────────────────────────────────────────

export interface ExecutiveSummaryContent {
  program_name:           string
  objective:              string | null
  funder:                 string | null
  period:                 string
  overall_achievement_pct: number
  burn_rate_pct:          number | null
  key_highlights:         string[]
}

export interface ProgramOverviewContent {
  name:           string
  objective:      string | null
  description:    string | null
  location:       string | null
  primary_funder: string | null
  start_date:     string | null
  end_date:       string | null
  tags:           string[]
}

export interface BudgetSummaryContent {
  total_allocated: number
  total_spent:     number
  total_remaining: number
  burn_rate_pct:   number
  currency:        string
  categories:      CategorySpendRow[]
}

export interface CategorySpendRow {
  name:            string
  allocated:       number
  spent:           number
  remaining:       number
  burn_rate_pct:   number
}

export interface FieldSummaryContent {
  dispatches: FieldDispatch[]
}

export interface FieldDispatch {
  title:        string
  date:         string
  body_preview: string
}

export interface AppendixContent {
  indicator_updates: AppendixIndicatorUpdate[]
  expenditure_totals: AppendixExpenditure[]
}

export interface AppendixIndicatorUpdate {
  indicator_name: string
  new_value:      number
  unit:           string
  recorded_at:    string
}

export interface AppendixExpenditure {
  category_name: string
  total_spent:   number
  currency:      string
}

export interface GeneratedReportContent {
  executiveSummary?:  ExecutiveSummaryContent
  programOverview?:   ProgramOverviewContent
  keyIndicators?:     IndicatorReportRow[]
  budgetSummary?:     BudgetSummaryContent
  fieldDataSummary?:  FieldSummaryContent
  challenges?:        string
  appendix?:          AppendixContent
}

// ── API payloads ───────────────────────────────────────────────────────────────

export interface CreateReportPayload {
  program_id:             string
  title:                  string
  report_type:            ReportType
  reporting_period_start: string | null
  reporting_period_end:   string | null
  sections:               ReportSection[]
  challenges:             string | null
}

export interface UpdateReportPayload {
  title?:                  string
  report_type?:            ReportType
  reporting_period_start?: string | null
  reporting_period_end?:   string | null
  sections?:               ReportSection[]
  challenges?:             string | null
}
