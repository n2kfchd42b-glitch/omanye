// ── OMANYE Design Tokens ─────────────────────────────────────────────────────

export const COLORS = {
  // Navy/Gold palette
  forest:   '#0F1B33',
  canopy:   '#0A1628',
  moss:     '#D4AF5C',
  fern:     '#60A5FA',
  sage:     '#D4AF5C',
  mint:     '#E8D48B',
  mist:     '#2D3F5C',
  foam:     '#243352',
  snow:     '#0F1B33',
  gold:     '#D4AF5C',

  // Extended palette
  pearl:    '#1A2B4A',  // navy card / input bg
  stone:    '#8A9BB8',  // subtle text (was #6B7A99, raised for contrast)
  slate:    '#B8C8DC',  // muted text  (was #A0AEC0, raised for contrast)
  charcoal: '#FFFFFF',  // primary text
  sky:      '#60A5FA',  // links, info
  amber:    '#D4AF5C',  // warnings
  crimson:  '#E53E3E',  // errors, danger
  ink:      '#0F1B33',  // darkest text
} as const

export const FONTS = {
  heading: 'var(--font-fraunces), Palatino, Georgia, serif',
  body:    'var(--font-instrument), "DM Sans", system-ui, sans-serif',
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
  active:     { bg: '#D4AF5C22', text: '#D4AF5C', dot: '#D4AF5C' },
  planning:   { bg: '#1A2B4A',   text: '#B8C8DC', dot: '#8A9BB8' },
  paused:     { bg: '#1A2B4A',   text: '#A8B8CC', dot: '#8A9BB8' },
  completed:  { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  // Document statuses
  draft:      { bg: '#1A2B4A',   text: '#B8C8DC', dot: '#8A9BB8' },
  in_review:  { bg: '#1A3A5C',   text: '#60A5FA', dot: '#60A5FA' },
  approved:   { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  submitted:  { bg: '#1A3A5C',   text: '#60A5FA', dot: '#60A5FA' },
  // Dataset statuses
  clean:      { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  processing: { bg: '#1A2B4A',   text: '#B8C8DC', dot: '#8A9BB8' },
  review:     { bg: '#1A3A5C',   text: '#60A5FA', dot: '#60A5FA' },
  error:      { bg: '#E53E3E20', text: '#E53E3E', dot: '#E53E3E' },
  // Analysis statuses
  running:    { bg: '#1A3A5C',   text: '#60A5FA', dot: '#60A5FA' },
  done:       { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
}

// ── Role colors ───────────────────────────────────────────────────────────────

export const ROLE_MAP: Record<string, { bg: string; text: string }> = {
  'Project Lead':  { bg: '#1A2B4A', text: '#D4AF5C' },
  'Field Staff':   { bg: '#1A3A5C', text: '#60A5FA' },
  'M&E Officer':   { bg: '#1A2B4A', text: '#D4AF5C' },
  'Donor':         { bg: '#1A3A5C', text: '#60A5FA' },
  'Supervisor':    { bg: '#1A2B4A', text: '#C4D4E8' },
  'Viewer':        { bg: '#243352', text: '#C4D4E8' },
  'Admin':         { bg: '#0F1B33', text: '#D4AF5C' },
}

// ── Source colors ──────────────────────────────────────────────────────────────

export const SOURCE_MAP: Record<string, { bg: string; text: string }> = {
  'KoBoToolbox':   { bg: '#1A3A5C', text: '#60A5FA' },
  'REDCap':        { bg: '#1A2B4A', text: '#D4AF5C' },
  'ODK Central':   { bg: '#1A2B4A', text: '#C4D4E8' },
  'Upload':        { bg: '#243352', text: '#C4D4E8' },
  'Google Sheets': { bg: '#1A2B4A', text: '#D4AF5C' },
}

// ── DocType colors ─────────────────────────────────────────────────────────────

export const DOCTYPE_MAP: Record<string, { bg: string; text: string }> = {
  logframe:   { bg: '#1A2B4A', text: '#D4AF5C' },
  report:     { bg: '#1A3A5C', text: '#60A5FA' },
  framework:  { bg: '#1A2B4A', text: '#C4D4E8' },
  manual:     { bg: '#243352', text: '#C4D4E8' },
  proposal:   { bg: '#E53E3E20', text: '#E53E3E' },
  other:      { bg: '#243352', text: '#C4D4E8' },
}

// ── Avatar palette ─────────────────────────────────────────────────────────────

export const AVATAR_PALETTE = [
  '#D4AF5C', '#60A5FA', '#38A169', '#E53E3E',
  '#A78BFA', '#FB923C', '#E8D48B', '#93C5FD',
] as const

// ── Shadows ───────────────────────────────────────────────────────────────────

export const SHADOW = {
  card:    '0 4px 24px rgba(0,0,0,0.3)',
  cardHov: '0 4px 20px rgba(212,175,92,0.15)',
  modal:   '0 25px 60px rgba(0,0,0,0.5)',
  toast:   '0 8px 24px rgba(0,0,0,0.3)',
} as const
