import React from 'react'
import { avatarColor, initials } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const DIM: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 }
const TEXT: Record<AvatarSize, string> = {
  xs: '9px', sm: '11px', md: '13px', lg: '15px', xl: '20px',
}

interface AvatarProps {
  name: string
  src?:   string
  size?:  AvatarSize | number
  style?: React.CSSProperties
  className?: string
}

export function Avatar({ name, src, size = 'sm', style, className = '' }: AvatarProps) {
  const dim   = typeof size === 'number' ? size : DIM[size]
  const color = avatarColor(name)
  // bg = color at 22% opacity, border = color at 40% opacity
  const bg     = color + '38'   // ~22% in hex
  const border = color + '66'   // ~40% in hex

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none font-bold ${className}`}
      style={{
        width: dim, height: dim,
        ...style,
        fontSize: typeof size === 'number' ? Math.round(size * 0.4) + 'px' : TEXT[size],
        background: src ? undefined : bg,
        color: src ? undefined : color,
        border: `2px solid ${border}`,
      }}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        initials(name)
      )}
    </div>
  )
}

export function AvatarGroup({
  names, max = 4, size = 'sm',
}: { names: string[]; max?: number; size?: AvatarSize }) {
  const shown    = names.slice(0, max)
  const overflow = names.length - max
  return (
    <div className="flex -space-x-2">
      {shown.map(n => (
        <Avatar key={n} name={n} size={size} className="ring-2 ring-white" />
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full flex items-center justify-center ring-2 ring-white font-bold"
          style={{
            width: DIM[size], height: DIM[size],
            fontSize: TEXT[size],
            background: '#EAF7EE',
            color: '#2E7D52',
            border: '2px solid #7DD4A066',
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
