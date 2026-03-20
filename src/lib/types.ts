// ── OMANYE TypeScript Interfaces ──────────────────────────────────────────────

export type UserRole =
  | 'Project Lead'
  | 'Field Staff'
  | 'M&E Officer'
  | 'Supervisor'
  | 'Donor'
  | 'Viewer'
  | 'Admin'

export interface User {
  name:  string
  email: string
  org:   string
  role:  UserRole
}

export type ProgramStatus = 'planning' | 'active' | 'paused' | 'completed'

export interface Indicator {
  id:        number
  programId: number
  name:      string
  target:    number
  current:   number
  unit:      string
}

export interface BudgetCategory {
  id:        number
  programId: number
  name:      string
  allocated: number
  spent:     number
}

export interface LogframeRow {
  id:                  number
  programId:           number
  level:               'goal' | 'outcome' | 'output' | 'activity'
  description:         string
  indicatorIds:        number[]
  meansOfVerification: string
  assumptions:         string
  status:              'not_started' | 'on_track' | 'at_risk' | 'off_track'
  order:               number
}

export interface Program {
  id:               number
  name:             string
  funder:           string
  location:         string
  objective:        string
  budget:           number
  spent:            number
  currency:         string
  start:            string
  end:              string
  status:           ProgramStatus
  progress:         number
  indicators:       Indicator[]
  budgetCategories: BudgetCategory[]
  logframe:         LogframeRow[]
  createdAt:        string
}

export type DataSource    = 'KoBoToolbox' | 'REDCap' | 'ODK Central' | 'Upload' | 'Google Sheets'
export type DatasetStatus = 'processing' | 'clean' | 'review' | 'error'

export interface Dataset {
  id:         number
  name:       string
  source:     DataSource
  rows:       number | string
  cols:       number | string
  size:       string
  status:     DatasetStatus
  updated:    string
  programId?: number
}

export interface Analysis {
  id:        number
  title:     string
  type:      string
  status:    'running' | 'done' | 'error'
  createdAt: string
  programId?: number
}

export type DocumentType   = 'logframe' | 'report' | 'framework' | 'manual' | 'proposal' | 'other'
export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'submitted'

export interface Section {
  id:     number
  title:  string
  author: string
}

export interface Document {
  id:       number
  name:     string
  type:     DocumentType
  status:   DocumentStatus
  program:  string
  updated:  string
  sections: Section[]
}

export interface Comment {
  id:     number
  author: string
  role:   UserRole
  text:   string
  time:   string
}

export interface TeamMember {
  id:     number
  name:   string
  email:  string
  role:   UserRole
  org:    string
  status: 'active' | 'pending'
  joined: string
}

export interface DonorReport {
  id:          number
  title:       string
  programId:   number
  programName: string
  funder:      string
  period:      { start: string; end: string }
  format:      'pdf' | 'word' | 'both'
  sections:    string[]
  challenges:  string
  status:      'draft' | 'generated' | 'submitted'
  createdAt:   string
}

export type TriggerType =
  | 'indicator_below'
  | 'indicator_above'
  | 'budget_burn'
  | 'report_due'
  | 'submission_overdue'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface AlertRule {
  id:             number
  name:           string
  triggerType:    TriggerType
  programId?:     number
  programName?:   string
  indicatorId?:   number
  indicatorName?: string
  threshold:      number
  unit?:          string
  channels:       ('inapp' | 'email')[]
  severity:       Severity
  active:         boolean
  lastTriggered?: string
  createdAt:      string
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'EXPORT'
  | 'LOGIN'
  | 'INVITE'

export type AuditResource =
  | 'Program'
  | 'Indicator'
  | 'Budget'
  | 'Document'
  | 'Dataset'
  | 'Team'
  | 'Report'
  | 'Alert'
  | 'Settings'

export interface AuditEntry {
  id:           number
  timestamp:    string
  actor:        string
  action:       AuditAction
  resource:     AuditResource
  resourceName: string
  details:      string
  ip:           string
}

export interface FieldAssignment {
  id:           number
  staffName:    string
  district:     string
  status:       'submitted' | 'pending' | 'overdue' | 'not_started'
  submittedAt?: string
  records?:     number
}

export interface CollectionPeriod {
  id:          number
  name:        string
  programId:   number
  programName: string
  dueDate:     string
  status:      'open' | 'closed' | 'overdue'
  assignments: FieldAssignment[]
}

// ── UI navigation ──────────────────────────────────────────────────────────────

export type ViewId =
  | 'dashboard'
  | 'programs'
  | 'program-detail'
  | 'donors'
  | 'data-hub'
  | 'analytics'
  | 'reports'
  | 'documents'
  | 'fieldstatus'
  | 'audit'
  | 'team'
  | 'map'
  | 'settings'
  | 'funders'
  | 'grants'
  | 'impact'

export type ToastVariant = 'success' | 'error' | 'warn'

export interface ToastItem {
  id:       string
  variant:  ToastVariant
  message:  string
  duration: number
}

export interface NotifPrefs {
  submissions:  boolean
  weeklyDigest: boolean
  milestones:   boolean
  teamActivity: boolean
  donorReports: boolean
}
