import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  compact?: boolean
  className?: string
}

export function EmptyState({ icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-4' : 'py-20 px-6',
        className
      )}
    >
      {icon && (
        <div className={cn(
          'rounded-2xl bg-foam flex items-center justify-center text-fern/40 mb-4',
          compact ? 'w-10 h-10' : 'w-14 h-14'
        )}>
          {icon}
        </div>
      )}
      <h3 className={cn(
        'font-fraunces font-semibold text-forest mb-1',
        compact ? 'text-sm' : 'text-base'
      )}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-fern/60 max-w-xs', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
