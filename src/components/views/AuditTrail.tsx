'use client'

import React, { useState, useMemo } from 'react'
import { Download, ShieldCheck } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { useAuditLog } from '@/lib/useAuditLog'
import { useToast } from '@/components/Toast'
import { EmptyState } from '@/components/atoms/EmptyState'
import type { AuditAction, AuditResource } from '@/lib/types'

// ── Badge colors ──────────────────────────────────────────────────────────────

const ACTION_COLORS: Record<AuditAction, { bg: string; text: string }> = {
  CREATE: { bg: COLORS.fern,    text: '#fff' },
  UPDATE: { bg: '#2563EB',      text: '#fff' },
  DELETE: { bg: COLORS.crimson, text: '#fff' },
  SUBMIT: { bg: COLORS.moss,    text: '#fff' },
  EXPORT: { bg: COLORS.amber,   text: '#fff' },
  LOGIN:  { bg: COLORS.stone,   text: '#fff' },
  INVITE: { bg: '#8B5CF6',      text: '#fff' },
}

const RESOURCES: AuditResource[] = [
  'Program', 'Indicator', 'Budget', 'Document',
  'Dataset', 'Team', 'Report', 'Alert', 'Settings',
]

// ── AuditTrail view ───────────────────────────────────────────────────────────

export function AuditTrail() {
  const { entries } = useAuditLog()
  const { success } = useToast()

  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [actorFilter,  setActorFilter]  = useState('')
  const [resourceFilter, setResourceFilter] = useState<AuditResource | 'all'>('all')
  const [searchFilter, setSearchFilter] = useState('')

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const ts = new Date(e.timestamp)
      if (dateFrom && ts < new Date(dateFrom)) return false
      if (dateTo   && ts > new Date(dateTo + 'T23:59:59')) return false
      if (actorFilter && !e.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false
      if (resourceFilter !== 'all' && e.resource !== resourceFilter) return false
      if (searchFilter && !e.details.toLowerCase().includes(searchFilter.toLowerCase()) &&
          !e.resourceName.toLowerCase().includes(searchFilter.toLowerCase())) return false
      return true
    })
  }, [entries, dateFrom, dateTo, actorFilter, resourceFilter, searchFilter])

  function handleExport() {
    const header = 'Timestamp,Actor,Action,Resource,Resource Name,Details,IP'
    const rows = filtered.map(e =>
      [e.timestamp, e.actor, e.action, e.resource, e.resourceName, `"${e.details}"`, e.ip].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    success('Audit log exported')
  }

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px', borderRadius: 8,
    border: `1px solid ${COLORS.mist}`, fontSize: 13,
    color: COLORS.forest, background: '#fff',
    outline: 'none',
  }

  return (
    <div className="fade-up" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Audit Trail</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>
            {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'} · read-only
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            border: `1px solid ${COLORS.mist}`,
            background: '#fff', color: COLORS.slate,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="fade-up-1 card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ ...inputStyle, width: 140 }} placeholder="From"
          />
          <span style={{ fontSize: 12, color: COLORS.stone }}>to</span>
          <input
            type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <input
            type="text" value={actorFilter} onChange={e => setActorFilter(e.target.value)}
            placeholder="Filter by actor..." style={{ ...inputStyle, width: 160 }}
          />
          <input
            type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search details..." style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
        </div>

        {/* Resource pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          {(['all', ...RESOURCES] as const).map(r => (
            <button
              key={r}
              onClick={() => setResourceFilter(r as AuditResource | 'all')}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
                background: resourceFilter === r ? COLORS.moss : COLORS.foam,
                color: resourceFilter === r ? '#fff' : COLORS.slate,
                border: `1px solid ${resourceFilter === r ? COLORS.moss : COLORS.mist}`,
              }}
            >
              {r === 'all' ? 'All Resources' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ShieldCheck size={24} />}
            title="No audit entries yet"
            description="Actions like creating programs, updating data, and inviting team members will appear here."
          />
        </div>
      ) : (
        <div className="fade-up-2 card" style={{ padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Timestamp', 'Actor', 'Action', 'Resource', 'Details', 'IP'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px', fontSize: 11, fontWeight: 700,
                      color: COLORS.stone, textAlign: 'left',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      whiteSpace: 'nowrap', borderBottom: `1px solid ${COLORS.mist}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const ac = ACTION_COLORS[e.action] ?? { bg: COLORS.stone, text: '#fff' }
                return (
                  <tr
                    key={e.id}
                    style={{ background: i % 2 === 0 ? '#fff' : COLORS.foam, borderTop: `1px solid ${COLORS.mist}` }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: COLORS.stone, whiteSpace: 'nowrap' }}>
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: COLORS.forest, whiteSpace: 'nowrap' }}>
                      {e.actor}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                        background: ac.bg, color: ac.text,
                      }}>
                        {e.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: COLORS.slate, whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                        fontSize: 11, background: COLORS.foam, color: COLORS.fern,
                        border: `1px solid ${COLORS.mist}`,
                      }}>
                        {e.resource}
                      </span>
                      {' '}
                      <span style={{ fontSize: 12, color: COLORS.forest }}>{e.resourceName}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: COLORS.slate, maxWidth: 300 }}>
                      {e.details}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'var(--font-mono)', color: COLORS.stone, whiteSpace: 'nowrap' }}>
                      {e.ip}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
