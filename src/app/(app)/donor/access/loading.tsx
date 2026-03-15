import React from 'react'
import { Skeleton } from '@/components/atoms/Skeleton'
import { COLORS } from '@/lib/tokens'

export default function DonorAccessLoading() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 6 }}><Skeleton h={28} w={160} /></div>
      <div style={{ marginBottom: 24 }}><Skeleton h={14} w={260} /></div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <Skeleton h={34} w={80} radius={8} />
        <Skeleton h={34} w={110} radius={8} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ marginBottom: 6 }}><Skeleton h={15} w={180} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Skeleton h={20} w={100} radius={8} />
                  <Skeleton h={20} w={80} radius={8} />
                </div>
              </div>
              <Skeleton h={32} w={90} radius={7} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
