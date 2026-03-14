import React from 'react'

interface SkeletonProps {
  w?: string | number
  h?: string | number
  radius?: number
  className?: string
}

export function Skeleton({ w = '100%', h = 16, radius = 8, className = '' }: SkeletonProps) {
  return (
    <div
      className={`shimmer-bg ${className}`}
      style={{
        width: w, height: h,
        borderRadius: radius,
        flexShrink: 0,
      }}
    />
  )
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <Skeleton h={12} w={96} />
      <Skeleton h={28} w={64} />
      <Skeleton h={10} w={128} />
    </div>
  )
}

export function RowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <Skeleton h={12} w={i === 0 ? 120 : i === cols - 1 ? 60 : 80} />
        </td>
      ))}
    </tr>
  )
}
