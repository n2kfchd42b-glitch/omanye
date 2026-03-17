'use client'

import React, { useState, useRef } from 'react'
import {
  ChevronDown, ChevronRight, Pencil, Plus, Download,
  CheckCircle2, AlertTriangle, XCircle, Circle, Link2, X,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { useToast } from '@/components/Toast'
import { useAuditLog } from '@/lib/useAuditLog'
import type { Program, LogframeRow, Indicator } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  program: Program
  onUpdate: (p: Program) => void
}

type Level = LogframeRow['level']
type Status = LogframeRow['status']

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVELS: Level[] = ['goal', 'outcome', 'output', 'activity']

const LEVEL_META: Record<Level, { label: string; color: string; light: string }> = {
  goal:     { label: 'Goal',     color: COLORS.gold,   light: '#3A2D1A' },
  outcome:  { label: 'Outcome',  color: COLORS.sage,   light: COLORS.foam },
  output:   { label: 'Output',   color: COLORS.fern,   light: '#1A3A5C' },
  activity: { label: 'Activity', color: COLORS.mint,   light: '#243352' },
}

const STATUS_CYCLE: Status[] = ['not_started', 'on_track', 'at_risk', 'off_track']

const STATUS_META: Record<Status, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  not_started: { label: 'Not Started', color: COLORS.stone,   bg: COLORS.mist,     Icon: Circle },
  on_track:    { label: 'On Track',    color: COLORS.fern,    bg: '#38A16920',     Icon: CheckCircle2 },
  at_risk:     { label: 'At Risk',     color: COLORS.amber,   bg: '#D4AF5C20',     Icon: AlertTriangle },
  off_track:   { label: 'Off Track',   color: COLORS.crimson, bg: '#E53E3E20',     Icon: XCircle },
}

let _nextId = Date.now()
const newId = () => ++_nextId

// ── Sub-components ────────────────────────────────────────────────────────────

function EditableCell({
  value, onSave, placeholder,
}: { value: string; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const taRef = useRef<HTMLTextAreaElement>(null)

  function start() {
    setDraft(value)
    setEditing(true)
    setTimeout(() => taRef.current?.focus(), 0)
  }

  function save() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (editing) {
    return (
      <textarea
        ref={taRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        rows={3}
        style={{
          width: '100%', resize: 'vertical', padding: '6px 8px',
          border: `1.5px solid ${COLORS.sage}`,
          borderRadius: 6, fontFamily: FONTS.body, fontSize: 13,
          color: COLORS.forest, background: COLORS.snow,
          outline: 'none',
        }}
      />
    )
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: 'text', minHeight: 32 }}
      onClick={start}
    >
      <span style={{ flex: 1, fontSize: 13, color: value ? COLORS.charcoal : COLORS.stone, lineHeight: 1.5 }}>
        {value || <em style={{ color: COLORS.stone }}>{placeholder || 'Click to edit…'}</em>}
      </span>
      <Pencil size={12} style={{ color: COLORS.stone, flexShrink: 0, marginTop: 2 }} />
    </div>
  )
}

function StatusBadge({ status, onClick }: { status: Status; onClick: () => void }) {
  const { label, color, bg, Icon } = STATUS_META[status]
  return (
    <button
      onClick={onClick}
      title="Click to cycle status"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20,
        background: bg, border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, color, whiteSpace: 'nowrap',
      }}
    >
      <Icon size={11} />
      {label}
    </button>
  )
}

