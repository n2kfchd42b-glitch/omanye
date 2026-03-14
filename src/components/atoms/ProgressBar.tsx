import React from 'react'
import { cn } from '@/lib/utils'

type BarColor = 'green' | 'gold' | 'red' | 'blue' | 'gray'
type BarSize  = 'xs' | 'sm' | 'md' | 'lg'

const COLOR_MAP: Record<BarColor, string> = {
  green: 'bg-sage',
  gold:  'bg-gold',
  red:   'bg-red-400',
  blue:  'bg-blue-400',
  gray:  'bg-gray-300',
}

const SIZE_H: Record<BarSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

interface ProgressBarProps {
  value: number            // 0–100
  label?: string
  sublabel?: string
  showPct?: boolean
  size?: BarSize
  color?: BarColor
  animated?: boolean
  className?: string
}

export function ProgressBar({
  value, label, sublabel, showPct = false,
  size = 'md', color = 'green', animated = true, className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const barColor = color === 'green' && clamped > 90 ? 'gold' : color

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPct) && (
        <div className="flex items-center justify-between">
          <div>
            {label   && <span className="text-xs font-medium text-forest/80">{label}</span>}
            {sublabel && <span className="text-xs text-fern/50 ml-1.5">{sublabel}</span>}
          </div>
          {showPct && (
            <span className="text-xs font-mono font-semibold text-forest/70">{clamped}%</span>
          )}
        </div>
      )}
      <div className={cn('h-2 bg-mist/70 rounded-full overflow-hidden', SIZE_H[size])}>
        <div
          className={cn('h-full rounded-full', COLOR_MAP[barColor], animated && 'transition-[width] duration-500')}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
