// ── OMANYE Donor Management Types ─────────────────────────────────────────────

import type { AccessLevel } from '@/lib/supabase/database.types'

export type { AccessLevel }

// ── Enums ─────────────────────────────────────────────────────────────────────

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export type DonorNotificationType =
  | 'ACCESS_GRANTED'
  | 'ACCESS_UPDATED'
  | 'ACCESS_REVOKED'
  | 'NEW_UPDATE'
  | 'NEW_REPORT'
  | 'REQUEST_APPROVED'
  | 'REQUEST_DENIED'
  | 'TRANCHE_REMINDER'

// ── Enum arrays for iteration ──────────────────────────────────────────────────

export const INVITATION_STATUSES: InvitationStatus[] = [
  'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED',
]

// ── Labels ────────────────────────────────────────────────────────────────────

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING:  'Pending',
  ACCEPTED: 'Accepted',
  EXPIRED:  'Expired',
  REVOKED:  'Revoked',
}

export const INVITATION_STATUS_COLORS: Record<InvitationStatus, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#D4AF5C20', text: '#D4AF5C', dot: '#D4AF5C' },
  ACCEPTED: { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  EXPIRED:  { bg: '#2D3F5C',   text: '#A0AEC0', dot: '#6B7A99' },
  REVOKED:  { bg: '#E53E3E20', text: '#E53E3E', dot: '#E53E3E' },
}

export const NOTIFICATION_TYPE_LABELS: Record<DonorNotificationType, string> = {
  ACCESS_GRANTED:    'Access Granted',
  ACCESS_UPDATED:    'Access Updated',
  ACCESS_REVOKED:    'Access Revoked',
  NEW_UPDATE:        'New Program Update',
  NEW_REPORT:        'New Report',
  REQUEST_APPROVED:  'Request Approved',
  REQUEST_DENIED:    'Request Denied',
  TRANCHE_REMINDER:  'Funding Reminder',
}

// Access level colors for badges
export const ACCESS_LEVEL_BADGE_COLORS: Record<AccessLevel, { bg: string; text: string; border: string }> = {
  SUMMARY_ONLY:          { bg: '#2D3F5C', text: '#A0AEC0', border: '#3D4F6C'    },
  INDICATORS:            { bg: '#1A3A5C', text: '#60A5FA', border: '#1A3A5C'    },
  INDICATORS_AND_BUDGET: { bg: '#3A2D1A', text: '#D4AF5C', border: '#D4AF5C40' },
  FULL:                  { bg: '#0F1B33', text: '#FFFFFF', border: '#D4AF5C'    },
}

// ── Domain Interfaces ─────────────────────────────────────────────────────────

export interface DonorInvitation {
  id:                   string
  organization_id:      string
  program_id:           string
  invited_by:           string
  email:                string
  donor_name:           string | null
  organization_name:    string | null
  access_level:         AccessLevel
  can_download_reports: boolean
  token:                string
  message:              string | null
  status:               InvitationStatus
  expires_at:           string
  accepted_at:          string | null
  created_at:           string
  // Joined fields
  program_name?:        string | null
  inviter_name?:        string | null
  org_name?:            string | null
}

export interface DonorNotification {
  id:              string
  donor_id:        string
  organization_id: string
  program_id:      string | null
  type:            DonorNotificationType
  title:           string
  body:            string
  link:            string | null
  read:            boolean
  created_at:      string
  // Joined fields
  program_name?:   string | null
  org_name?:       string | null
}

// Extended donor_program_access with new columns
export interface DonorProgramAccessExtended {
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
  nickname:             string | null
  internal_notes:       string | null  // never returned to donor
  last_viewed_at:       string | null
  view_count:           number
  // Joined fields
  program_name?:        string | null
  program_status?:      string | null
  granter_name?:        string | null
}

// A donor and all their program access rows
export interface DonorRelationship {
  donor_id:          string
  full_name:         string | null
  avatar_url:        string | null
  email:             string
  organization_name: string | null  // from donor_profiles
  joined_at:         string
  access:            DonorProgramAccessExtended[]
}

// Activity summary per program for a donor
export interface DonorActivitySummary {
  donor_id:      string
  program_id:    string
  program_name:  string
  last_viewed_at: string | null
  view_count:    number
}

// ── Create/Update Payloads ────────────────────────────────────────────────────

export interface InviteDonorPayload {
  email:                string
  donor_name?:          string
  organization_name?:   string
  message?:             string
  program_id:           string
  access_level:         AccessLevel
  can_download_reports?: boolean
  expires_at?:          string   // optional custom expiry
}

export interface UpdateDonorAccessPayload {
  access_level?:         AccessLevel
  can_download_reports?: boolean
  nickname?:             string
  expires_at?:           string | null
}

export interface GrantProgramAccessPayload {
  donor_id:             string
  program_id:           string
  access_level:         AccessLevel
  can_download_reports?: boolean
  nickname?:            string
  message?:             string
  expires_at?:          string | null
}

export interface ApproveAccessRequestPayload {
  access_level?: AccessLevel  // can override the requested level
}

export interface DenyAccessRequestPayload {
  response_message: string
}
