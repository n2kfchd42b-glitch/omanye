// ── OMANYE TypeScript Interfaces (matching spec exactly) ─────────────────────

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
  id:      number
  name:    string
  target:  number
  current: number
  unit:    string
}

export interface BudgetCategory {
  id:        number
  name:      string
  allocated: number
  spent:     number
}

export interface Program {
  id:               number
  name:             string
  funder:           string
  location:         string
  budget:           number
  currency:         string
  spent:            number
  start:            string   // ISO date
  end:              string
  status:           ProgramStatus
  progress:         number   // 0–100
  objective:        string
  indicators:       Indicator[]
  budgetCategories: BudgetCategory[]
  createdAt:        string
}

export type DataSource    = 'KoBoToolbox' | 'REDCap' | 'ODK Central' | 'Upload' | 'Google Sheets'
export type DatasetStatus = 'processing' | 'clean' | 'review' | 'error'

export interface Dataset {
  id:        number
  name:      string
  source:    DataSource
  rows:      number | string
  cols:      number | string
  size:      string
  status:    DatasetStatus
  updated:   string
  programId?: number
}

export interface Analysis {
  id:        number
  title:     string
  type:      string
  status:    'running' | 'done' | 'error'
  createdAt: string
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

export interface TeamMember {
  id:     number
  name:   string
  email:  string
  role:   UserRole
  org:    string
  status: 'active' | 'pending'
  joined: string
}

export interface Comment {
  id:     number
  author: string
  role:   UserRole
  text:   string
  time:   string
}

// ── UI navigation ──────────────────────────────────────────────────────────────

export type ViewId =
  | 'dashboard'
  | 'programs'
  | 'program-detail'
  | 'data-hub'
  | 'analytics'
  | 'documents'
  | 'team'
  | 'field-map'
  | 'settings'

export type ToastVariant = 'success' | 'error' | 'warn'

export interface ToastItem {
  id:       string
  variant:  ToastVariant
  message:  string
  duration: number
}

export interface NotifPrefs {
  submissions: boolean
  weeklyDigest: boolean
  milestones: boolean
  teamActivity: boolean
  donorReports: boolean
}
