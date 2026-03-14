import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

// Deterministic color from name
const PALETTE = [
  'bg-moss text-white',
  'bg-fern text-white',
  'bg-sage text-white',
  'bg-gold text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
  'bg-teal-500 text-white',
]

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const color = getColor(name)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        SIZES[size],
        !src && color,
        className
      )}
      title={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: { names: string[]; max?: number; size?: AvatarProps['size'] }) {
  const visible = names.slice(0, max)
  const overflow = names.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map(name => (
        <Avatar
          key={name}
          name={name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-mist text-fern font-bold ring-2 ring-white',
            SIZES[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
