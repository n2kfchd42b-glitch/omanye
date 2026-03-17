'use client'

import React from 'react'
import { COLORS, FONTS } from '@/lib/tokens'
import { formatCurrency } from '@/lib/utils'
import type { CategorySpendRow } from '@/types/reports'

interface Props {
  categories: CategorySpendRow[]
  currency:   string
}

export function BudgetReportTable({ categories, currency }: Props) {
  if (!categories.length) {
    return (
      <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>
        No budget categories recorded for this program.
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.mist}` }}>
            {['Category', 'Allocated', 'Spent', 'Remaining', 'Burn Rate'].map(h => (
              <th
                key={h}
                style={{
                  textAlign: h === 'Category' ? 'left' : 'right',
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
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => {
            const burnColor =
              cat.burn_rate_pct >= 90
                ? '#EF4444'
                : cat.burn_rate_pct >= 70
                ? '#D97706'
                : '#4CAF78'

            return (
              <tr
                key={cat.name}
                style={{
                  background: i % 2 === 0 ? '#ffffff' : COLORS.snow,
                  borderBottom: `1px solid ${COLORS.mist}`,
                }}
              >
                <td style={{ padding: '10px 12px', color: COLORS.charcoal, fontWeight: 500 }}>
                  {cat.name}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.charcoal }}>
                  {formatCurrency(cat.allocated, currency)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.charcoal }}>
                  {formatCurrency(cat.spent, currency)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: COLORS.slate }}>
                  {formatCurrency(cat.remaining, currency)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <div style={{ width: 60, height: 6, background: COLORS.mist, borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(cat.burn_rate_pct, 100)}%`,
                          background: burnColor,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 600, color: COLORS.charcoal, minWidth: 40, textAlign: 'right' }}>
                      {cat.burn_rate_pct}%
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
