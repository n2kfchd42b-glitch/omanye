'use client'

import React, { useState, useMemo } from 'react'
import { Download, ShieldCheck } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { useAuditLog } from '@/lib/useAuditLog'
import { useToast } from '@/components/Toast'
import type { AuditAction, AuditResource, AuditEntry } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_META: Record<AuditAction, { bg: string; label: string }> = {
  CREATE: { bg: COLORS.fern,    label: 'CREATE' },
  UPDATE: { bg: COLORS.sky,     label: 'UPDATE' },
  DELETE: { bg: COLORS.crimson, label: 'DELETE' },
  SUBMIT: { bg: COLORS.moss,    label: 'SUBMIT' },
  EXPORT: { bg: COLORS.amber,   label: 'EXPORT' },
  LOGIN:  { bg: COLORS.stone,   label: 'LOGIN'  },
  INVITE: { bg: '#8B5CF6',      label: 'INVITE' },
}

const RESOURCES: AuditResource[] = [
  'Program', 'Indicator', 'Budget', 'Document',
  'Dataset', 'Team', 'Report', 'Alert', 'Settings',
]

function fmtTimestamp(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ── Filters state ─────────────────────────────────────────────────────────────

interface Filters {
  dateFrom: string
  dateTo: string
  actor: string
  resource: AuditResource | 'all'
  search: string
}

function blankFilters(): Filters {
  return { dateFrom: '', dateTo: '', actor: '', resource: 'all', search: '' }
}

// ── Filter helpers ────────────────────────────────────────────────────────────

function applyFilters(entries: AuditEntry[], f: Filters): AuditEntry[] {
  return entries.filter(e => {
    const ts = new Date(e.timestamp)
    if (f.dateFrom && ts < new Date(f.dateFrom)) return false
    if (f.dateTo) {
      const to = new Date(f.dateTo)
      to.setDate(to.getDate() + 1)
      if (ts >= to) return false
    }
    if (f.actor && !e.actor.toLowerCase().includes(f.actor.toLowerCase())) return false
    if (f.resource !== 'all' && e.resource !== f.resource) return false
    if (f.search && !e.details.toLowerCase().includes(f.search.toLowerCase())) return false
    return true
  })
}

// ── Action Badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditAction }) {
  const { bg, label } = ACTION_META[action]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px', borderRadius: 20,
      background: bg, color: '#ffffff',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ── Input style ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 7, fontFamily: FONTS.body,
  fontSize: 12, color: COLORS.charcoal, background: COLORS.snow,
  border: `1px solid ${COLORS.mist}`, outline: 'none',
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AuditTrail() {
  const { entries } = useAuditLog()
  const { toast } = useToast()
  const [filters, setFilters] = useState<Filters>(blankFilters())

  function setFilter<K extends keyof Filters>(k: K, v: Filters[K]) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  const filtered = useMemo(() => applyFilters(entries, filters), [entries, filters])

  function handleExport() {
    toast('Audit log exported', 'success')
  }

  return (
    <div className="fade-up" style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, margin: 0 }}>
            Audit Trail
          </h2>
          <p style={{ fontSize: 13, color: COLORS.stone, margin: '4px 0 0' }}>
            {filtered.length} of {entries.length} entries
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            background: COLORS.forest, border: 'none', color: '#ffffff',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters row */}
      <div style={{
        background: COLORS.pearl, borderRadius: 10, boxShadow: SHADOW.card,
        border: `1px solid ${COLORS.mist}`, padding: '14px 18px',
        marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end',
      }}>
        {/* Date from */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.slate, marginBottom: 4 }}>
            From
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilter('dateFrom', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Date to */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.slate, marginBottom: 4 }}>
            To
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilter('dateTo', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Actor */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.slate, marginBottom: 4 }}>
            Actor
          </label>
          <input
            value={filters.actor}
            onChange={e => setFilter('actor', e.target.value)}
            placeholder="Search actor…"
            style={{ ...inputStyle, width: 140 }}
          />
        </div>

        {/* Details search */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: COLORS.slate, marginBottom: 4 }}>
            Search Details
          </label>
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder="Search details…"
            style={{ ...inputStyle, width: 160 }}
          />
        </div>

        {/* Reset */}
        {(filters.dateFrom || filters.dateTo || filters.actor || filters.search || filters.resource !== 'all') && (
          <button
            onClick={() => setFilters(blankFilters())}
            style={{
              padding: '7px 14px', borderRadius: 7, cursor: 'pointer',
              background: 'none', border: `1px solid ${COLORS.mist}`,
              color: COLORS.stone, fontFamily: FONTS.body, fontSize: 12,
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Resource pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...RESOURCES] as const).map(r => {
          const active = filters.resource === r
          return (
            <button
              key={r}
              onClick={() => setFilter('resource', r)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                fontFamily: FONTS.body, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${active ? COLORS.fern : COLORS.mist}`,
                background: active ? COLORS.fern : COLORS.pearl,
                color: active ? '#ffffff' : COLORS.slate,
              }}
            >
              {r === 'all' ? 'All' : r}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '72px 32px',
          background: COLORS.snow, borderRadius: 12,
          border: `2px dashed ${COLORS.mist}`,
        }}>
          <ShieldCheck size={40} style={{ color: COLORS.mist, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: COLORS.stone, marginBottom: 6, fontFamily: FONTS.heading }}>
            No audit entries yet
          </p>
          <p style={{ fontSize: 13, color: COLORS.stone }}>
            Actions taken in the app will appear here automatically.
          </p>
        </div>
      )}

      {/* Table */}
      {entries.length > 0 && (
        <div style={{
          background: COLORS.pearl, borderRadius: 12, boxShadow: SHADOW.card,
          border: `1px solid ${COLORS.mist}`, overflow: 'hidden',
        }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: COLORS.stone, fontStyle: 'italic', fontSize: 13 }}>
              No entries match the current filters.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.forest }}>
                    {['Timestamp', 'Actor', 'Action', 'Resource', 'Details', 'IP'].map(col => (
                      <th key={col} style={{
                        padding: '10px 14px', textAlign: 'left',
                        fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700,
                        color: '#ffffff', whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry, i) => (
                    <tr key={entry.id} style={{
                      background: i % 2 === 0 ? COLORS.pearl : COLORS.foam,
                      borderBottom: `1px solid ${COLORS.mist}`,
                    }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: COLORS.slate, fontSize: 12, fontFamily: FONTS.mono }}>
                        {fmtTimestamp(entry.timestamp)}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: COLORS.charcoal, whiteSpace: 'nowrap' }}>
                        {entry.actor}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <ActionBadge action={entry.action} />
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: COLORS.mist, color: COLORS.moss, fontWeight: 600,
                        }}>
                          {entry.resource}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: COLORS.slate, maxWidth: 320 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.details}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: COLORS.stone, fontSize: 11, fontFamily: FONTS.mono, whiteSpace: 'nowrap' }}>
                        {entry.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
