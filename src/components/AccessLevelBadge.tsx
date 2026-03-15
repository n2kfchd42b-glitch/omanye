'use client'

import React, { useState } from 'react'
import { COLORS, FONTS } from '@/lib/tokens'
import type { AccessLevel } from '@/lib/supabase/database.types'
import { ACCESS_LEVEL_BADGE_COLORS } from '@/lib/donors'

// ── Label + tooltip content ────────────────────────────────────────────────────

const BADGE_LABELS: Record<AccessLevel, string> = {
  SUMMARY_ONLY:          'Summary Only',
  INDICATORS:            'Indicators',
  INDICATORS_AND_BUDGET: 'Indicators & Budget',
  FULL:                  'Full Access',
}

const BADGE_BULLETS: Record<AccessLevel, string[]> = {
  SUMMARY_ONLY: [
    'Program overview',
    'Narrative updates',
  ],
  INDICATORS: [
    'Program overview',
    'Narrative updates',
    'KPI indicators',
    'Progress tracking',
  ],
  INDICATORS_AND_BUDGET: [
    'Program overview',
    'Narrative updates',
    'KPI indicators',
    'Progress tracking',
    'Budget summary',
    'Category spend',
  ],
  FULL: [
    'All of the above',
    'Funding tranches',
    'All shared reports',
  ],
}

// ── Size config ────────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { fontSize: 10, padding: '2px 7px', dotSize: 5 },
  md: { fontSize: 11, padding: '3px 9px', dotSize: 6 },
  lg: { fontSize: 13, padding: '5px 12px', dotSize: 7 },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  level:        AccessLevel
  showTooltip?: boolean
  size?:        'sm' | 'md' | 'lg'
  className?:   string
}

export function AccessLevelBadge({ level, showTooltip = false, size = 'md' }: Props) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const colors = ACCESS_LEVEL_BADGE_COLORS[level]
  const cfg    = SIZE_CONFIG[size]
  const label  = BADGE_LABELS[level]

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => showTooltip && setTooltipVisible(false)}
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           5,
          padding:       cfg.padding,
          borderRadius:  10,
          fontSize:      cfg.fontSize,
          fontWeight:    700,
          background:    colors.bg,
          color:         colors.text,
          border:        `1px solid ${colors.border}`,
          cursor:        showTooltip ? 'default' : 'inherit',
          whiteSpace:    'nowrap',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ width: cfg.dotSize, height: cfg.dotSize, borderRadius: '50%', background: colors.text === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : colors.border, display: 'inline-block', flexShrink: 0 }} />
        {label}
      </span>

      {showTooltip && tooltipVisible && (
        <div style={{
          position:     'absolute',
          bottom:       '100%',
          left:         '50%',
          transform:    'translateX(-50%)',
          marginBottom: 8,
          background:   COLORS.forest,
          color:        '#fff',
          borderRadius: 10,
          padding:      '12px 14px',
          minWidth:     200,
          boxShadow:    '0 8px 24px rgba(13,43,30,0.25)',
          zIndex:       100,
          pointerEvents:'none',
        }}>
          {/* Arrow */}
          <div style={{
            position:    'absolute',
            top:         '100%',
            left:        '50%',
            transform:   'translateX(-50%)',
            width:       0,
            height:      0,
            borderLeft:  '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop:   `6px solid ${COLORS.forest}`,
          }} />

          <div style={{ fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700, color: COLORS.gold, marginBottom: 8 }}>
            {label}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {BADGE_BULLETS[level].map((bullet, i) => (
              <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 5, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{ color: COLORS.sage, flexShrink: 0 }}>·</span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}

export default AccessLevelBadge
