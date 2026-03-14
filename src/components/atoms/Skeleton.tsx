import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  const r = rounded === 'sm' ? 'rounded' : rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-lg'
  return (
    <div className={cn('bg-mist/50 animate-pulse-soft', r, className)} />
  )
}

// ── Compound skeletons ────────────────────────────────────────────────────────

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5 space-y-3', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton className={cn('h-3', i === 0 ? 'w-28' : i === cols - 1 ? 'w-16' : 'w-20')} />
        </td>
      ))}
    </tr>
  )
}

export function ProgramCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        {[40, 56, 48].map(w => <Skeleton key={w} className={`h-4 w-${w} rounded-full`} />)}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-1.5 w-full" />
      </div>
      <div className="flex justify-between pt-2">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => <Skeleton key={i} className="w-7 h-7 rounded-full ring-2 ring-white" />)}
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}
