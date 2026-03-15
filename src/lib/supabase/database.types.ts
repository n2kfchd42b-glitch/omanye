// ── OMANYE Database Types ────────────────────────────────────────────────────
// Generated from supabase/migrations/001_auth_roles.sql
// Keep in sync with the migration file.

export type OmanyeRole        = 'NGO_ADMIN' | 'NGO_STAFF' | 'NGO_VIEWER' | 'DONOR'
export type SubscriptionTier  = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
export type ProgramStatusDB   = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'SUSPENDED'
export type AccessLevel       = 'SUMMARY_ONLY' | 'INDICATORS' | 'INDICATORS_AND_BUDGET' | 'FULL'
export type RequestStatus     = 'PENDING' | 'APPROVED' | 'DENIED'

// ── Per-table Row / Insert / Update types (no circular refs) ──────────────────

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
  id:              string
  organization_id: string
  name:            string
  status:          ProgramStatusDB
  created_at:      string
  updated_at:      string
}
type ProgramInsert = {
  id?:             string
  organization_id: string
  name:            string
  status?:         ProgramStatusDB
  created_at?:     string
  updated_at?:     string
}
type ProgramUpdate = Partial<ProgramInsert>

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
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      current_user_role: { Args: Record<never, never>; Returns: OmanyeRole | null }
      current_user_org:  { Args: Record<never, never>; Returns: string | null }
      is_ngo_member:     { Args: { org_id: string };   Returns: boolean }
      is_ngo_admin:      { Args: { org_id: string };   Returns: boolean }
      is_ngo_editor:     { Args: { org_id: string };   Returns: boolean }
    }

    Enums: {
      omanye_role:       OmanyeRole
      subscription_tier: SubscriptionTier
      program_status:    ProgramStatusDB
      access_level:      AccessLevel
      request_status:    RequestStatus
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
