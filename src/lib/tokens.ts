// ── OMANYE Design Tokens ─────────────────────────────────────────────────────
// Single source of truth for the Forest Green palette and typographic scale.

export const COLORS = {
  // Forest Green palette
  forest:  '#0D2B1E',  // sidebar bg, deepest surface
  canopy:  '#133828',  // sidebar hover, secondary dark surface
  moss:    '#1A5C3A',  // primary buttons, active states
  fern:    '#2E7D52',  // links, interactive elements, badges
  sage:    '#4CAF78',  // accents, progress fills, highlights
  mint:    '#7DD4A0',  // light accent, sidebar text
  mist:    '#C8EDD8',  // very light tint, badge backgrounds
  foam:    '#EAF7EE',  // surface tint, card hover bg
  snow:    '#F4FAF6',  // page background
  gold:    '#D4AF5C',  // logo accent, donor badge

  // Semantic aliases
  bg:           '#F4FAF6',
  surface:      '#FFFFFF',
  surfaceHover: '#EAF7EE',
  border:       '#C8EDD8',
  borderHover:  '#7DD4A0',
  textPrimary:  '#0D2B1E',
  textSecondary:'#2E7D52',
  textMuted:    'rgba(46,125,82,0.55)',

  // Status
  statusActive:   '#4CAF78',
  statusPending:  '#D4AF5C',
  statusInactive: '#9CA3AF',
  statusCritical: '#EF4444',

  // Overlays
  scrim: 'rgba(13,43,30,0.45)',

  // Sidebar-specific
  sidebarBg:      '#0D2B1E',
  sidebarHover:   '#133828',
  sidebarActive:  '#1A5C3A',
  sidebarText:    'rgba(125,212,160,0.80)',
  sidebarTextAct: '#FFFFFF',
} as const

export const FONTS = {
  heading: 'var(--font-fraunces), Palatino, "Palatino Linotype", Georgia, serif',
  body:    'var(--font-instrument), "Instrument Sans", system-ui, sans-serif',
  mono:    'var(--font-mono), "JetBrains Mono", Consolas, monospace',
  logo:    'Palatino, "Palatino Linotype", Georgia, serif',
} as const

export const SPACING = {
  sidebarW:         256,   // px — expanded
  sidebarWCollapsed: 64,   // px — collapsed (icon-only)
  headerH:          60,    // px
  pageMaxW:         1400,  // px
  pagePadding:      24,    // px
} as const

export const RADIUS = {
  sm:  '6px',
  md:  '10px',
  lg:  '14px',
  xl:  '20px',
  full:'9999px',
} as const

export const SHADOW = {
  card:    '0 1px 3px rgba(13,43,30,0.06),0 1px 2px -1px rgba(13,43,30,0.04)',
  cardMd:  '0 4px 12px -2px rgba(13,43,30,0.08),0 2px 4px -2px rgba(13,43,30,0.05)',
  modal:   '0 20px 60px -10px rgba(13,43,30,0.18),0 8px 24px -8px rgba(13,43,30,0.12)',
  toast:   '0 8px 24px -4px rgba(13,43,30,0.14)',
  sidebar: '2px 0 12px rgba(13,43,30,0.12)',
} as const

export const TRANSITION = {
  fast:    'all 0.12s ease',
  default: 'all 0.18s ease',
  slow:    'all 0.3s cubic-bezier(0.16,1,0.3,1)',
} as const

// Status → visual mapping
export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: '#C8EDD8', text: '#1A5C3A', dot: '#4CAF78' },
  pending:   { bg: '#FEF3C7', text: '#92400E', dot: '#D4AF5C' },
  completed: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
  'on-hold': { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  draft:     { bg: '#F3F4F6', text: '#6B7280', dot: '#D1D5DB' },
  review:    { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  submitted: { bg: '#EDE9FE', text: '#5B21B6', dot: '#8B5CF6' },
  published: { bg: '#C8EDD8', text: '#1A5C3A', dot: '#4CAF78' },
  validated: { bg: '#C8EDD8', text: '#1A5C3A', dot: '#4CAF78' },
  flagged:   { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  rejected:  { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin:         { bg: '#FEF3C7', text: '#92400E' },
  coordinator:   { bg: '#C8EDD8', text: '#1A5C3A' },
  'field-officer':{ bg: '#DBEAFE', text: '#1E40AF' },
  'm-and-e':     { bg: '#EDE9FE', text: '#5B21B6' },
  viewer:        { bg: '#F3F4F6', text: '#374151' },
}

export const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  foundation: { bg: '#DBEAFE', text: '#1E40AF' },
  government: { bg: '#FEF3C7', text: '#92400E' },
  individual: { bg: '#C8EDD8', text: '#1A5C3A' },
  corporate:  { bg: '#F3E8FF', text: '#6B21A8' },
  earned:     { bg: '#F3F4F6', text: '#374151' },
}

// Avatar palette — deterministic color from name hash
export const AVATAR_PALETTE = [
  { bg: '#1A5C3A', text: '#FFFFFF' },
  { bg: '#2E7D52', text: '#FFFFFF' },
  { bg: '#4CAF78', text: '#FFFFFF' },
  { bg: '#D4AF5C', text: '#FFFFFF' },
  { bg: '#3B82F6', text: '#FFFFFF' },
  { bg: '#8B5CF6', text: '#FFFFFF' },
  { bg: '#EC4899', text: '#FFFFFF' },
  { bg: '#0891B2', text: '#FFFFFF' },
] as const
