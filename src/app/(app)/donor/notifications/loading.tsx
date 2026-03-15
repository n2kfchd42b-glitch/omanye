import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { COLORS, FONTS } from '@/lib/tokens'

export default function NotificationsLoading() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Top bar skeleton */}
      <div style={{
        background: COLORS.forest, padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Skeleton h={16} w={200} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: 32 }}>
        <div style={{ marginBottom: 6 }}><Skeleton h={28} w={160} /></div>
        <div style={{ marginBottom: 28 }}><Skeleton h={14} w={280} /></div>

        <div style={{
          background: '#fff', border: `1px solid ${COLORS.mist}`,
          borderRadius: 14, overflow: 'hidden',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderBottom: i < 5 ? `1px solid ${COLORS.mist}` : 'none',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}
            >
              <Skeleton h={36} w={36} radius={18} />
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6 }}><Skeleton h={14} w="55%" /></div>
                <Skeleton h={12} w="80%" />
              </div>
              <Skeleton h={11} w={50} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
