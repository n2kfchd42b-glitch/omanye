// ── OMANYE Database Types ────────────────────────────────────────────────────
// Keep in sync with supabase/migrations/

export type OmanyeRole         = 'NGO_ADMIN' | 'NGO_STAFF' | 'NGO_VIEWER' | 'DONOR'
export type SubscriptionTier   = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type ProgramStatusDB    = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
export type AccessLevel        = 'SUMMARY_ONLY' | 'INDICATORS' | 'INDICATORS_AND_BUDGET' | 'FULL'
export type RequestStatus      = 'PENDING' | 'APPROVED' | 'DENIED'
export type ProgramVisibility  = 'PRIVATE' | 'DONOR_ONLY' | 'PUBLIC'
export type IndicatorFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'ONCE'
export type UpdateType         = 'PROGRESS' | 'MILESTONE' | 'CHALLENGE' | 'DONOR_REPORT' | 'FIELD_DISPATCH'
export type ExpenditureStatus  = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOID'
export type TrancheStatus      = 'EXPECTED' | 'RECEIVED' | 'DELAYED' | 'CANCELLED'

// ── Per-table Row / Insert / Update types ─────────────────────────────────────

type OrgRow = {
  id:                  string
  name:                string
  slug:                string
  logo_url:            string | null
  country:             string | null
  registration_number: string | null
  website:             string | null
  description:         string | null
  subscription_tier:   SubscriptionTier
  created_at:          string
  updated_at:          string
}
type OrgInsert = {
  id?:                 string
  name:                string
  slug:                string
  logo_url?:           string | null
  country?:            string | null
  registration_number?: string | null
  website?:            string | null
  description?:        string | null
  subscription_tier?:  SubscriptionTier
  created_at?:         string
  updated_at?:         string
}
type OrgUpdate = Partial<OrgInsert>

type ProfileRow = {
  id:                  string
  full_name:           string | null
  avatar_url:          string | null
  role:                OmanyeRole
  organization_id:     string | null
  job_title:           string | null
  onboarding_complete: boolean
  created_at:          string
  updated_at:          string
}
type ProfileInsert = {
  id:                  string
  full_name?:          string | null
  avatar_url?:         string | null
  role:                OmanyeRole
  organization_id?:    string | null
  job_title?:          string | null
  onboarding_complete?: boolean
  created_at?:         string
  updated_at?:         string
}
type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>>

type DonorProfileRow = {
  id:                string
  organization_name: string | null
  contact_email:     string | null
  website:           string | null
  created_at:        string
}
type DonorProfileInsert = {
  id:                 string
  organization_name?: string | null
  contact_email?:     string | null
  website?:           string | null
  created_at?:        string
}
type DonorProfileUpdate = Partial<Omit<DonorProfileInsert, 'id'>>

type ProgramRow = {
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
  deleted_at:       string | null
  created_at:       string
  updated_at:       string
}
type ProgramInsert = {
  id?:              string
  organization_id:  string
  name:             string
  status?:          ProgramStatusDB
  description?:     string | null
  objective?:       string | null
  start_date?:      string | null
  end_date?:        string | null
  location_country?: string | null
  location_region?: string | null
  primary_funder?:  string | null
  total_budget?:    number | null
  currency?:        string
  logframe_url?:    string | null
  cover_image_url?: string | null
  tags?:            string[]
  visibility?:      ProgramVisibility
  deleted_at?:      string | null
  created_at?:      string
  updated_at?:      string
}
type ProgramUpdate = Partial<ProgramInsert>

