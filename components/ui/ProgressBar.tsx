import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number       // 0–100
  label?: string
  showPct?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'green' | 'gold' | 'red' | 'blue'
  className?: string
}

const COLOR_MAP = {
  green: 'bg-sage',
  gold:  'bg-gold',
  red:   'bg-red-400',
  blue:  'bg-blue-400',
}

const SIZE_H = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value, label, showPct = false, size = 'md', color = 'green', className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPct) && (
        <div className="flex items-center justify-between text-xs text-fern/60">
          {label && <span>{label}</span>}
          {showPct && <span className="font-mono font-medium">{clamped}%</span>}
        </div>
      )}
      <div className={cn('progress-track', SIZE_H[size])}>
        <div
          className={cn('progress-fill', COLOR_MAP[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
