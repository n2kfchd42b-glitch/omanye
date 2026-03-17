// ── OMANYE Field Data & M&E Types ─────────────────────────────────────────────

// ── Enums ─────────────────────────────────────────────────────────────────────

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'FLAGGED'

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT:     'Draft',
  SUBMITTED: 'Submitted',
  REVIEWED:  'Reviewed',
  FLAGGED:   'Flagged',
}

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, { bg: string; text: string; dot: string }> = {
  DRAFT:     { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  SUBMITTED: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  REVIEWED:  { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  FLAGGED:   { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

export type FormFieldType = 'text' | 'number' | 'select' | 'date' | 'boolean'

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text:    'Text',
  number:  'Number',
  select:  'Select',
  date:    'Date',
  boolean: 'Yes/No',
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface FormField {
  key:       string
  label:     string
  type:      FormFieldType
  required:  boolean
  options?:  string[]
}

export interface FieldCollectionForm {
  id:              string
  program_id:      string
  organization_id: string
  name:            string
  description:     string
  fields:          FormField[]
  active:          boolean
  created_by:      string
  created_at:      string
  updated_at:      string
  // Joined
  creator_name?:   string
}

export interface FieldSubmission {
  id:              string
  program_id:      string
  organization_id: string
  submitted_by:    string
  submission_date: string
  location_name:   string
  location_lat:    number | null
  location_lng:    number | null
  data:            Record<string, unknown>
  notes:           string
  attachments:     SubmissionAttachment[]
  status:          SubmissionStatus
  reviewed_by:     string | null
  reviewed_at:     string | null
  created_at:      string
  updated_at:      string
  // Joined
  submitter_name?: string
  reviewer_name?:  string
  form_id?:        string
  form_name?:      string
}

export interface SubmissionAttachment {
  name: string
  url:  string
  type: string
}

export interface MaeSummary {
  total_submissions:      number
  submissions_this_month: number
  by_status:              Record<SubmissionStatus, number>
  by_location:            { location_name: string; count: number }[]
  last_submission_date:   string | null
  active_forms_count:     number
}

// ── API Payloads ──────────────────────────────────────────────────────────────

export interface CreateFormPayload {
  program_id:  string
  name:        string
  description: string
  fields:      FormField[]
}

export interface UpdateFormPayload {
  name?:        string
  description?: string
  fields?:      FormField[]
  active?:      boolean
}

export interface CreateSubmissionPayload {
  program_id:      string
  form_id?:        string
  submission_date: string
  location_name:   string
  location_lat?:   number | null
  location_lng?:   number | null
  data:            Record<string, unknown>
  notes?:          string
  attachments?:    SubmissionAttachment[]
  status?:         SubmissionStatus
}
