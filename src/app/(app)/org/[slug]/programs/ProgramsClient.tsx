'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, FolderOpen, Search, Lock, Eye, Globe,
  MapPin, Calendar, TrendingUp, Star,
} from 'lucide-react'
import { COLORS, FONTS, STATUS_MAP } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { pct, formatCurrency } from '@/lib/utils'
import type { Program, ProgramStatus as ProgramStatusDB, ProgramVisibility } from '@/lib/programs'
import { PROGRAM_STATUS_LABELS, VISIBILITY_LABELS } from '@/lib/programs'
import type { OmanyeRole } from '@/lib/supabase/database.types'

interface HealthScore {
  rag_status:      string
  composite_score: number
}

interface Props {
  programs:     Program[]
  userRole:     OmanyeRole
  orgSlug:      string
  healthScores?: Record<string, HealthScore>
}

const STATUS_FILTERS: (ProgramStatusDB | 'all')[] = ['all', 'ACTIVE', 'PLANNING', 'COMPLETED', 'SUSPENDED']

const VISIBILITY_ICONS: Record<ProgramVisibility, React.ReactNode> = {
  PRIVATE:    <Lock  size={10} />,
  DONOR_ONLY: <Eye   size={10} />,
  PUBLIC:     <Globe size={10} />,
}

const VISIBILITY_COLORS: Record<ProgramVisibility, { bg: string; text: string }> = {
  PRIVATE:    { bg: '#F1F5F9', text: '#475569' },
  DONOR_ONLY: { bg: '#E0F2FE', text: '#0369A1' },
  PUBLIC:     { bg: '#38A16920', text: '#38A169' },
}

