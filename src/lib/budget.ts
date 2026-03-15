// ── OMANYE Budget & Financial Tracking Types ─────────────────────────────────

import type { ExpenditureStatus, TrancheStatus } from '@/lib/supabase/database.types'

export type { ExpenditureStatus, TrancheStatus }

// ── Enums as arrays for iteration ─────────────────────────────────────────────

export const EXPENDITURE_STATUSES: ExpenditureStatus[] = [
  'PENDING', 'APPROVED', 'REJECTED', 'VOID',
]

export const TRANCHE_STATUSES: TrancheStatus[] = [
  'EXPECTED', 'RECEIVED', 'DELAYED', 'CANCELLED',
]

// ── Labels ────────────────────────────────────────────────────────────────────

export const EXPENDITURE_STATUS_LABELS: Record<ExpenditureStatus, string> = {
  PENDING:  'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  VOID:     'Void',
}

export const EXPENDITURE_STATUS_COLORS: Record<ExpenditureStatus, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#78350F', dot: '#D97706' },
  APPROVED: { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  VOID:     { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
}

export const TRANCHE_STATUS_LABELS: Record<TrancheStatus, string> = {
  EXPECTED:  'Expected',
  RECEIVED:  'Received',
  DELAYED:   'Delayed',
  CANCELLED: 'Cancelled',
}

export const TRANCHE_STATUS_COLORS: Record<TrancheStatus, { bg: string; text: string; dot: string }> = {
  EXPECTED:  { bg: '#FEF3C7', text: '#78350F', dot: '#D97706' },
  RECEIVED:  { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  DELAYED:   { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  CANCELLED: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
}

// ── Category palette — auto-assign when creating categories ───────────────────

export const CATEGORY_COLORS = [
  '#4CAF78', '#D4AF5C', '#0EA5E9', '#8B5CF6',
  '#EC4899', '#F59E0B', '#10B981', '#6366F1',
  '#EF4444', '#14B8A6',
]

// ── Domain interfaces ─────────────────────────────────────────────────────────

export interface BudgetCategory {
  id:               string
  program_id:       string
  organization_id:  string
  name:             string
  description:      string | null
  allocated_amount: number
  currency:         string
  color:            string
  sort_order:       number
  created_at:       string
  updated_at:       string
}

export interface Expenditure {
  id:                 string
  program_id:         string
  organization_id:    string
  budget_category_id: string | null
  description:        string
  amount:             number
  currency:           string
  transaction_date:   string
  payment_method:     string | null
  reference_number:   string | null
  receipt_url:        string | null
  approved_by:        string | null
  approved_at:        string | null
  status:             ExpenditureStatus
  notes:              string | null
  submitted_by:       string
  created_at:         string
  updated_at:         string
  // Joined fields (from query)
  category_name?:     string | null
  submitter_name?:    string | null
  approver_name?:     string | null
}

export interface BudgetAmendment {
  id:               string
  program_id:       string
  organization_id:  string
  from_category_id: string
  to_category_id:   string
  amount:           number
  reason:           string
  approved_by:      string
  created_at:       string
  // Joined fields
  from_category_name?: string
  to_category_name?:   string
  approver_name?:      string
}

export interface FundingTranche {
  id:              string
  program_id:      string
  organization_id: string
  donor_id:        string | null
  funder_name:     string | null
  tranche_number:  number
  expected_amount: number
  received_amount: number | null
  currency:        string
  expected_date:   string
  received_date:   string | null
  status:          TrancheStatus
  notes:           string | null
  created_at:      string
  updated_at:      string
}

// ── Computed view types ───────────────────────────────────────────────────────

export interface BudgetSummary {
  program_id:      string
  organization_id: string
  total_allocated: number
  total_spent:     number
  total_remaining: number
  burn_rate_pct:   number | null
}

export interface CategorySpend {
  category_id:     string
  program_id:      string
  organization_id: string
  name:            string
  description:     string | null
  allocated_amount: number
  currency:        string
  color:           string
  sort_order:      number
  spent:           number
  remaining:       number
  burn_rate_pct:   number | null
}

// ── Donor-safe budget view ────────────────────────────────────────────────────
// Individual expenditures are NEVER included — only aggregated numbers.

export interface DonorBudgetView {
  // From programs table
  total_budget:      number | null
  currency:          string
  // From v_budget_summary
  budget_summary:    DonorBudgetSummary | null
  // From v_category_spend — name + numbers only, no line items
  category_spend:    DonorCategorySpend[]
  // Funding tranches — only donor's own if INDICATORS_AND_BUDGET, all if FULL
  funding_tranches:  FundingTranche[]
}

export interface DonorBudgetSummary {
  total_allocated:  number
  total_spent:      number
  total_remaining:  number
  burn_rate_pct:    number | null
}

export interface DonorCategorySpend {
  category_id:      string
  name:             string
  allocated_amount: number
  currency:         string
  color:            string
  spent:            number
  remaining:        number
  burn_rate_pct:    number | null
}

// ── Create / update payloads ──────────────────────────────────────────────────

export interface CreateBudgetCategoryPayload {
  name:             string
  description?:     string
  allocated_amount: number
  currency?:        string
  color?:           string
  sort_order?:      number
}

export interface UpdateBudgetCategoryPayload extends Partial<CreateBudgetCategoryPayload> {}

export interface SubmitExpenditurePayload {
  budget_category_id?: string
  description:         string
  amount:              number
  currency?:           string
  transaction_date:    string
  payment_method?:     string
  reference_number?:   string
  receipt_url?:        string
  notes?:              string
}

export interface CreateBudgetAmendmentPayload {
  from_category_id: string
  to_category_id:   string
  amount:           number
  reason:           string
}

export interface CreateFundingTranchePayload {
  donor_id?:       string
  funder_name?:    string
  tranche_number:  number
  expected_amount: number
  currency?:       string
  expected_date:   string
  notes?:          string
}

export interface UpdateFundingTranchePayload {
  received_amount?: number
  received_date?:   string
  status?:          TrancheStatus
  notes?:           string
  expected_amount?: number
  expected_date?:   string
}
