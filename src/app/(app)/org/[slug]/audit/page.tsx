'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Shield, Download, Search, ChevronDown, RefreshCw, ChevronRight,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import { GenericBadge } from '@/components/atoms/Badge'
import { EmptyState } from '@/components/atoms/EmptyState'
import type { AuditLog, AuditAction } from '@/types/audit'
import { ACTION_LABELS } from '@/types/audit'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatActionLabel(action: string): string {
  return ACTION_LABELS[action as AuditAction] ?? action.replace(/\./g, ' → ')
}

const ENTITY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  program:            { bg: '#38A16920', text: '#38A169' },
  indicator:          { bg: '#DBEAFE', text: '#1E40AF' },
  expenditure:        { bg: '#FEF3C7', text: '#78350F' },
  budget_amendment:   { bg: '#FEF3C7', text: '#92400E' },
  report:             { bg: '#E0F2FE', text: '#0369A1' },
  profile:            { bg: '#F1F5F9', text: '#475569' },
  team_invitation:    { bg: '#F1F5F9', text: '#475569' },
  donor_invitation:   { bg: '#FDE68A', text: '#78350F' },
  donor_program_access: { bg: '#FDE68A', text: '#92400E' },
  donor_access_request: { bg: '#FDE68A', text: '#78350F' },
  field_submission:   { bg: '#38A16920', text: '#065F46' },
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  program:              'Program',
  indicator:            'Indicator',
  expenditure:          'Expenditure',
  budget_amendment:     'Amendment',
  report:               'Report',
  profile:              'Member',
  team_invitation:      'Invitation',
  donor_invitation:     'Donor Invite',
  donor_program_access: 'Donor Access',
  donor_access_request: 'Access Request',
  field_submission:     'Field Data',
}

