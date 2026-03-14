// ── OMANYE Design Tokens ─────────────────────────────────────────────────────

export const COLORS = {
  // Forest Green palette
  forest:  '#0D2B1E',
  canopy:  '#133828',
  moss:    '#1A5C3A',
  fern:    '#2E7D52',
  sage:    '#4CAF78',
  mint:    '#7DD4A0',
  mist:    '#C8EDD8',
  foam:    '#EAF7EE',
  snow:    '#F4FAF6',
  gold:    '#D4AF5C',

  // Extended palette
  pearl:   '#F0F7F3',   // card bg, input bg
  stone:   '#6B8F7A',   // muted text, descriptions
  slate:   '#445E4D',   // secondary text
  sky:     '#0EA5E9',   // links, sky-blue
  crimson: '#E5334B',   // errors, admin role
  amber:   '#D97706',   // warnings, planning status
  ink:     '#0A1A10',   // dark overlay
} as const

export const FONTS = {
  heading: 'var(--font-fraunces), Palatino, Georgia, serif',
  body:    'var(--font-instrument), "Instrument Sans", system-ui, sans-serif',
  mono:    'var(--font-mono), "JetBrains Mono", Consolas, monospace',
  logo:    'Palatino, "Palatino Linotype", Georgia, serif',
} as const

export const SPACING = {
  sidebarW:          220,
  sidebarWCollapsed:  56,
  topbarH:            58,
  pagePad:            24,
} as const

// ── Status colors ─────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  // Program statuses
  active:     { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  planning:   { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  paused:     { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  completed:  { bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
  // Document statuses
  draft:      { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  in_review:  { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  approved:   { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  submitted:  { bg: '#E0F2FE', text: '#0369A1', dot: '#0EA5E9' },
  // Dataset statuses
  clean:      { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  processing: { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  review:     { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  error:      { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  // Analysis statuses
  running:    { bg: '#E0F2FE', text: '#0369A1', dot: '#0EA5E9' },
  done:       { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
}

// ── Role colors ───────────────────────────────────────────────────────────────

export const ROLE_MAP: Record<string, { bg: string; text: string }> = {
  'Project Lead':  { bg: '#E6F5EC', text: '#1A5C3A' },
  'Field Staff':   { bg: '#E0F2FE', text: '#0369A1' },
  'M&E Officer':   { bg: '#E6F5EC', text: '#1A5C3A' },
  'Donor':         { bg: '#FEF3C7', text: '#78350F' },
  'Supervisor':    { bg: '#FEF3C7', text: '#92400E' },
  'Viewer':        { bg: '#F1F5F9', text: '#475569' },
  'Admin':         { bg: '#FEE2E2', text: '#991B1B' },
}

// ── Source colors ──────────────────────────────────────────────────────────────

export const SOURCE_MAP: Record<string, { bg: string; text: string }> = {
  'KoBoToolbox':   { bg: '#E0F2FE', text: '#0369A1' },
  'REDCap':        { bg: '#E6F5EC', text: '#1A5C3A' },
  'ODK Central':   { bg: '#FEF3C7', text: '#92400E' },
  'Upload':        { bg: '#F1F5F9', text: '#475569' },
  'Google Sheets': { bg: '#E6F5EC', text: '#1A5C3A' },
}

// ── DocType colors ─────────────────────────────────────────────────────────────

export const DOCTYPE_MAP: Record<string, { bg: string; text: string }> = {
  logframe:   { bg: '#E6F5EC', text: '#1A5C3A' },
  report:     { bg: '#E0F2FE', text: '#0369A1' },
  framework:  { bg: '#FEF3C7', text: '#92400E' },
  manual:     { bg: '#F1F5F9', text: '#475569' },
  proposal:   { bg: '#FEE2E2', text: '#991B1B' },
  other:      { bg: '#F1F5F9', text: '#64748B' },
}

// ── Avatar palette ─────────────────────────────────────────────────────────────

export const AVATAR_PALETTE = [
  '#1A5C3A', '#2E7D52', '#4CAF78', '#D4AF5C',
  '#0EA5E9', '#8B5CF6', '#EC4899', '#0891B2',
] as const

// ── Shadows ───────────────────────────────────────────────────────────────────

export const SHADOW = {
  card:    '0 1px 3px rgba(13,43,30,0.06), 0 1px 2px -1px rgba(13,43,30,0.04)',
  cardHov: '0 4px 20px rgba(26,92,58,0.14)',
  modal:   '0 24px 64px rgba(10,26,16,0.22)',
  toast:   '0 8px 24px rgba(13,43,30,0.14)',
} as const
