'use client'

import React from 'react'
import { COLORS, FONTS } from '@/lib/tokens'
import type { IndicatorReportRow } from '@/types/reports'

interface Props {
  indicators: IndicatorReportRow[]
}

const STATUS_LABEL: Record<string, string> = {
  on_track:  'On Track',
  at_risk:   'At Risk',
  off_track: 'Off Track',
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  on_track:  { bg: '#38A16920', text: '#38A169', dot: '#38A169' },
  at_risk:   { bg: '#D4AF5C20', text: '#D4AF5C', dot: '#D4AF5C' },
  off_track: { bg: '#E53E3E20', text: '#E53E3E', dot: '#E53E3E' },
}

export function IndicatorsTable({ indicators }: Props) {
  if (!indicators.length) {
    return (
      <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>
        No indicators recorded for this program.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.mist}` }}>
            {['Indicator', 'Category', 'Target', 'Current', '% Achieved', 'Status'].map(h => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Indicator' || h === 'Category' ? 'left' : 'right',
                  padding: '8px 12px',
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: COLORS.slate,
                  whiteSpace: 'nowrap',
                }}
              >
                {h === 'Status' ? <span style={{ display: 'block', textAlign: 'center' }}>{h}</span> : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {indicators.map((ind, i) => {
            const st = STATUS_STYLE[ind.status] ?? STATUS_STYLE.off_track
            return (
              <tr
                key={ind.id}
                style={{
                  background: i % 2 === 0 ? COLORS.pearl : COLORS.snow,
                  borderBottom: `1px solid ${COLORS.mist}`,
                }}
              >
                <td style={{ padding: '10px 12px', color: COLORS.charcoal, fontWeight: 500 }}>
                  {ind.name}
                </td>
                <td style={{ padding: '10px 12px', color: COLORS.slate, fontSize: 12 }}>
                  {ind.category || '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.charcoal }}>
                  {ind.target.toLocaleString()}
                  {ind.unit && <span style={{ fontSize: 11, color: COLORS.stone, marginLeft: 3 }}>{ind.unit}</span>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.charcoal }}>
                  {ind.current.toLocaleString()}
                  {ind.unit && <span style={{ fontSize: 11, color: COLORS.stone, marginLeft: 3 }}>{ind.unit}</span>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: COLORS.mist, borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(ind.pct_achieved, 100)}%`,
                          background: st.dot,
                          borderRadius: 3,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 600, color: COLORS.charcoal, minWidth: 36, textAlign: 'right' }}>
                      {ind.pct_achieved}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 9px', borderRadius: 10,
                    background: st.bg, color: st.text,
                    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
                    {STATUS_LABEL[ind.status]}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
