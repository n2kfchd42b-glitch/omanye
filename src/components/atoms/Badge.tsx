import React from 'react'
import { cn } from '@/lib/utils'
import { STATUS_COLORS, ROLE_COLORS, SOURCE_COLORS } from '@/lib/tokens'
import type { ProgramStatus, UserRole, SourceType } from '@/lib/types'

// ── Generic Badge ─────────────────────────────────────────────────────────────

interface BadgeBaseProps {
  children: React.ReactNode
  dot?: boolean
  className?: string
}

function BadgeBase({
  children, dot, bg, text, dotColor, className,
}: BadgeBaseProps & { bg: string; text: string; dotColor?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap',
        className
      )}
      style={{ backgroundColor: bg, color: text }}
    >
      {dot && dotColor && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
      )}
      {children}
    </span>
  )
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string
  dot?: boolean
  className?: string
}

export function StatusBadge({ status, dot = true, className }: StatusBadgeProps) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS['draft']
  const label = status.replace(/-/g, ' ')
  return (
    <BadgeBase bg={c.bg} text={c.text} dotColor={c.dot} dot={dot} className={className}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </BadgeBase>
  )
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: UserRole
  className?: string
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin:          'Admin',
  coordinator:    'Coordinator',
  'field-officer':'Field Officer',
  'm-and-e':      'M&E',
  viewer:         'Viewer',
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const c = ROLE_COLORS[role] ?? { bg: '#F3F4F6', text: '#374151' }
  return (
    <BadgeBase bg={c.bg} text={c.text} className={className}>
      {ROLE_LABELS[role]}
    </BadgeBase>
  )
}

// ── SourceBadge ───────────────────────────────────────────────────────────────

interface SourceBadgeProps {
  type: SourceType
  className?: string
}

const SOURCE_LABELS: Record<SourceType, string> = {
  foundation: 'Foundation',
  government: 'Government',
  individual: 'Individual',
  corporate:  'Corporate',
  earned:     'Earned',
}

export function SourceBadge({ type, className }: SourceBadgeProps) {
  const c = SOURCE_COLORS[type] ?? { bg: '#F3F4F6', text: '#374151' }
  return (
    <BadgeBase bg={c.bg} text={c.text} className={className}>
      {SOURCE_LABELS[type]}
    </BadgeBase>
  )
}

// ── TagBadge (generic pill) ───────────────────────────────────────────────────

export function TagBadge({ label, className }: { label: string; className?: string }) {
  return (
    <BadgeBase bg="#EAF7EE" text="#1A5C3A" className={className}>
      {label}
    </BadgeBase>
  )
}
