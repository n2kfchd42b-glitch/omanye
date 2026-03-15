import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'

export default function DonorProgramsLoading() {
  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 4px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 6 }}><Skeleton h={28} w={220} /></div>
        <Skeleton h={14} w={160} />
      </div>

      {/* Program cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Skeleton h={20} w={60} radius={10} />
                  <Skeleton h={20} w={80} radius={10} />
                </div>
                <div style={{ marginBottom: 6 }}><Skeleton h={18} w="50%" /></div>
                <div style={{ marginBottom: 8 }}><Skeleton h={13} w="30%" /></div>
                <div style={{ marginBottom: 12 }}><Skeleton h={13} w="70%" /></div>
                {/* Indicators preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Skeleton h={11} w="40%" />
                        <Skeleton h={11} w={80} />
                      </div>
                      <Skeleton h={4} w="100%" radius={2} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={34} w={80} radius={8} />
                <Skeleton h={30} w={110} radius={8} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
