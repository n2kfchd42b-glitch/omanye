import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'

export default function ProgramDetailLoading() {
  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 4px' }}>
      {/* Back button skeleton */}
      <div style={{ marginBottom: 20 }}><Skeleton h={20} w={140} /></div>

      {/* Hero card skeleton */}
      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <Skeleton h={160} radius={0} />
        <div style={{ padding: '20px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 10 }}><Skeleton h={28} w="60%" /></div>
              <div style={{ marginBottom: 14 }}><Skeleton h={14} w="80%" /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Skeleton h={22} w={90} radius={10} />
                <Skeleton h={22} w={80} radius={10} />
                <Skeleton h={22} w={100} radius={10} />
              </div>
            </div>
            <Skeleton h={34} w={120} radius={8} />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {[90, 90, 80, 70, 80].map((w, i) => (
          <Skeleton key={i} h={38} w={w} radius={8} />
        ))}
      </div>

      {/* Content skeleton (indicators-like layout) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Skeleton h={16} w="45%" />
              <Skeleton h={24} w={80} radius={8} />
            </div>
            <div style={{ marginBottom: 8 }}><Skeleton h={8} w="100%" radius={4} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton h={20} w={70} radius={6} />
              <Skeleton h={20} w={90} radius={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
