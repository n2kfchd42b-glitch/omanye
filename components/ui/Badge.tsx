import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'gold' | 'red' | 'gray' | 'blue' | 'moss'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'badge-green',
  gold:  'badge-gold',
  red:   'badge-red',
  gray:  'badge-gray',
  blue:  'badge-blue',
  moss:  'badge-moss',
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  green: 'bg-sage',
  gold:  'bg-gold',
  red:   'bg-red-500',
  gray:  'bg-gray-400',
  blue:  'bg-blue-500',
  moss:  'bg-moss',
}

export function Badge({ children, variant = 'green', dot = false, className }: BadgeProps) {
  return (
    <span className={cn('badge', VARIANTS[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[variant])} />}
      {children}
    </span>
  )
}
