// ── OMANYE Auth Types ─────────────────────────────────────────────────────────
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type {
  OmanyeRole,
  AccessLevel,
  RequestStatus,
  SubscriptionTier,
  ProgramStatusDB,
} from '@/lib/supabase/database.types'

// Re-export for convenience
export type { OmanyeRole, AccessLevel, RequestStatus, SubscriptionTier, ProgramStatusDB }

// ── Core domain objects ───────────────────────────────────────────────────────

export interface Organization {
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

export interface Profile {
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

export interface DonorProfile {
  id:                string
  organization_name: string | null
  contact_email:     string | null
  website:           string | null
  created_at:        string
}

export interface DonorProgramAccess {
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

export interface DonorAccessRequest {
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

// ── Composite auth type ───────────────────────────────────────────────────────
// Merges Supabase User with our Profile row for convenient access.

export type AuthUser = SupabaseUser & {
  profile: Profile
  organization: Organization | null
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export const isNGORole = (role: OmanyeRole): boolean =>
  ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(role)

export const canEditData = (role: OmanyeRole): boolean =>
  ['NGO_ADMIN', 'NGO_STAFF'].includes(role)

export const isAdmin = (role: OmanyeRole): boolean => role === 'NGO_ADMIN'

export const isDonor = (role: OmanyeRole): boolean => role === 'DONOR'

// Human-readable role labels
export const ROLE_LABELS: Record<OmanyeRole, string> = {
  NGO_ADMIN:  'Admin',
  NGO_STAFF:  'Staff',
  NGO_VIEWER: 'Viewer',
  DONOR:      'Donor',
}

// Access level descriptions for the donor portal
export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  SUMMARY_ONLY:          'Summary Only',
  INDICATORS:            'Indicators',
  INDICATORS_AND_BUDGET: 'Indicators & Budget',
  FULL:                  'Full Access',
}

export const ACCESS_LEVEL_DESCRIPTIONS: Record<AccessLevel, string> = {
  SUMMARY_ONLY:          'Program overview and narrative updates',
  INDICATORS:            'Summary + KPI progress and targets',
  INDICATORS_AND_BUDGET: 'Indicators + budget burn rate',
  FULL:                  'All data the NGO has not explicitly hidden',
}