export default function ProgramsClient({ programs, userRole, orgSlug, healthScores = {} }: Props) {
  const router = useRouter()
  const [filter, setFilter]   = useState<ProgramStatusDB | 'all'>('all')
  const [search, setSearch]   = useState('')

  const canEdit = userRole === 'NGO_ADMIN' || userRole === 'NGO_STAFF'

  const filtered = programs.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 4px' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
            Programs
          </h1>
          <p style={{ fontSize: 13, color: COLORS.stone }}>
            {programs.length} program{programs.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => router.push(`/org/${orgSlug}/programs/new`)}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         6,
              padding:     '9px 18px',
              borderRadius: 8,
              background:  COLORS.moss,
              color:       '#fff',
              fontSize:    13,
              fontWeight:  600,
              cursor:      'pointer',
              border:      'none',
              transition:  'background 0.15s',
            }}
          >
            <Plus size={14} /> New Program
          </button>
        )}
      </div>

      {/* Filter bar + search */}
      <div className="fade-up-1" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:     '5px 13px',
                borderRadius: 20,
                fontSize:    12,
                fontWeight:  500,
                cursor:      'pointer',
                transition:  'all 0.15s',
                background:  filter === f ? COLORS.moss : COLORS.foam,
                color:       filter === f ? '#fff' : COLORS.slate,
                border:      `1px solid ${filter === f ? COLORS.moss : COLORS.mist}`,
              }}
            >
              {f === 'all' ? 'All' : PROGRAM_STATUS_LABELS[f as ProgramStatusDB]}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.stone }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search programs…"
            style={{
              paddingLeft:   32,
              paddingRight:  12,
              paddingTop:    7,
              paddingBottom: 7,
              borderRadius:  8,
              border:        `1px solid ${COLORS.mist}`,
              fontSize:      13,
              background:    '#fff',
              color:         COLORS.charcoal,
              outline:       'none',
              minWidth:      200,
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {programs.length === 0 ? (
        <div className="card fade-up-2" style={{ padding: 0 }}>
          <EmptyState
            icon={<FolderOpen size={24} />}
            title="No programs yet"
            description="Create your first program to start tracking activities, indicators, and donor reports."
            action={canEdit ? (
              <button
                onClick={() => router.push(`/org/${orgSlug}/programs/new`)}
                style={{
                  display:     'inline-flex',
                  alignItems:  'center',
                  gap:         6,
                  padding:     '9px 18px',
                  borderRadius: 8,
                  background:  COLORS.moss,
                  color:       '#fff',
                  fontSize:    13,
                  fontWeight:  600,
                  cursor:      'pointer',
                  border:      'none',
                }}
              >
                <Plus size={14} /> Create First Program
              </button>
            ) : undefined}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card fade-up-2" style={{ padding: 0 }}>
          <EmptyState title="No matching programs" description="Try a different filter or search term." compact />
        </div>
      ) : (
        <div
          className="fade-up-2"
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 18,
          }}
        >
          {filtered.map(p => (
            <ProgramCard
              key={p.id}
              program={p}
              health={healthScores[p.id]}
              onClick={() => router.push(`/org/${orgSlug}/programs/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── RAG colors ────────────────────────────────────────────────────────────────

const RAG_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  green: { bg: '#38A16914', text: '#38A169', dot: '#38A169' },
  amber: { bg: '#D4AF5C14', text: '#D4AF5C', dot: '#D4AF5C' },
  red:   { bg: '#E53E3E14', text: '#E53E3E', dot: '#E53E3E' },
}

const RAG_LABELS: Record<string, string> = {
  green: 'On Track',
  amber: 'At Risk',
  red:   'Critical',
}

// ── ProgramCard ────────────────────────────────────────────────────────────────

function ProgramCard({ program: p, health, onClick }: {
  program: Program
  health?: HealthScore
  onClick: () => void
}) {
  const statusKey  = p.status.toLowerCase()
  const barColor   = STATUS_MAP[statusKey]?.dot ?? COLORS.stone
  const vis        = p.visibility as ProgramVisibility
  const visColors  = VISIBILITY_COLORS[vis]

  // Calculate overall achievement % (placeholder — real data from indicators)
  const progressPct = 0

  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
    >
      {/* Cover image or gradient hero */}
      <div style={{
        height:     p.cover_image_url ? 120 : 80,
        background: p.cover_image_url
          ? `url(${p.cover_image_url}) center/cover`
          : `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.moss} 100%)`,
        position:  'relative',
        flexShrink: 0,
      }}>
        {!p.cover_image_url && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', opacity: 0.12,
          }}>
            {/* Adinkrahene watermark placeholder */}
            <svg viewBox="0 0 60 60" width={60} fill="white">
              <circle cx="30" cy="30" r="28" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="30" cy="30" r="18" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="30" cy="30" r="8"  fill="none" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusBadge status={statusKey} />
        </div>
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        4,
            padding:    '2px 8px',
            borderRadius: 10,
            fontSize:   10,
            fontWeight: 600,
            background: visColors.bg,
            color:      visColors.text,
          }}>
            {VISIBILITY_ICONS[vis]}
            {VISIBILITY_LABELS[vis]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
          <h3 style={{
            fontFamily: FONTS.heading,
            fontSize:   15,
            fontWeight: 700,
            color:      COLORS.forest,
            lineHeight: 1.3,
            margin:     0,
            flex:       1,
          }}>
            {p.name}
          </h3>
          {health && (() => {
            const rc = RAG_COLORS[health.rag_status] ?? RAG_COLORS.amber
            return (
              <span style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          4,
                padding:      '2px 8px',
                borderRadius: 10,
                fontSize:     10,
                fontWeight:   600,
                background:   rc.bg,
                color:        rc.text,
                flexShrink:   0,
                whiteSpace:   'nowrap',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: rc.dot, display: 'inline-block' }} />
                {health.composite_score} · {RAG_LABELS[health.rag_status] ?? health.rag_status}
              </span>
            )
          })()}
        </div>

        {p.objective && (
          <p style={{
            fontSize:    12,
            color:       COLORS.slate,
            marginBottom: 10,
            lineHeight:  1.5,
            display:     '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:    'hidden',
          }}>
            {p.objective}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          {p.primary_funder && (
            <GenericBadge
              label={p.primary_funder}
              bg={COLORS.gold + '22'}
              text={COLORS.gold}
            />
          )}
          {(p.location_country || p.location_region) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: COLORS.stone }}>
              <MapPin size={10} />
              {[p.location_region, p.location_country].filter(Boolean).join(', ')}
            </span>
          )}
          {p.end_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: COLORS.stone }}>
              <Calendar size={10} />
              {new Date(p.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>

        {/* Tags */}
        {p.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {p.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                padding:     '2px 7px',
                borderRadius: 10,
                fontSize:    10,
                background:  COLORS.foam,
                color:       COLORS.slate,
                border:      `1px solid ${COLORS.mist}`,
              }}>
                {tag}
              </span>
            ))}
            {p.tags.length > 3 && (
              <span style={{ fontSize: 10, color: COLORS.stone, alignSelf: 'center' }}>
                +{p.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress ring + budget */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={12} color={COLORS.sage} />
            <span style={{ fontSize: 11, color: COLORS.stone }}>
              {progressPct}% overall achievement
            </span>
          </div>
          {p.total_budget && (
            <span style={{ fontSize: 11, color: COLORS.stone, fontWeight: 600 }}>
              {formatCurrency(p.total_budget, p.currency)}
            </span>
          )}
        </div>

        {/* View button */}
        <div style={{ marginTop: 14 }}>
          <div style={{
            width:       '100%',
            padding:     '7px 0',
            borderRadius: 7,
            background:  COLORS.foam,
            border:      `1px solid ${COLORS.mist}`,
            fontSize:    12,
            fontWeight:  600,
            color:       COLORS.fern,
            textAlign:   'center',
          }}>
            View Program
          </div>
        </div>
      </div>
    </div>
  )
}
