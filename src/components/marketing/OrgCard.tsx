'use client'

import Link from 'next/link'
import { MapPin, Users, ExternalLink } from 'lucide-react'

interface OrgCardIndicator {
  name: string
  current: number
  target: number
  unit?: string
}

interface OrgCardProps {
  slug: string
  programId: string
  name: string
  objective: string
  location?: string
  funder?: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'PLANNING'
  tags?: string[]
  indicators?: OrgCardIndicator[]
  coverImage?: string | null
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE:    { label: 'Active',    bg: 'rgba(76,175,120,0.12)', color: '#2E7D52' },
  COMPLETED: { label: 'Completed', bg: 'rgba(212,175,92,0.12)', color: '#9a7b35' },
  PAUSED:    { label: 'Paused',    bg: 'rgba(120,120,120,0.12)', color: '#666' },
  PLANNING:  { label: 'Planning',  bg: 'rgba(37,99,235,0.1)',   color: '#2563EB' },
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="flex-shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(15,27,51,0.08)" strokeWidth="4" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke="#D4AF5C" strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="600" fill="#0F1B33">
        {pct}%
      </text>
    </svg>
  )
}

export function OrgCard({
  slug,
  programId,
  name,
  objective,
  location,
  funder,
  status,
  tags = [],
  indicators = [],
  coverImage,
}: OrgCardProps) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.ACTIVE

  // Overall achievement % from indicators
  const overallPct = indicators.length
    ? Math.round(
        (indicators.reduce((sum, i) => sum + Math.min(i.current / (i.target || 1), 1), 0) /
          indicators.length) *
          100
      )
    : 0

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 group"
      style={{
        background: 'white',
        border: '1px solid rgba(15,27,51,0.08)',
        boxShadow: '0 1px 4px rgba(15,27,51,0.06)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(15,27,51,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,27,51,0.06)')}
    >
      {/* Cover */}
      <div
        className="h-32 flex-shrink-0"
        style={{
          background: coverImage
            ? `url(${coverImage}) center/cover no-repeat`
            : 'linear-gradient(135deg, #0F1B33 0%, #1a2e4a 100%)',
        }}
      />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Status + progress */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, color: s.color }}
          >
            {s.label}
          </span>
          {indicators.length > 0 && <ProgressRing pct={overallPct} />}
        </div>

        {/* Name + objective */}
        <div>
          <h3
            className="font-semibold text-base mb-1 leading-snug"
            style={{ fontFamily: 'var(--font-fraunces),Georgia,serif', color: '#0F1B33' }}
          >
            {name}
          </h3>
          <p
            className="text-sm leading-relaxed line-clamp-2"
            style={{ color: 'rgba(15,27,51,0.6)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
          >
            {objective}
          </p>
        </div>

        {/* Location / funder */}
        {(location || funder) && (
          <div className="flex flex-col gap-1">
            {location && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(15,27,51,0.5)' }}>
                <MapPin size={11} />
                <span>{location}</span>
              </div>
            )}
            {funder && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(15,27,51,0.5)' }}>
                <Users size={11} />
                <span>Funded by {funder}</span>
              </div>
            )}
          </div>
        )}

        {/* Key indicators */}
        {indicators.length > 0 && (
          <div className="flex flex-col gap-2">
            {indicators.slice(0, 2).map((ind, i) => {
              const pct = Math.min(Math.round((ind.current / (ind.target || 1)) * 100), 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(15,27,51,0.55)' }}>
                    <span className="truncate max-w-[70%]">{ind.name}</span>
                    <span>
                      {ind.current.toLocaleString()}/{ind.target.toLocaleString()}
                      {ind.unit ? ` ${ind.unit}` : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(15,27,51,0.08)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: '#D4AF5C' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: 'rgba(15,27,51,0.06)', color: 'rgba(15,27,51,0.55)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Learn more */}
        <div className="mt-auto pt-2">
          <Link
            href={`/org/${slug}/programs/${programId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
            style={{ color: '#0F1B33', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF5C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#0F1B33')}
          >
            Learn More <ExternalLink size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
