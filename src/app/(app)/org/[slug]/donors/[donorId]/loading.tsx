import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { COLORS } from '@/lib/tokens'

export default function DonorDetailLoading() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Header */}
      <div style={{ background: COLORS.forest, padding: '20px 32px' }}>
        <div style={{ marginBottom: 8 }}><Skeleton h={16} w={120} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Skeleton h={48} w={48} radius={24} />
          <div>
            <div style={{ marginBottom: 6 }}><Skeleton h={20} w={180} /></div>
            <Skeleton h={13} w={140} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
          {/* Left panel */}
          <div className="card" style={{ padding: 20, alignSelf: 'start' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8 }}><Skeleton h={14} w={100} /></div>
              <Skeleton h={36} w="100%" radius={8} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 6 }}><Skeleton h={11} w={80} /></div>
              <Skeleton h={13} w="90%" />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}><Skeleton h={11} w={70} /></div>
              <Skeleton h={13} w="75%" />
            </div>
          </div>

          {/* Right panel */}
          <div>
            <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Skeleton h={18} w={160} />
                <Skeleton h={34} w={120} radius={8} />
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: `1px solid ${COLORS.mist}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ marginBottom: 6 }}><Skeleton h={14} w={160} /></div>
                      <Skeleton h={11} w={100} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Skeleton h={28} w={80} radius={8} />
                      <Skeleton h={28} w={70} radius={8} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
