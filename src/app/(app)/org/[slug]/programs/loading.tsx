import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'

export default function ProgramsLoading() {
  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 4px' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 8 }}><Skeleton h={28} w={120} /></div>
          <Skeleton h={14} w={180} />
        </div>
        <Skeleton h={38} w={130} radius={8} />
      </div>

      {/* Filter bar skeleton */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[80, 70, 90, 85, 90].map((w, i) => (
          <Skeleton key={i} h={30} w={w} radius={20} />
        ))}
      </div>

      {/* Program cards grid skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 18,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <Skeleton h={80} radius={0} />
            <div style={{ padding: '16px 18px 18px' }}>
              <div style={{ marginBottom: 8 }}><Skeleton h={18} w="75%" /></div>
              <div style={{ marginBottom: 4 }}><Skeleton h={12} w="90%" /></div>
              <div style={{ marginBottom: 14 }}><Skeleton h={12} w="60%" /></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Skeleton h={20} w={80} radius={10} />
                <Skeleton h={20} w={70} radius={10} />
              </div>
              <div style={{ marginBottom: 14 }}><Skeleton h={6} w="100%" radius={3} /></div>
              <Skeleton h={30} w="100%" radius={7} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
