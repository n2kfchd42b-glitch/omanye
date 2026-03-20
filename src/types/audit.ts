// ── Audit Trail & Notifications Types ─────────────────────────────────────────

// ── Audit ─────────────────────────────────────────────────────────────────────

export type AuditAction =
  // Programs
  | 'program.created'
  | 'program.updated'
  | 'program.deleted'
  | 'program.visibility_changed'
  // Indicators
  | 'indicator.created'
  | 'indicator.updated'
  | 'indicator.value_updated'
  // Budget
  | 'expenditure.submitted'
  | 'expenditure.approved'
  | 'expenditure.rejected'
  | 'budget.reallocated'
  // Reports
  | 'report.created'
  | 'report.generated'
  | 'report.published'
  | 'report.submitted'
  // Donors
  | 'donor.invited'
  | 'donor.access_granted'
  | 'donor.access_updated'
  | 'donor.access_revoked'
  | 'donor.request_approved'
  | 'donor.request_denied'
  // Team
  | 'team.member_invited'
  | 'team.member_joined'
  | 'team.member_removed'
  | 'team.role_changed'
  // Field
  | 'field.form_created'
  | 'field.submission_created'
  | 'field.submission_reviewed'
  | 'field.submission_flagged'
  | 'field.batch_sync'
  // Deletions
  | 'indicator.deleted'
  | 'report.deleted'
  // Reports
  | 'report.archived'

export interface AuditLogEntry {
  organizationId: string
  actorId:        string
  actorName:      string
  actorRole:      string
  action:         AuditAction
  entityType?:    string
  entityId?:      string
  entityName?:    string
  changes?:       Record<string, { from: unknown; to: unknown }>
  metadata?:      Record<string, unknown>
  ipAddress?:     string
}

export interface AuditLog {
  id:              string
  organization_id: string
  actor_id:        string | null
  actor_name:      string
  actor_role:      string
  action:          AuditAction
  entity_type:     string | null
  entity_id:       string | null
  entity_name:     string | null
  changes:         Record<string, { from: unknown; to: unknown }> | null
  metadata:        Record<string, unknown> | null
  ip_address:      string | null
  created_at:      string
}

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'PROGRAM_CREATED'
  | 'PROGRAM_UPDATED'
  | 'PROGRAM_STATUS_CHANGED'
  | 'INDICATOR_UPDATED'
  | 'INDICATOR_OFF_TRACK'
  | 'EXPENDITURE_SUBMITTED'
  | 'EXPENDITURE_APPROVED'
  | 'EXPENDITURE_REJECTED'
  | 'REPORT_GENERATED'
  | 'REPORT_SUBMITTED'
  | 'FIELD_SUBMISSION_FLAGGED'
  | 'TEAM_MEMBER_JOINED'
  | 'TEAM_MEMBER_REMOVED'
  | 'DONOR_ACCESS_REQUESTED'
  | 'DONOR_ACCESS_GRANTED'
  | 'BUDGET_WARNING'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH'

/** HIGH-priority types that cannot be disabled in preferences */
export const HIGH_PRIORITY_TYPES: NotificationType[] = [
  'INDICATOR_OFF_TRACK',
  'BUDGET_WARNING',
  'DONOR_ACCESS_REQUESTED',
]

export interface Notification {
  id:              string
  organization_id: string
  recipient_id:    string
  type:            NotificationType
  title:           string
  body:            string
  link:            string | null
  read:            boolean
  priority:        NotificationPriority
  created_at:      string
}

export interface NotificationPreferences {
  id:                       string
  profile_id:               string
  email_notifications:      boolean
  notify_program_updates:   boolean
  notify_indicator_updates: boolean
  notify_expenditures:      boolean
  notify_reports:           boolean
  notify_field_submissions: boolean
  notify_team_changes:      boolean
  notify_donor_activity:    boolean
  notify_budget_warnings:   boolean
  created_at:               string
  updated_at:               string
}

export interface NotificationPayload {
  organizationId: string
  recipientId:    string
  type:           NotificationType
  title:          string
  body:           string
  link?:          string
  priority:       NotificationPriority
}

// ── Action label map (for UI display) ─────────────────────────────────────────

export const ACTION_LABELS: Record<AuditAction, string> = {
  'program.created':           'Created program',
  'program.updated':           'Updated program',
  'program.deleted':           'Deleted program',
  'program.visibility_changed':'Changed program visibility',
  'indicator.created':         'Created indicator',
  'indicator.updated':         'Updated indicator',
  'indicator.value_updated':   'Updated indicator value',
  'expenditure.submitted':     'Submitted expenditure',
  'expenditure.approved':      'Approved expenditure',
  'expenditure.rejected':      'Rejected expenditure',
  'budget.reallocated':        'Reallocated budget',
  'report.created':            'Created report',
  'report.generated':          'Generated report',
  'report.published':          'Published report',
  'report.submitted':          'Submitted report',
  'donor.invited':             'Invited donor',
  'donor.access_granted':      'Granted donor access',
  'donor.access_updated':      'Updated donor access',
  'donor.access_revoked':      'Revoked donor access',
  'donor.request_approved':    'Approved donor request',
  'donor.request_denied':      'Denied donor request',
  'team.member_invited':       'Invited team member',
  'team.member_joined':        'Team member joined',
  'team.member_removed':       'Removed team member',
  'team.role_changed':         'Changed team member role',
  'field.form_created':         'Created field form',
  'field.submission_created':  'Created field submission',
  'field.submission_reviewed': 'Reviewed field submission',
  'field.submission_flagged':  'Flagged field submission',
  'field.batch_sync':          'Batch-synced offline submissions',
  'indicator.deleted':         'Deleted indicator',
  'report.deleted':            'Deleted report',
  'report.archived':           'Archived report',
}
