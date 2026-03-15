import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { COLORS } from '@/lib/tokens'

export default function DonorProgramDetailLoading() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Back + nav */}
      <div style={{ marginBottom: 20 }}><Skeleton h={16} w={140} /></div>

      {/* Hero */}
      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <Skeleton h={140} radius={0} />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 8 }}><Skeleton h={24} w="55%" /></div>
          <div style={{ marginBottom: 14 }}><Skeleton h={14} w="35%" /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Skeleton h={22} w={90} radius={10} />
            <Skeleton h={22} w={80} radius={10} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24 }}>
        {[90, 90, 80, 70].map((w, i) => (
          <Skeleton key={i} h={36} w={w} radius={8} />
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ marginBottom: 10 }}><Skeleton h={15} w="45%" /></div>
            <div style={{ marginBottom: 8 }}><Skeleton h={8} w="100%" radius={4} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton h={12} w="30%" />
              <Skeleton h={12} w={80} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
