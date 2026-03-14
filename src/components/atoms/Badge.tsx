import React from 'react'
import { STATUS_MAP, ROLE_MAP, SOURCE_MAP, DOCTYPE_MAP } from '@/lib/tokens'

// ── Base pill ─────────────────────────────────────────────────────────────────

function Pill({
  bg, text, dot, dotColor, children, className = '',
}: {
  bg: string; text: string; dot?: boolean; dotColor?: string
  children: React.ReactNode; className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none whitespace-nowrap ${className}`}
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

export function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const c = STATUS_MAP[status] ?? STATUS_MAP.draft
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return <Pill bg={c.bg} text={c.text} dot={dot} dotColor={c.dot}>{label}</Pill>
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

export function RoleBadge({ role }: { role: string }) {
  const c = ROLE_MAP[role] ?? { bg: '#F1F5F9', text: '#475569' }
  return <Pill bg={c.bg} text={c.text}>{role}</Pill>
}

// ── SourceBadge ───────────────────────────────────────────────────────────────

export function SourceBadge({ source }: { source: string }) {
  const c = SOURCE_MAP[source] ?? { bg: '#F1F5F9', text: '#475569' }
  return <Pill bg={c.bg} text={c.text}>{source}</Pill>
}

// ── DocTypeBadge ──────────────────────────────────────────────────────────────

export function DocTypeBadge({ type }: { type: string }) {
  const c = DOCTYPE_MAP[type] ?? { bg: '#F1F5F9', text: '#64748B' }
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return <Pill bg={c.bg} text={c.text}>{label}</Pill>
}

// ── GenericBadge (custom bg/text) ─────────────────────────────────────────────

export function GenericBadge({
  label, bg, text, style,
}: { label: string; bg: string; text: string; style?: React.CSSProperties }) {
  return <span style={style}><Pill bg={bg} text={text}>{label}</Pill></span>
}
