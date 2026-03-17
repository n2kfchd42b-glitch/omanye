'use client'

import React from 'react'
import { Layers, RefreshCw, Wifi, Map } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'

export function FieldMap() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Field Map</h2>
        <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>Geographic view of program activities and coverage</p>
      </div>

      {/* Map placeholder */}
      <div
        className="fade-up-1"
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 20,
          height: 420,
          position: 'relative',
          background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.canopy} 100%)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* SVG grid lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212,175,92,0.5)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Dot markers */}
        {[
          { top: '35%', left: '42%', size: 10 },
          { top: '55%', left: '58%', size: 8  },
          { top: '28%', left: '65%', size: 12 },
          { top: '62%', left: '35%', size: 7  },
          { top: '45%', left: '28%', size: 9  },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: m.top, left: m.left,
              width: m.size, height: m.size,
              borderRadius: '50%',
              background: COLORS.sage,
              boxShadow: `0 0 0 ${m.size / 2}px ${COLORS.sage}40`,
            }}
          />
        ))}

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Map size={32} style={{ color: COLORS.mint, margin: '0 auto 12px', opacity: 0.7 }} />
          <p style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            Interactive Map
          </p>
          <p style={{ fontSize: 12, color: 'rgba(212,175,92,0.65)', marginBottom: 20, maxWidth: 280 }}>
            Connect program data to visualize field coverage and activities.
          </p>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(212,175,92,0.30)',
              color: COLORS.mint, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
          >
            <Layers size={14} /> Configure Map Layers
          </button>
        </div>
      </div>

      {/* Feature description cards */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <FeatureCard
          icon={Layers}
          title="Layer Control"
          desc="Toggle program boundaries, beneficiary clusters, and survey points."
        />
        <FeatureCard
          icon={Wifi}
          title="Real-time Sync"
          desc="Live data from connected KoBoToolbox and ODK Central submissions."
        />
        <FeatureCard
          icon={RefreshCw}
          title="Offline Support"
          desc="Field staff can collect GPS data offline and sync when connected."
        />
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: COLORS.foam,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      }}>
        <Icon size={16} style={{ color: COLORS.fern }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 12, color: COLORS.stone, lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
}
