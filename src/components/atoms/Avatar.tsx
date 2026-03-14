import React from 'react'
import { cn, avatarColor, initials } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLS: Record<AvatarSize, string> = {
  xs: 'w-6  h-6  text-[9px]  font-bold',
  sm: 'w-8  h-8  text-[11px] font-bold',
  md: 'w-10 h-10 text-sm     font-bold',
  lg: 'w-12 h-12 text-base   font-bold',
  xl: 'w-16 h-16 text-lg     font-bold',
}

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
  title?: string
}

export function Avatar({ name, src, size = 'sm', className, title }: AvatarProps) {
  const { bg, text } = avatarColor(name)
  return (
    <div
      className={cn('rounded-full flex items-center justify-center flex-shrink-0 select-none', SIZE_CLS[size], className)}
      style={!src ? { backgroundColor: bg, color: text } : undefined}
      title={title ?? name}
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

interface AvatarGroupProps {
  names: string[]
  max?: number
  size?: AvatarSize
  className?: string
}

export function AvatarGroup({ names, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const shown    = names.slice(0, max)
  const overflow = names.length - max
  return (
    <div className={cn('flex -space-x-2', className)}>
      {shown.map(name => (
        <Avatar key={name} name={name} size={size} className="ring-2 ring-white" />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center ring-2 ring-white bg-mist text-fern text-[10px] font-bold flex-shrink-0',
            SIZE_CLS[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