type IndicatorRow = {
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
type IndicatorInsert = {
  id?:               string
  program_id:        string
  organization_id:   string
  name:              string
  description?:      string | null
  category?:         string | null
  unit?:             string | null
  target_value?:     number | null
  current_value?:    number
  baseline_value?:   number | null
  frequency?:        IndicatorFrequency
  data_source?:      string | null
  is_key_indicator?: boolean
  visible_to_donors?: boolean
  sort_order?:       number
  created_by?:       string | null
  created_at?:       string
  updated_at?:       string
}
type IndicatorUpdate = Partial<IndicatorInsert>

type IndicatorUpdateRow = {
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
type IndicatorUpdateInsert = {
  id?:                     string
  indicator_id:            string
  program_id:              string
  organization_id:         string
  previous_value?:         number | null
  new_value:               number
  reporting_period_start?: string | null
  reporting_period_end?:   string | null
  notes?:                  string | null
  source?:                 string | null
  submitted_by?:           string | null
  submitted_at?:           string
}

type ProgramUpdateRow = {
  id:                string
  program_id:        string
  organization_id:   string
  title:             string
  body:              string | null
  update_type:       UpdateType
  visible_to_donors: boolean
  attachments:       { name: string; url: string; type: string }[]
  published_at:      string | null
  created_by:        string | null
  created_at:        string
  updated_at:        string
}
type ProgramUpdateInsert = {
  id?:               string
  program_id:        string
  organization_id:   string
  title:             string
  body?:             string | null
  update_type?:      UpdateType
  visible_to_donors?: boolean
  attachments?:      { name: string; url: string; type: string }[]
  published_at?:     string | null
  created_by?:       string | null
  created_at?:       string
  updated_at?:       string
}
type ProgramUpdateUpdate = Partial<ProgramUpdateInsert>

type DPARow = {
  id:                   string
  donor_id:             string
  program_id:           string
  organization_id:      string
  granted_by:           string
  access_level:         AccessLevel
  can_download_reports: boolean
  active:               boolean
  granted_at:           string
  expires_at:           string | null
}
type DPAInsert = {
  id?:                   string
  donor_id:              string
  program_id:            string
  organization_id:       string
  granted_by:            string
  access_level?:         AccessLevel
  can_download_reports?: boolean
  active?:               boolean
  granted_at?:           string
  expires_at?:           string | null
}
type DPAUpdate = Partial<DPAInsert>

type DARRow = {
  id:                     string
  donor_id:               string
  program_id:             string
  organization_id:        string
  requested_access_level: AccessLevel
  message:                string | null
  status:                 RequestStatus
  reviewed_by:            string | null
  reviewed_at:            string | null
  response_message:       string | null
  created_at:             string
}
type DARInsert = {
  id?:                     string
  donor_id:                string
  program_id:              string
  organization_id:         string
  requested_access_level:  AccessLevel
  message?:                string | null
  status?:                 RequestStatus
  reviewed_by?:            string | null
  reviewed_at?:            string | null
  response_message?:       string | null
  created_at?:             string
}
type DARUpdate = Partial<DARInsert>

// ── Budget table types ────────────────────────────────────────────────────────

type BudgetCategoryRow = {
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
type BudgetCategoryInsert = {
  id?:              string
  program_id:       string
  organization_id:  string
  name:             string
  description?:     string | null
  allocated_amount: number
  currency?:        string
  color?:           string
  sort_order?:      number
  created_at?:      string
  updated_at?:      string
}
type BudgetCategoryUpdate = Partial<BudgetCategoryInsert>

type ExpenditureRow = {
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
}
type ExpenditureInsert = {
  id?:                 string
  program_id:          string
  organization_id:     string
  budget_category_id?: string | null
  description:         string
  amount:              number
  currency?:           string
  transaction_date:    string
  payment_method?:     string | null
  reference_number?:   string | null
  receipt_url?:        string | null
  approved_by?:        string | null
  approved_at?:        string | null
  status?:             ExpenditureStatus
  notes?:              string | null
  submitted_by:        string
  created_at?:         string
  updated_at?:         string
}
type ExpenditureUpdate = Partial<ExpenditureInsert>

type BudgetAmendmentRow = {
  id:               string
  program_id:       string
  organization_id:  string
  from_category_id: string
  to_category_id:   string
  amount:           number
  reason:           string
  approved_by:      string
  created_at:       string
}
type BudgetAmendmentInsert = {
  id?:              string
  program_id:       string
  organization_id:  string
  from_category_id: string
  to_category_id:   string
  amount:           number
  reason:           string
  approved_by:      string
  created_at?:      string
}

type FundingTrancheRow = {
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
type FundingTrancheInsert = {
  id?:              string
  program_id:       string
  organization_id:  string
  donor_id?:        string | null
  funder_name?:     string | null
  tranche_number?:  number
  expected_amount:  number
  received_amount?: number | null
  currency?:        string
  expected_date:    string
  received_date?:   string | null
  status?:          TrancheStatus
  notes?:           string | null
  created_at?:      string
  updated_at?:      string
}
type FundingTrancheUpdate = Partial<FundingTrancheInsert>

// ── Database interface ────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row:           OrgRow
        Insert:        OrgInsert
        Update:        OrgUpdate
        Relationships: []
      }
      profiles: {
        Row:           ProfileRow
        Insert:        ProfileInsert
        Update:        ProfileUpdate
        Relationships: []
      }
      donor_profiles: {
        Row:           DonorProfileRow
        Insert:        DonorProfileInsert
        Update:        DonorProfileUpdate
        Relationships: []
      }
      programs: {
        Row:           ProgramRow
        Insert:        ProgramInsert
        Update:        ProgramUpdate
        Relationships: []
      }
      indicators: {
        Row:           IndicatorRow
        Insert:        IndicatorInsert
        Update:        IndicatorUpdate
        Relationships: []
      }
      indicator_updates: {
        Row:           IndicatorUpdateRow
        Insert:        IndicatorUpdateInsert
        Update:        never
        Relationships: []
      }
      program_updates: {
        Row:           ProgramUpdateRow
        Insert:        ProgramUpdateInsert
        Update:        ProgramUpdateUpdate
        Relationships: []
      }
      donor_program_access: {
        Row:           DPARow
        Insert:        DPAInsert
        Update:        DPAUpdate
        Relationships: []
      }
      donor_access_requests: {
        Row:           DARRow
        Insert:        DARInsert
        Update:        DARUpdate
        Relationships: []
      }
      budget_categories: {
        Row:           BudgetCategoryRow
        Insert:        BudgetCategoryInsert
        Update:        BudgetCategoryUpdate
        Relationships: []
      }
      expenditures: {
        Row:           ExpenditureRow
        Insert:        ExpenditureInsert
        Update:        ExpenditureUpdate
        Relationships: []
      }
      budget_amendments: {
        Row:           BudgetAmendmentRow
        Insert:        BudgetAmendmentInsert
        Update:        never
        Relationships: []
      }
      funding_tranches: {
        Row:           FundingTrancheRow
        Insert:        FundingTrancheInsert
        Update:        FundingTrancheUpdate
        Relationships: []
      }
    }

    Views: {
      v_budget_summary: {
        Row: {
          program_id:      string
          organization_id: string
          total_allocated: number
          total_spent:     number
          total_remaining: number
          burn_rate_pct:   number | null
        }
      }
      v_category_spend: {
        Row: {
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
      }
    }

    Functions: {
      current_user_role:           { Args: Record<never, never>; Returns: OmanyeRole | null }
      current_user_org:            { Args: Record<never, never>; Returns: string | null }
      is_ngo_member:               { Args: { org_id: string };   Returns: boolean }
      is_ngo_admin:                { Args: { org_id: string };   Returns: boolean }
      is_ngo_editor:               { Args: { org_id: string };   Returns: boolean }
      donor_can_access_program:    { Args: { prog_id: string };  Returns: boolean }
      donor_access_level_for:      { Args: { prog_id: string };  Returns: AccessLevel | null }
    }

    Enums: {
      omanye_role:          OmanyeRole
      subscription_tier:    SubscriptionTier
      program_status:       ProgramStatusDB
      access_level:         AccessLevel
      request_status:       RequestStatus
      program_visibility:   ProgramVisibility
      indicator_frequency:  IndicatorFrequency
      update_type:          UpdateType
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
