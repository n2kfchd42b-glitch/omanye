import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  trend?: number         // percent change, positive = up, negative = down
  icon?: React.ReactNode
  accent?: 'green' | 'gold' | 'blue' | 'red'
  className?: string
}

const ACCENT_COLORS = {
  green: 'bg-mist text-fern',
  gold:  'bg-amber-50 text-amber-600',
  blue:  'bg-blue-50 text-blue-500',
  red:   'bg-red-50 text-red-500',
}

export function StatCard({
  label, value, subtext, trend, icon, accent = 'green', className,
}: StatCardProps) {
  const trendUp   = trend !== undefined && trend > 0
  const trendDown = trend !== undefined && trend < 0

  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-fern/60">{label}</p>
        {icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm', ACCENT_COLORS[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-fraunces font-semibold text-forest">{value}</p>
        {subtext && <p className="text-xs text-fern/50">{subtext}</p>}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trendUp   && <TrendingUp  size={13} className="text-sage" />}
          {trendDown && <TrendingDown size={13} className="text-red-400" />}
          {!trendUp && !trendDown && <Minus size={13} className="text-fern/40" />}
          <span className={cn(
            trendUp   ? 'text-sage'     :
            trendDown ? 'text-red-400'  : 'text-fern/50'
          )}>
            {trend > 0 ? '+' : ''}{trend}% vs last month
          </span>
        </div>
      )}
    </div>
  )
}
