'use client'

import React, { useState } from 'react'
import { MapPin, Layers, RefreshCw } from 'lucide-react'
import { StatusBadge } from '../atoms/Badge'
import { GEO_POINTS, PROGRAMS } from '@/lib/mock'
import type { GeoPoint } from '@/lib/types'

// ── Simplified SVG map of Ghana regions ──────────────────────────────────────
// Not a real geospatial projection — a schematic representation only.
// Coordinates are mapped to a 400×480 SVG viewport.

function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  // Ghana bounds: lat ~4.7–11.2N, lng ~-3.3–1.2E
  const LAT_MIN = 4.5,  LAT_MAX = 11.5
  const LNG_MIN = -3.5, LNG_MAX = 1.5
  const W = 400, H = 480
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W
  const y = H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H
  return { x: Math.round(x), y: Math.round(y) }
}

const REGION_LABELS: { name: string; lat: number; lng: number }[] = [
  { name: 'Greater Accra', lat: 5.6,  lng: -0.2  },
  { name: 'Ashanti',       lat: 6.7,  lng: -1.55 },
  { name: 'Volta',         lat: 7.1,  lng: 0.3   },
  { name: 'Eastern',       lat: 6.5,  lng: -0.5  },
  { name: 'Western',       lat: 5.9,  lng: -2.0  },
  { name: 'Central',       lat: 5.6,  lng: -1.3  },
  { name: 'Brong-Ahafo',   lat: 7.5,  lng: -1.7  },
  { name: 'Northern',      lat: 9.5,  lng: -0.8  },
  { name: 'Upper East',    lat: 10.8, lng: -0.8  },
  { name: 'Upper West',    lat: 10.5, lng: -2.3  },
]

const POINT_COLORS: Record<string, string> = {
  'program-site': '#4CAF78',
  'submission':   '#D4AF5C',
  'beneficiary':  '#3B82F6',
}

const POINT_LABELS: Record<string, string> = {
  'program-site': 'Program Site',
  'submission':   'Submission',
  'beneficiary':  'Beneficiary Cluster',
}

type FilterType = 'all' | 'program-site' | 'submission' | 'beneficiary'

export function FieldMap() {
  const [selected,    setSelected]    = useState<GeoPoint | null>(null)
  const [filterType,  setFilterType]  = useState<FilterType>('all')
  const [hoveredId,   setHoveredId]   = useState<string | null>(null)

  const filtered = GEO_POINTS.filter(p =>
    filterType === 'all' || p.type === filterType
  )

  const svgPts = filtered.map(p => ({ ...p, ...latLngToSvg(p.lat, p.lng) }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Field Map</h2>
          <p className="text-sm text-fern/60 mt-0.5">Geographic view of program activities — Ghana</p>
        </div>
        <button className="inline-flex items-center gap-1.5 text-xs text-fern hover:text-moss transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map panel */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-mist bg-snow flex-wrap">
            <Layers size={13} className="text-fern/60" />
            <span className="text-xs font-semibold text-fern/60 uppercase tracking-wide">Filter:</span>
            {(['all', 'program-site', 'submission', 'beneficiary'] as FilterType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterType === t ? 'bg-moss text-white' : 'bg-foam text-fern hover:bg-mist'
                }`}
              >
                {t === 'all' ? 'All' : POINT_LABELS[t]}
              </button>
            ))}
          </div>

          {/* SVG Map */}
          <div className="relative bg-foam/30 p-4">
            <svg
              viewBox="0 0 400 480"
              className="w-full max-h-[480px]"
              style={{ background: 'linear-gradient(to bottom, #EAF7EE 0%, #F4FAF6 100%)' }}
            >
              {/* Ghana outline — approximate shape using path */}
              <path
                d="M 80 440 L 50 380 L 30 300 L 40 220 L 60 160 L 90 100 L 130 60 L 180 40 L 240 40 L 300 60 L 340 100 L 360 160 L 370 240 L 360 320 L 330 380 L 300 420 L 260 450 L 200 460 L 140 455 Z"
                fill="#C8EDD8"
                stroke="#7DD4A0"
                strokeWidth="2"
                opacity={0.5}
              />

              {/* Region labels */}
              {REGION_LABELS.map(r => {
                const pt = latLngToSvg(r.lat, r.lng)
                return (
                  <text
                    key={r.name}
                    x={pt.x}
                    y={pt.y}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#2E7D52"
                    opacity={0.5}
                    style={{ userSelect: 'none' }}
                  >
                    {r.name}
                  </text>
                )
              })}

              {/* Data points */}
              {svgPts.map(p => {
                const color   = POINT_COLORS[p.type] ?? '#4CAF78'
                const isHover = hoveredId === p.id
                const isSel   = selected?.id === p.id
                const r = isSel ? 9 : isHover ? 8 : 6
                return (
                  <g key={p.id}>
                    {(isSel || isHover) && (
                      <circle cx={p.x} cy={p.y} r={r + 5} fill={color} opacity={0.18} />
                    )}
                    <circle
                      cx={p.x} cy={p.y} r={r}
                      fill={color}
                      stroke="white"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
                    />
                    {isSel && (
                      <text x={p.x} y={p.y - 14} textAnchor="middle" fontSize="9" fill="#0D2B1E" fontWeight="600">
                        {p.label.split('–')[0].trim()}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl border border-mist px-3 py-2 space-y-1.5">
              {Object.entries(POINT_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-fern/70 font-medium">{POINT_LABELS[type]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected point info */}
          {selected ? (
            <div className="card p-5 space-y-3">
              <div className="flex items-start gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: POINT_COLORS[selected.type] + '22' }}
                >
                  <MapPin size={14} style={{ color: POINT_COLORS[selected.type] }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest">{selected.label}</p>
                  <p className="text-xs text-fern/55 mt-0.5">{selected.region}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-fern/60">
                  <span>Type</span>
                  <span className="font-medium text-forest capitalize">{POINT_LABELS[selected.type]}</span>
                </div>
                <div className="flex justify-between text-fern/60">
                  <span>Coordinates</span>
                  <span className="font-mono text-forest">{selected.lat.toFixed(2)}, {selected.lng.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-full py-1.5 rounded-lg border border-mist text-xs text-fern hover:bg-foam transition-colors"
              >
                Clear selection
              </button>
            </div>
          ) : (
            <div className="card p-5 text-center">
              <MapPin size={20} className="text-fern/30 mx-auto mb-2" />
              <p className="text-sm text-fern/60">Click a point on the map to see details.</p>
            </div>
          )}

          {/* Point list */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-mist">
              <p className="font-fraunces text-sm font-semibold text-forest">
                {filtered.length} location{filtered.length !== 1 ? 's' : ''} shown
              </p>
            </div>
            <ul className="divide-y divide-mist/40 max-h-64 overflow-y-auto scrollbar-thin">
              {svgPts.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(prev => prev?.id === p.id ? null : p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selected?.id === p.id ? 'bg-foam' : 'hover:bg-foam/60'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: POINT_COLORS[p.type] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-forest truncate">{p.label}</p>
                      <p className="text-[10px] text-fern/50">{p.region}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Program sites */}
          <div className="card p-5">
            <p className="font-fraunces text-sm font-semibold text-forest mb-3">Active Programs</p>
            <div className="space-y-2">
              {PROGRAMS.filter(p => p.status === 'active').map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-forest/80 truncate flex-1">{p.region}</span>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