const ENTITY_TYPE_OPTIONS = [
  { value: '',                  label: 'All Types' },
  { value: 'program',           label: 'Programs' },
  { value: 'indicator',         label: 'Indicators' },
  { value: 'expenditure',       label: 'Budget' },
  { value: 'report',            label: 'Reports' },
  { value: 'profile',           label: 'Team' },
  { value: 'donor_program_access', label: 'Donors' },
  { value: 'field_submission',  label: 'Field Data' },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface TeamMember { id: string; full_name: string; role: string }

export default function AuditLogPage() {
  const params  = useParams()
  const slug    = params.slug as string

  const [logs,       setLogs]       = useState<AuditLog[]>([])
  const [count,      setCount]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [offset,     setOffset]     = useState(0)
  const [team,       setTeam]       = useState<TeamMember[]>([])
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set())

  // Filters
  const [entityType, setEntityType] = useState('')
  const [actorId,    setActorId]    = useState('')
  const [search,     setSearch]     = useState('')
  const [searching,  setSearching]  = useState(false)

  const LIMIT = 50

  const fetchLogs = useCallback(async (newOffset = 0) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({ limit: String(LIMIT), offset: String(newOffset) })
      if (entityType) sp.set('entity_type', entityType)
      if (actorId)    sp.set('actor_id', actorId)
      if (search)     sp.set('search', search)

      const res = await fetch(`/api/audit?${sp}`)
      if (res.ok) {
        const { data, count: total } = await res.json()
        if (newOffset === 0) {
          setLogs(data ?? [])
        } else {
          setLogs(prev => [...prev, ...(data ?? [])])
        }
        setCount(total ?? 0)
        setOffset(newOffset)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [entityType, actorId, search])

  useEffect(() => { fetchLogs(0) }, [fetchLogs])

  // Fetch team members for filter dropdown
  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(({ data }) => {
      setTeam((data ?? []).map((m: Record<string, unknown>) => ({
        id:        m.id as string,
        full_name: m.full_name as string,
        role:      m.role as string,
      })))
    }).catch(() => {})
  }, [])

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── CSV Export ───────────────────────────────────────────────────────────────

  const exportCSV = async () => {
    try {
      const sp = new URLSearchParams({ limit: '1000', offset: '0' })
      if (entityType) sp.set('entity_type', entityType)
      if (actorId)    sp.set('actor_id', actorId)
      if (search)     sp.set('search', search)

      const res  = await fetch(`/api/audit?${sp}`)
      const { data: rows } = await res.json()

      const header = ['Time', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity', 'Changes', 'IP']
      const csv = [
        header.join(','),
        ...(rows ?? []).map((r: AuditLog) => [
          `"${fullTimestamp(r.created_at)}"`,
          `"${r.actor_name}"`,
          `"${r.actor_role}"`,
          `"${formatActionLabel(r.action)}"`,
          `"${r.entity_type ?? ''}"`,
          `"${r.entity_name ?? ''}"`,
          `"${r.changes ? JSON.stringify(r.changes).replace(/"/g, '""') : ''}"`,
          `"${r.ip_address ?? ''}"`,
        ].join(',')),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `audit-log-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={22} color={COLORS.forest} />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.forest, fontFamily: FONTS.heading }}>
            Audit Log
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.stone, fontFamily: FONTS.body }}>
          Complete record of all actions in your workspace
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        display:  'flex', gap: 10, flexWrap: 'wrap',
        marginBottom: 20, alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.stone, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search entity or action…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              fontSize: 13, borderRadius: 8, border: `1px solid ${COLORS.mist}`,
              background: '#1A2B4A', color: COLORS.forest, fontFamily: FONTS.body, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Entity type */}
        <div style={{ position: 'relative', minWidth: 160 }}>
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            style={{
              width: '100%', padding: '8px 32px 8px 12px',
              fontSize: 13, borderRadius: 8, border: `1px solid ${COLORS.mist}`,
              background: '#1A2B4A', color: COLORS.forest, fontFamily: FONTS.body,
              appearance: 'none', cursor: 'pointer', outline: 'none',
            }}
          >
            {ENTITY_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: COLORS.stone }} />
        </div>

        {/* Team member */}
        <div style={{ position: 'relative', minWidth: 180 }}>
          <select
            value={actorId}
            onChange={e => setActorId(e.target.value)}
            style={{
              width: '100%', padding: '8px 32px 8px 12px',
              fontSize: 13, borderRadius: 8, border: `1px solid ${COLORS.mist}`,
              background: '#1A2B4A', color: COLORS.forest, fontFamily: FONTS.body,
              appearance: 'none', cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">All Team Members</option>
            {team.map(m => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: COLORS.stone }} />
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchLogs(0)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            fontSize: 13, borderRadius: 8, border: `1px solid ${COLORS.mist}`,
            background: '#1A2B4A', color: COLORS.slate, cursor: 'pointer', fontFamily: FONTS.body,
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>

        {/* Export */}
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            fontSize: 13, borderRadius: 8, border: `1px solid ${COLORS.sage}`,
            background: COLORS.foam, color: COLORS.forest, cursor: 'pointer',
            fontFamily: FONTS.body, fontWeight: 600,
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p style={{ margin: '0 0 12px', fontSize: 12, color: COLORS.stone, fontFamily: FONTS.body }}>
          {count.toLocaleString()} record{count !== 1 ? 's' : ''}
        </p>
      )}

      {/* Table */}
      <div style={{
        background: '#1A2B4A', borderRadius: 12,
        border: `1px solid ${COLORS.mist}`,
        overflow: 'hidden',
        boxShadow: SHADOW.card,
      }}>
        {/* Head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 160px 140px 160px 36px',
          padding: '10px 16px',
          background: COLORS.snow,
          borderBottom: `1px solid ${COLORS.mist}`,
          fontSize: 11, fontWeight: 700, color: COLORS.stone,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          fontFamily: FONTS.body,
        }}>
          <span>Time</span>
          <span>Action</span>
          <span>Actor</span>
          <span>Entity</span>
          <span>Changes</span>
          <span />
        </div>

        {loading && logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.stone, fontSize: 13, fontFamily: FONTS.body }}>
            Loading audit log…
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Shield size={28} color={COLORS.mist} />}
            title="No audit records found"
            description="Actions will be recorded here as they happen"
          />
        ) : (
          logs.map((log, idx) => (
            <AuditRow
              key={log.id}
              log={log}
              expanded={expanded.has(log.id)}
              onToggle={() => toggleExpanded(log.id)}
              isLast={idx === logs.length - 1}
            />
          ))
        )}

        {/* Load more */}
        {!loading && logs.length < count && (
          <div style={{ padding: '14px', borderTop: `1px solid ${COLORS.mist}`, textAlign: 'center' }}>
            <button
              onClick={() => fetchLogs(offset + LIMIT)}
              style={{
                padding: '8px 24px', fontSize: 13, borderRadius: 8,
                border: `1px solid ${COLORS.mist}`, background: '#1A2B4A',
                color: COLORS.slate, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Load more ({count - logs.length} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── AuditRow ──────────────────────────────────────────────────────────────────

function AuditRow({
  log, expanded, onToggle, isLast,
}: {
  log: AuditLog; expanded: boolean; onToggle: () => void; isLast: boolean
}) {
  const entityStyle = log.entity_type
    ? (ENTITY_TYPE_COLORS[log.entity_type] ?? { bg: '#F1F5F9', text: '#475569' })
    : null

  const entityLabel = log.entity_type
    ? (ENTITY_TYPE_LABELS[log.entity_type] ?? log.entity_type)
    : null

  const hasDetails = !!(log.changes || log.metadata)

  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${COLORS.mist}` }}>
      {/* Main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr 160px 140px 160px 36px',
        padding: '11px 16px',
        alignItems: 'center',
        background: '#1A2B4A',
        transition: 'background 0.1s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = COLORS.snow)}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#fff')}
      >
        {/* Time */}
        <span
          style={{ fontSize: 12, color: COLORS.stone, fontFamily: FONTS.body, cursor: 'default' }}
          title={fullTimestamp(log.created_at)}
        >
          {relativeTime(log.created_at)}
        </span>

        {/* Action */}
        <span style={{ fontSize: 13, color: COLORS.forest, fontFamily: FONTS.body, fontWeight: 500 }}>
          {formatActionLabel(log.action)}
        </span>

        {/* Actor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar name={log.actor_name} size={22} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: COLORS.forest, fontWeight: 500, fontFamily: FONTS.body }}>
              {log.actor_name}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: COLORS.stone, fontFamily: FONTS.body }}>
              {log.actor_role}
            </p>
          </div>
        </div>

        {/* Entity */}
        <div>
          {entityLabel && (
            <span style={{
              display: 'inline-block',
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
              background: entityStyle?.bg, color: entityStyle?.text,
              fontFamily: FONTS.body, marginBottom: 2,
            }}>
              {entityLabel}
            </span>
          )}
          {log.entity_name && (
            <p style={{ margin: 0, fontSize: 12, color: COLORS.slate, fontFamily: FONTS.body, lineHeight: 1.2 }}>
              {log.entity_name.length > 24 ? log.entity_name.slice(0, 24) + '…' : log.entity_name}
            </p>
          )}
        </div>

        {/* Changes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {log.changes && Object.entries(log.changes).map(([field, { from, to }]) => (
            <span key={field} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 5,
              background: '#FEF3C7', color: '#78350F',
              fontFamily: FONTS.mono,
            }}>
              {field}: {String(from ?? '–')} → {String(to ?? '–')}
            </span>
          ))}
        </div>

        {/* Expand */}
        <button
          onClick={onToggle}
          disabled={!hasDetails}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6,
            border: 'none', background: 'none',
            cursor: hasDetails ? 'pointer' : 'default',
            color: hasDetails ? COLORS.slate : COLORS.mist,
            transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'none',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Expanded metadata */}
      {expanded && hasDetails && (
        <div style={{
          padding: '12px 16px 16px 52px',
          background: COLORS.snow,
          borderTop: `1px solid ${COLORS.mist}`,
          fontSize: 12, fontFamily: FONTS.mono,
          color: COLORS.slate,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {log.changes && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: COLORS.forest }}>Changes: </span>
              {JSON.stringify(log.changes, null, 2)}
            </div>
          )}
          {log.metadata && (
            <div>
              <span style={{ fontWeight: 700, color: COLORS.forest }}>Metadata: </span>
              {JSON.stringify(log.metadata, null, 2)}
            </div>
          )}
          {log.ip_address && (
            <div style={{ marginTop: 8, fontFamily: FONTS.body, fontSize: 11, color: COLORS.stone }}>
              IP: {log.ip_address}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
