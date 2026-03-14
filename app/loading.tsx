import React from 'react'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-mist/60 rounded-lg animate-pulse ${className ?? ''}`} />
  )
}

export default function Loading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Title skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-48" />
        <SkeletonBlock className="h-3.5 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-2.5 w-32" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5 space-y-3">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-52 w-full" />
        </div>
        <div className="card p-5 space-y-3">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-52 w-full" />
        </div>
      </div>
    </div>
  )
}
