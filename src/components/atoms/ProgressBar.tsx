import React from 'react'
import { COLORS } from '@/lib/tokens'

type BarSize = 'xs' | 'sm' | 'md' | 'lg'
const SIZE_H: Record<BarSize, number> = { xs: 4, sm: 6, md: 8, lg: 10 }

function autoGradient(value: number): string {
  if (value >= 75) return `linear-gradient(to right, ${COLORS.fern}, ${COLORS.sage})`
  if (value >= 50) return `linear-gradient(to right, #1A5C3A, ${COLORS.fern})`
  if (value >= 25) return `linear-gradient(to right, #C27012, ${COLORS.amber})`
  return `linear-gradient(to right, #B91C1C, ${COLORS.crimson})`
}

interface ProgressBarProps {
  value:      number   // 0–100
  label?:     string
  showPct?:   boolean
  showLabel?: boolean  // alias for showPct
  size?:      BarSize
  /** 'auto' picks color based on value; or pass explicit hex gradient start/end */
  color?:     'auto' | string
  className?: string
  style?:     React.CSSProperties
}

export function ProgressBar({
  value, label, showPct = false, showLabel = false,
  size = 'md', color = 'auto', className = '', style,
}: ProgressBarProps) {
  const displayPct = showPct || showLabel
  const clamped = Math.min(100, Math.max(0, value))
  const h       = SIZE_H[size]
  const gradient = color === 'auto'
    ? autoGradient(clamped)
    : `linear-gradient(to right, ${color}, ${color})`

  return (
    <div className={`space-y-1.5 ${className}`} style={style}>
      {(label || displayPct) && (
        <div className="flex items-center justify-between">
          {label  && <span style={{ fontSize: 12, color: COLORS.slate }}>{label}</span>}
          {displayPct && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: COLORS.forest }}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        style={{
          height: h, borderRadius: 99, background: '#E6F5EC',
          overflow: 'hidden',
        }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: gradient,
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}
