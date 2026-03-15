import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { COLORS } from '@/lib/tokens'

export default function DonorsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Header skeleton */}
      <div style={{ background: COLORS.forest, padding: '24px 32px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Skeleton h={28} w={200} />
            <Skeleton h={40} w={130} radius={9} />
          </div>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, background: 'rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ marginBottom: 8 }}><Skeleton h={11} w={100} /></div>
                <Skeleton h={28} w={48} />
              </div>
            ))}
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[100, 100, 130].map((w, i) => (
              <Skeleton key={i} h={38} w={w} radius={0} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Skeleton h={40} w={40} radius={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 6 }}><Skeleton h={15} w="35%" /></div>
                  <Skeleton h={12} w="25%" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skeleton h={22} w={90} radius={8} />
                  <Skeleton h={22} w={70} radius={8} />
                </div>
                <Skeleton h={32} w={80} radius={7} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
