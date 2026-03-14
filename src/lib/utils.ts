import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AVATAR_PALETTE } from './tokens'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatCurrency(n: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

export function pct(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

/** Deterministic color from a string (for avatars). */
export function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}

/** Generate initials from a full name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Generate a simple unique id (not UUID — just for mock data). */
let _idCounter = 0
export function uid(prefix = 'id'): string {
  return `${prefix}_${++_idCounter}_${Date.now()}`
}

/** Clamp a number between min and max. */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}