function IndicatorDropdown({
  row, indicators, onLink,
}: {
  row: LogframeRow
  indicators: Indicator[]
  onLink: (indicatorId: number) => void
}) {
  const [open, setOpen] = useState(false)
  const available = indicators.filter(i => !row.indicatorIds.includes(i.id))
  const linked = indicators.filter(i => row.indicatorIds.includes(i.id))

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: linked.length ? 6 : 0 }}>
        {linked.map(ind => (
          <span key={ind.id} style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20,
            background: COLORS.mist, color: COLORS.moss, fontWeight: 500,
          }}>
            {ind.name}
          </span>
        ))}
      </div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: COLORS.foam, border: `1px dashed ${COLORS.mint}`,
          cursor: 'pointer', fontSize: 11, color: COLORS.fern,
        }}
      >
        <Link2 size={10} /> Link
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
          borderRadius: 8, boxShadow: SHADOW.modal, minWidth: 220, padding: 6,
        }}>
          {available.length === 0 ? (
            <p style={{ padding: '8px 10px', fontSize: 12, color: COLORS.stone }}>
              No unlinked indicators
            </p>
          ) : available.map(ind => (
            <button
              key={ind.id}
              onClick={() => { onLink(ind.id); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 12, color: COLORS.charcoal,
                borderRadius: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {ind.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LogframeMatrix({ program, onUpdate }: Props) {
  const { toast } = useToast()
  const { append } = useAuditLog()
  const [collapsed, setCollapsed] = useState<Record<Level, boolean>>({
    goal: false, outcome: false, output: false, activity: false,
  })

  function updateRow(rowId: number, changes: Partial<LogframeRow>) {
    const updated = program.logframe.map(r => r.id === rowId ? { ...r, ...changes } : r)
    onUpdate({ ...program, logframe: updated })
  }

  function addRow(level: Level) {
    const existingInLevel = program.logframe.filter(r => r.level === level)
    const newRow: LogframeRow = {
      id: newId(),
      programId: program.id,
      level,
      description: '',
      indicatorIds: [],
      meansOfVerification: '',
      assumptions: '',
      status: 'not_started',
      order: existingInLevel.length,
    }
    onUpdate({ ...program, logframe: [...program.logframe, newRow] })
    toast(`New ${LEVEL_META[level].label} row added`, 'success')
    append({
      actor: 'User',
      action: 'CREATE',
      resource: 'Program',
      resourceName: `${program.name} – Logframe`,
      details: `Added ${level} row`,
    })
  }

  function cycleStatus(rowId: number, current: Status) {
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateRow(rowId, { status: next })
    append({
      actor: 'User',
      action: 'UPDATE',
      resource: 'Program',
      resourceName: `${program.name} – Logframe`,
      details: `Status changed to ${next}`,
    })
  }

  function saveField(rowId: number, field: keyof LogframeRow, value: string) {
    updateRow(rowId, { [field]: value } as Partial<LogframeRow>)
    toast('Row updated', 'success')
    append({
      actor: 'User',
      action: 'UPDATE',
      resource: 'Program',
      resourceName: `${program.name} – Logframe`,
      details: `Updated ${field}`,
    })
  }

  function linkIndicator(rowId: number, indicatorId: number) {
    const row = program.logframe.find(r => r.id === rowId)
    if (!row) return
    updateRow(rowId, { indicatorIds: [...row.indicatorIds, indicatorId] })
    toast('Indicator linked', 'success')
    append({
      actor: 'User',
      action: 'UPDATE',
      resource: 'Indicator',
      resourceName: `Logframe row → Indicator`,
      details: `Linked indicator #${indicatorId}`,
    })
  }

  function handleExport() {
    toast('Logframe exported', 'success')
    append({
      actor: 'User',
      action: 'EXPORT',
      resource: 'Program',
      resourceName: `${program.name} – Logframe`,
      details: 'Exported logframe as file',
    })
  }

  const totalRows = program.logframe.length

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fade-up" style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, margin: 0 }}>
            Logframe Matrix
          </h2>
          <p style={{ fontSize: 13, color: COLORS.stone, margin: '4px 0 0' }}>
            {program.name} · {totalRows} row{totalRows !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: COLORS.forest, border: 'none', color: '#ffffff',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Download size={14} /> Export Logframe
        </button>
      </div>

      {/* Empty state */}
      {totalRows === 0 && (
        <div style={{
          textAlign: 'center', padding: '72px 32px',
          background: COLORS.snow, borderRadius: 12,
          border: `2px dashed ${COLORS.mist}`,
        }}>
          <p style={{ fontSize: 16, color: COLORS.stone, marginBottom: 20, fontFamily: FONTS.heading }}>
            No logframe rows yet
          </p>
          <button
            onClick={() => addRow('goal')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: COLORS.fern, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Goal
          </button>
        </div>
      )}

      {/* Table per level */}
      {totalRows > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {LEVELS.map(level => {
            const { label, color, light } = LEVEL_META[level]
            const rows = program.logframe.filter(r => r.level === level)
            const isCollapsed = collapsed[level]

            return (
              <div key={level} style={{
                border: `1px solid ${COLORS.mist}`, borderRadius: 10,
                boxShadow: SHADOW.card, overflow: 'hidden',
              }}>
                {/* Group header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px',
                    background: light,
                    borderLeft: `4px solid ${color}`,
                    cursor: 'pointer', userSelect: 'none',
                  }}
                  onClick={() => setCollapsed(c => ({ ...c, [level]: !c[level] }))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isCollapsed
                      ? <ChevronRight size={16} style={{ color }} />
                      : <ChevronDown size={16} style={{ color }} />
                    }
                    <span style={{
                      fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color,
                    }}>
                      {label}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      background: color, color: '#ffffff',
                    }}>
                      {rows.length}
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); addRow(level) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 12px', borderRadius: 6,
                      background: color, border: 'none', color: '#ffffff',
                      fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={11} /> Add Row
                  </button>
                </div>

                {/* Table */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: COLORS.snow }}>
                          {['Description', 'Indicators', 'Means of Verification', 'Assumptions', 'Status'].map(col => (
                            <th key={col} style={{
                              padding: '9px 14px', textAlign: 'left',
                              fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700,
                              color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{
                              padding: '28px 14px', textAlign: 'center',
                              color: COLORS.stone, fontStyle: 'italic', fontSize: 12,
                            }}>
                              No {label.toLowerCase()} rows. Click "Add Row" above.
                            </td>
                          </tr>
                        ) : rows.map((row, idx) => (
                          <tr key={row.id} style={{
                            background: idx % 2 === 0 ? COLORS.pearl : COLORS.snow,
                            borderBottom: `1px solid ${COLORS.mist}`,
                          }}>
                            <td style={{ padding: '10px 14px', verticalAlign: 'top', minWidth: 220 }}>
                              <EditableCell
                                value={row.description}
                                onSave={v => saveField(row.id, 'description', v)}
                                placeholder="Enter description…"
                              />
                            </td>
                            <td style={{ padding: '10px 14px', verticalAlign: 'top', minWidth: 180 }}>
                              <IndicatorDropdown
                                row={row}
                                indicators={program.indicators}
                                onLink={indId => linkIndicator(row.id, indId)}
                              />
                            </td>
                            <td style={{ padding: '10px 14px', verticalAlign: 'top', minWidth: 180 }}>
                              <EditableCell
                                value={row.meansOfVerification}
                                onSave={v => saveField(row.id, 'meansOfVerification', v)}
                                placeholder="Means of verification…"
                              />
                            </td>
                            <td style={{ padding: '10px 14px', verticalAlign: 'top', minWidth: 180 }}>
                              <EditableCell
                                value={row.assumptions}
                                onSave={v => saveField(row.id, 'assumptions', v)}
                                placeholder="Assumptions…"
                              />
                            </td>
                            <td style={{ padding: '10px 14px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                              <StatusBadge
                                status={row.status}
                                onClick={() => cycleStatus(row.id, row.status)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
