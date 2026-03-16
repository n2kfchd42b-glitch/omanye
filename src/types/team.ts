// ── OMANYE Team Management Types ─────────────────────────────────────────────

import type { OmanyeRole } from '@/lib/supabase/database.types'

// ── Enums ─────────────────────────────────────────────────────────────────────

export type TeamInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

// ── DB Row types ──────────────────────────────────────────────────────────────

export interface TeamInvitation {
  id:              string
  organization_id: string
  invited_by:      string
  email:           string
  full_name:       string | null
  role:            OmanyeRole
  token:           string
  message:         string | null
  status:          TeamInvitationStatus
  expires_at:      string
  accepted_at:     string | null
  created_at:      string
  // Joined fields
  inviter_name?:   string | null
}

export interface ProgramAssignment {
  id:              string
  program_id:      string
  profile_id:      string
  organization_id: string
  assigned_by:     string
  assigned_at:     string
  // Joined fields
  program_name?:   string | null
  program_status?: string | null
}

// ── UI types ──────────────────────────────────────────────────────────────────

export interface TeamMemberDB {
  id:                  string
  full_name:           string | null
  avatar_url:          string | null
  role:                OmanyeRole
  organization_id:     string | null
  job_title:           string | null
  created_at:          string
  // Auth user email (joined)
  email:               string
  // Program assignments for this member
  assignments:         ProgramAssignment[]
}

export interface OrgSettings {
  id:                  string
  name:                string
  slug:                string
  logo_url:            string | null
  country:             string | null
  registration_number: string | null
  website:             string | null
  description:         string | null
  subscription_tier:   string
  created_at:          string
  updated_at:          string
  // Social links stored in description or separate fields
  twitter_url?:        string | null
  linkedin_url?:       string | null
}

// ── API payloads ──────────────────────────────────────────────────────────────

export interface InviteMemberPayload {
  email:       string
  full_name:   string
  role:        OmanyeRole
  message?:    string | null
  program_ids?: string[]
}

export interface ChangeRolePayload {
  role: OmanyeRole
}

export interface CreateAssignmentPayload {
  program_id: string
  profile_id: string
}
