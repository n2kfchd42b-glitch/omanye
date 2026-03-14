import React from 'react'
import { cn } from '@/lib/utils'

// ── Adinkrahene Symbol ────────────────────────────────────────────────────────
// 4 concentric rings + center dot.
// Painter's algorithm (largest → smallest) creates ring illusion:
//   r[0] white  → outermost ring
//   r[1] gold   → 2nd ring
//   r[2] white  → 3rd ring
//   r[3] forest → "gap" (matches bg, punches hole)
//   r[4] gold   → center dot

export function OmanyeSymbol({ size = 40, className }: { size?: number; className?: string }) {
  const dim  = size
  const half = dim / 2
  const rx   = Math.round(dim * 0.18)
  const R    = [0.46, 0.36, 0.26, 0.16, 0.07].map(f => f * dim)
  const FILLS = ['white', '#D4AF5C', 'white', '#0D2B1E', '#D4AF5C']

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OMANYE Adinkrahene symbol"
      role="img"
    >
      <rect width={dim} height={dim} rx={rx} fill="#0D2B1E" />
      {R.map((r, i) => (
        <circle key={i} cx={half} cy={half} r={r} fill={FILLS[i]} />
      ))}
    </svg>
  )
}

// ── Full Logo (symbol + wordmark) ─────────────────────────────────────────────

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const LOGO_SIZES: Record<LogoSize, { sym: number; word: string; tag: string; gap: string }> = {
  xs: { sym: 26, word: 'text-sm',   tag: 'text-[7px]',  gap: 'gap-2' },
  sm: { sym: 34, word: 'text-base', tag: 'text-[8px]',  gap: 'gap-2.5' },
  md: { sym: 42, word: 'text-xl',   tag: 'text-[9px]',  gap: 'gap-3' },
  lg: { sym: 52, word: 'text-2xl',  tag: 'text-[10px]', gap: 'gap-3' },
  xl: { sym: 72, word: 'text-4xl',  tag: 'text-[13px]', gap: 'gap-4' },
}

interface LogoProps {
  size?: LogoSize
  showTagline?: boolean
  /** Dark background variant (sidebar) vs light background */
  variant?: 'dark' | 'light'
  className?: string
}

export function OmanyeLogo({ size = 'md', showTagline = true, variant = 'dark', className }: LogoProps) {
  const s = LOGO_SIZES[size]
  const wordColor  = variant === 'dark' ? '#D4AF5C' : '#0D2B1E'
  const tagColor   = variant === 'dark' ? 'rgba(125,212,160,0.70)' : 'rgba(46,125,82,0.60)'

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <OmanyeSymbol size={s.sym} />
      <div className="flex flex-col leading-none">
        <span
          className={cn('font-semibold tracking-wider', s.word)}
          style={{ fontFamily: 'Palatino,"Palatino Linotype",Georgia,serif', color: wordColor }}
        >
          OMANYE
        </span>
        {showTagline && (
          <span
            className={cn('tracking-widest uppercase font-medium mt-0.5', s.tag)}
            style={{ fontFamily: 'var(--font-instrument),system-ui,sans-serif', color: tagColor }}
          >
            NGO Workspace
          </span>
        )}
      </div>
    </div>
  )
}
