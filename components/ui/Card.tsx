import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const PADDING = {
  none: '',
  sm:   'p-3',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  return (
    <div className={cn('card', hover && 'card-hover', PADDING[padding], className)}>
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  action,
  className,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-fraunces text-base font-semibold text-forest', className)}>
      {children}
    </h3>
  )
}

export function CardSubtitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs text-fern/60 mt-0.5', className)}>{children}</p>
  )
}
