// ── OMANYE TypeScript Interfaces ─────────────────────────────────────────────

// ── Enumerations ──────────────────────────────────────────────────────────────

export type ProgramStatus  = 'active' | 'pending' | 'completed' | 'on-hold'
export type Gender         = 'M' | 'F' | 'Non-binary' | 'Prefer not to say'
export type UserRole       = 'admin' | 'coordinator' | 'field-officer' | 'm-and-e' | 'viewer'
export type SourceType     = 'foundation' | 'government' | 'individual' | 'corporate' | 'earned'
export type ReportStatus   = 'draft' | 'review' | 'submitted' | 'published'
export type SubmissionStatus = 'pending' | 'validated' | 'flagged' | 'rejected'
export type IndicatorType  = 'output' | 'outcome' | 'impact'
export type DocType        = 'report' | 'proposal' | 'mou' | 'budget' | 'assessment' | 'other'
export type ToastVariant   = 'success' | 'error' | 'warning' | 'info'
export type ViewId         =
  | 'dashboard'
  | 'programs'
  | 'program-detail'
  | 'data-hub'
  | 'analytics'
  | 'documents'
  | 'team'
  | 'field-map'
  | 'settings'

// ── Core domain types ─────────────────────────────────────────────────────────

export interface Program {
  id:            string
  name:          string
  status:        ProgramStatus
  region:        string
  country:       string
  sector:        string[]
  lead:          string            // TeamMember id
  team:          string[]          // TeamMember ids
  beneficiaries: number
  targetBenef:   number
  budget:        number
  spent:         number
  progress:      number            // 0-100
  startDate:     string            // ISO date
  endDate:       string            // ISO date
  description:   string
  indicators:    Indicator[]
  budgetLines:   BudgetLine[]
  donors:        string[]          // Donor ids
  createdAt:     string
  updatedAt:     string
}

export interface Indicator {
  id:       string
  label:    string
  type:     IndicatorType
  baseline: number
  target:   number
  current:  number
  unit:     string
  notes?:   string
}

export interface BudgetLine {
  id:          string
  category:    string
  description: string
  allocated:   number
  spent:       number
}

export interface Beneficiary {
  id:        string
  name:      string
  age:       number
  gender:    Gender
  region:    string
  programId: string
  status:    'enrolled' | 'active' | 'completed' | 'withdrawn'
  enrolledAt:string
  phone?:    string
  notes?:    string
}

export interface TeamMember {
  id:       string
  name:     string
  role:     UserRole
  email:    string
  region:   string
  programs: string[]   // Program ids
  status:   'active' | 'away' | 'inactive'
  joinedAt: string
  avatar?:  string
}

export interface Donor {
  id:         string
  name:       string
  type:       SourceType
  country:    string
  committed:  number
  disbursed:  number
  status:     'active' | 'completed' | 'lapsed'
  programs:   string[]
  contact?:   string
  lastGift:   string
}

export interface FieldSubmission {
  id:        string
  workerId:  string
  workerName:string
  region:    string
  formType:  string
  programId: string
  records:   number
  status:    SubmissionStatus
  submittedAt:string
  notes?:    string
  geoLat?:   number
  geoLng?:   number
}

export interface Document {
  id:        string
  title:     string
  type:      DocType
  programId: string | null
  author:    string
  status:    ReportStatus
  format:    'PDF' | 'XLSX' | 'DOCX' | 'CSV'
  sizeKb:    number
  createdAt: string
  updatedAt: string
}

export interface ActivityEvent {
  id:        string
  type:      'submission' | 'report' | 'donor' | 'milestone' | 'flag' | 'program' | 'enrollment' | 'comment'
  actor:     string
  message:   string
  programId: string | null
  timestamp: string   // relative or ISO
}

export interface GeoPoint {
  id:     string
  lat:    number
  lng:    number
  label:  string
  type:   'beneficiary' | 'submission' | 'program-site'
  region: string
}

// ── UI state types ─────────────────────────────────────────────────────────────

export interface Toast {
  id:       string
  variant:  ToastVariant
  title:    string
  message?: string
  duration: number   // ms; 0 = persistent
}

export interface ModalState {
  isOpen:  boolean
  title:   string
  content: React.ReactNode
  size?:   'sm' | 'md' | 'lg' | 'xl'
  onClose?:() => void
}

export interface OnboardingData {
  orgName:   string
  country:   string
  sector:    string
  progName:  string
  progRegion:string
  inviteEmails: string[]
}

// ── Navigation ─────────────────────────────────────────────────────────────────

export interface NavItem {
  id:       ViewId
  label:    string
  icon:     string        // lucide icon name
  section:  string
  badge?:   string | number
}

// ── Analytics / chart data ─────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  label: string
  value: number
}

export interface CategoryPoint {
  label: string
  value: number
  color: string
}
