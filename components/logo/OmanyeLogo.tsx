import React from 'react'
import { cn } from '@/lib/utils'

interface OmanyeLogoProps {
  showWordmark?: boolean
  showTagline?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm:  { symbol: 32, text: 'text-base',   sub: 'text-[8px]' },
  md:  { symbol: 40, text: 'text-xl',     sub: 'text-[9px]' },
  lg:  { symbol: 52, text: 'text-2xl',    sub: 'text-[10px]' },
  xl:  { symbol: 72, text: 'text-4xl',    sub: 'text-[13px]' },
}

/**
 * Adinkrahene: 4 concentric rings + center dot.
 * Outermost ring (ring 4) = white
 * 2nd ring (ring 3)       = gold
 * 3rd ring (ring 2)       = white
 * 4th ring (ring 1)       = gold
 * Center dot              = gold
 * Background              = forest #0D2B1E
 *
 * We render this as layered filled circles using the painter's algorithm:
 * each smaller circle "punches out" the visible ring of the one beneath it.
 */
export function OmanyeSymbol({ size = 40, className }: { size?: number; className?: string }) {
  const dim = size
  const cx = dim / 2
  const cy = dim / 2

  // Ring radii (outermost → innermost)
  const r = [0.46, 0.36, 0.26, 0.16, 0.06].map(f => f * dim)

  // Colors: alternating white / gold / white / gold / gold-center
  const fills = ['white', '#D4AF5C', 'white', '#0D2B1E', '#D4AF5C']
  //              ring4     ring3      ring2    (gap=forest)  dot

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OMANYE Adinkrahene symbol"
    >
      {/* Background */}
      <rect width={dim} height={dim} rx={Math.round(dim * 0.18)} fill="#0D2B1E" />
      {/* Rings painted largest → smallest */}
      {r.map((radius, i) => (
        <circle key={i} cx={cx} cy={cy} r={radius} fill={fills[i]} />
      ))}
    </svg>
  )
}

export function OmanyeLogo({
  showWordmark = true,
  showTagline = true,
  size = 'md',
  className,
}: OmanyeLogoProps) {
  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <OmanyeSymbol size={s.symbol} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className={cn('font-semibold tracking-wider text-gold', s.text)}
            style={{ fontFamily: 'Palatino, "Palatino Linotype", Georgia, serif' }}
          >
            OMANYE
          </span>
          {showTagline && (
            <span
              className={cn('tracking-widest font-instrument uppercase text-mint/80 mt-0.5', s.sub)}
            >
              NGO Workspace
            </span>
          )}
        </div>
      )}
    </div>
  )
}
