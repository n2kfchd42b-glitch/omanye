'use client'

import React, { useState, useMemo } from 'react'
import {
  Plus, X, ChevronDown, ChevronUp, Bell, Eye,
  CheckCircle2, Clock, AlertTriangle, Circle,
  Users, ClipboardList, AlertCircle, TrendingUp, Loader2,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { useToast } from '@/components/Toast'
import { useAuditLog } from '@/lib/useAuditLog'
import type { CollectionPeriod, FieldAssignment, TeamMember, User } from '@/lib/types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  periods: CollectionPeriod[]
  setPeriods: React.Dispatch<React.SetStateAction<CollectionPeriod[]>>
  team: TeamMember[]
  user: User
  loading?: boolean
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AssignmentStatus = FieldAssignment['status']
type FilterTab = 'all' | AssignmentStatus

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<AssignmentStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  submitted:   { label: 'Submitted',   color: COLORS.fern,    bg: '#38A16920', Icon: CheckCircle2 },
  pending:     { label: 'Pending',     color: COLORS.amber,   bg: '#D4AF5C20', Icon: Clock },
  overdue:     { label: 'Overdue',     color: COLORS.crimson, bg: '#E53E3E20', Icon: AlertTriangle },
  not_started: { label: 'Not Started', color: COLORS.stone,   bg: COLORS.mist, Icon: Circle },
}

const FILTER_TABS: FilterTab[] = ['all', 'submitted', 'pending', 'overdue', 'not_started']

let _id = Date.now()
const nextId = () => ++_id

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{
      background: COLORS.pearl, borderRadius: 12, boxShadow: SHADOW.card,
      border: `1px solid ${COLORS.mist}`, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 140,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.forest, margin: 0, fontFamily: FONTS.heading }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: COLORS.stone, margin: 0, marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

// ── New Period Modal ──────────────────────────────────────────────────────────

interface NewPeriodForm {
  name: string
  programName: string
  dueDate: string
  districts: string
  selectedStaff: number[]
}

function NewPeriodModal({
  team, onClose, onCreate,
}: {
  team: TeamMember[]
  onClose: () => void
  onCreate: (p: CollectionPeriod) => void
}) {
  const [form, setForm] = useState<NewPeriodForm>({
    name: '', programName: '', dueDate: '', districts: '', selectedStaff: [],
  })
  const { toast } = useToast()

  function set<K extends keyof NewPeriodForm>(k: K, v: NewPeriodForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleStaff(id: number) {
    setForm(f => ({
      ...f,
      selectedStaff: f.selectedStaff.includes(id)
        ? f.selectedStaff.filter(x => x !== id)
        : [...f.selectedStaff, id],
    }))
  }

  function handleCreate() {
    if (!form.name.trim()) { toast('Period name is required', 'error'); return }

    const districtList = form.districts
      .split(',')
      .map(d => d.trim())
      .filter(Boolean)

    const staffMembers = team.filter(t => form.selectedStaff.includes(t.id))

    // Create one assignment per selected staff × district (or just one if no districts)
    const assignments: FieldAssignment[] = staffMembers.flatMap(member => {
      if (districtList.length === 0) {
        return [{
          id: nextId(),
          staffName: member.name,
          district: '—',
          status: 'not_started' as const,
        }]
      }
      return districtList.map(district => ({
        id: nextId(),
        staffName: member.name,
        district,
        status: 'not_started' as const,
      }))
    })

    const period: CollectionPeriod = {
      id: nextId(),
      name: form.name.trim(),
      programId: 0,
      programName: form.programName.trim() || 'Unspecified',
      dueDate: form.dueDate,
      status: 'open',
      assignments,
    }
    onCreate(period)
    onClose()
  }

  const districtChips = form.districts.split(',').map(d => d.trim()).filter(Boolean)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: COLORS.pearl, borderRadius: 14, width: '100%', maxWidth: 540,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: SHADOW.modal, fontFamily: FONTS.body,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${COLORS.mist}`,
        }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.forest, margin: 0 }}>
            New Collection Period
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.stone }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Period Name *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Q2 2025 Data Collection"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Program Name">
            <input
              value={form.programName}
              onChange={e => set('programName', e.target.value)}
              placeholder="Enter program name"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Due Date">
            <input
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              style={inputStyle}
            />
          </FormField>
          <FormField label="Districts (comma-separated)">
            <input
              value={form.districts}
              onChange={e => set('districts', e.target.value)}
              placeholder="e.g. Accra, Kumasi, Tamale"
              style={inputStyle}
            />
            {districtChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {districtChips.map(d => (
                  <span key={d} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: COLORS.mist, color: COLORS.moss, fontWeight: 500,
                  }}>{d}</span>
                ))}
              </div>
            )}
          </FormField>

          <FormField label="Assign Staff">
            {team.length === 0 ? (
              <p style={{ fontSize: 12, color: COLORS.stone, fontStyle: 'italic' }}>No team members available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {team.map(member => {
                  const checked = form.selectedStaff.includes(member.id)
                  return (
                    <label key={member.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      background: checked ? COLORS.foam : COLORS.snow,
                      border: `1px solid ${checked ? COLORS.mint : COLORS.mist}`,
                    }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStaff(member.id)}
                        style={{ accentColor: COLORS.fern }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>{member.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: COLORS.stone }}>{member.role}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </FormField>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 24px', borderTop: `1px solid ${COLORS.mist}`,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8, background: 'none',
              border: `1px solid ${COLORS.mist}`, color: COLORS.slate,
              fontFamily: FONTS.body, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            style={{
              padding: '8px 20px', borderRadius: 8,
              background: COLORS.fern, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Create Period
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: FONTS.body,
  fontSize: 13, color: COLORS.charcoal, background: COLORS.snow,
  border: `1px solid ${COLORS.mist}`, outline: 'none', boxSizing: 'border-box',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Period Card ───────────────────────────────────────────────────────────────

function PeriodCard({
  period, filter, onMarkSubmitted, onSendReminder, onView,
}: {
  period: CollectionPeriod
  filter: FilterTab
  onMarkSubmitted: (periodId: number, assignmentId: number) => void
  onSendReminder: (assignmentId: number, staffName: string) => void
  onView: (assignmentId: number) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const filteredAssignments = useMemo(() => {
    if (filter === 'all') return period.assignments
    return period.assignments.filter(a => a.status === filter)
  }, [period.assignments, filter])

  const submitted = period.assignments.filter(a => a.status === 'submitted').length
  const total = period.assignments.length
  const overdue = period.assignments.filter(a => a.status === 'overdue').length
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0

  const periodStatusColor = period.status === 'open'
    ? COLORS.fern : period.status === 'overdue'
    ? COLORS.crimson : COLORS.stone

  return (
    <div style={{
      background: COLORS.pearl, borderRadius: 12, boxShadow: SHADOW.card,
      border: `1px solid ${COLORS.mist}`, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? <ChevronUp size={16} style={{ color: COLORS.stone, flexShrink: 0 }} />
                  : <ChevronDown size={16} style={{ color: COLORS.stone, flexShrink: 0 }} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: COLORS.forest, margin: 0 }}>{period.name}</p>
            <span style={{ fontSize: 11, fontWeight: 600, color: periodStatusColor }}>
              {period.status.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.stone, margin: '3px 0 0' }}>
            {period.programName} · Due {fmtDate(period.dueDate)}
            {overdue > 0 && <span style={{ color: COLORS.crimson, marginLeft: 10, fontWeight: 600 }}>
              {overdue} overdue
            </span>}
          </p>
        </div>

        {/* Progress */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.forest, margin: 0 }}>{pct}%</p>
          <p style={{ fontSize: 11, color: COLORS.stone, margin: '2px 0 0' }}>{submitted}/{total} submitted</p>
          <div style={{ height: 4, width: 80, background: COLORS.mist, borderRadius: 2, marginTop: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: COLORS.sage, borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Expanded table */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.mist}`, overflowX: 'auto' }}>
          {filteredAssignments.length === 0 ? (
            <p style={{ padding: '24px', textAlign: 'center', color: COLORS.stone, fontSize: 13, fontStyle: 'italic' }}>
              No assignments match this filter.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: COLORS.snow }}>
                  {['Staff Name', 'District', 'Status', 'Submitted At', 'Records', 'Actions'].map(col => (
                    <th key={col} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontFamily: FONTS.heading, fontSize: 12, fontWeight: 700,
                      color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}`,
                      whiteSpace: 'nowrap',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a, i) => {
                  const sm = STATUS_META[a.status]
                  const Icon = sm.Icon
                  return (
                    <tr key={a.id} style={{
                      background: i % 2 === 0 ? COLORS.pearl : COLORS.snow,
                      borderBottom: `1px solid ${COLORS.mist}`,
                    }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: COLORS.charcoal }}>{a.staffName}</td>
                      <td style={{ padding: '10px 14px', color: COLORS.slate }}>{a.district}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          background: sm.bg, color: sm.color,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          <Icon size={10} /> {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: COLORS.slate, fontSize: 12 }}>
                        {a.submittedAt ? fmtDate(a.submittedAt) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: COLORS.slate, textAlign: 'center' }}>
                        {a.records ?? '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {a.status !== 'submitted' && (
                            <button
                              onClick={() => onMarkSubmitted(period.id, a.id)}
                              title="Mark as submitted"
                              style={tblBtnStyle(COLORS.fern)}
                            >
                              <CheckCircle2 size={11} /> Mark Submitted
                            </button>
                          )}
                          {a.status !== 'submitted' && (
                            <button
                              onClick={() => onSendReminder(a.id, a.staffName)}
                              title="Send reminder"
                              style={tblBtnStyle(COLORS.amber)}
                            >
                              <Bell size={11} /> Remind
                            </button>
                          )}
                          <button
                            onClick={() => onView(a.id)}
                            title="View submission"
                            style={tblBtnStyle(COLORS.slate)}
                          >
                            <Eye size={11} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function tblBtnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${color}`, background: 'none',
    color, fontFamily: FONTS.body, fontSize: 11, fontWeight: 600,
    whiteSpace: 'nowrap',
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FieldStatus({ periods, setPeriods, team, user, loading = false }: Props) {
  const { toast } = useToast()
  const { append } = useAuditLog()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')

  // Aggregate stats
  const allAssignments = useMemo(() => periods.flatMap(p => p.assignments), [periods])
  const totalAssigned = allAssignments.length
  const totalSubmitted = allAssignments.filter(a => a.status === 'submitted').length
  const totalOverdue = allAssignments.filter(a => a.status === 'overdue').length
  const completionRate = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  function handleCreate(period: CollectionPeriod) {
    setPeriods(prev => [period, ...prev])
    toast(`Collection period "${period.name}" created`, 'success')
    append({
      actor: user.name,
      action: 'CREATE',
      resource: 'Dataset',
      resourceName: period.name,
      details: `Created collection period with ${period.assignments.length} assignment(s)`,
    })
  }

  function handleMarkSubmitted(periodId: number, assignmentId: number) {
    setPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p
      return {
        ...p,
        assignments: p.assignments.map(a => a.id === assignmentId
          ? { ...a, status: 'submitted' as const, submittedAt: new Date().toISOString() }
          : a
        ),
      }
    }))
    toast('Assignment marked as submitted', 'success')
    append({
      actor: user.name,
      action: 'UPDATE',
      resource: 'Dataset',
      resourceName: 'Field Assignment',
      details: `Marked assignment #${assignmentId} as submitted`,
    })
  }

  function handleSendReminder(_assignmentId: number, staffName: string) {
    toast(`Reminder sent to ${staffName}`, 'success')
    append({
      actor: user.name,
      action: 'UPDATE',
      resource: 'Team',
      resourceName: staffName,
      details: 'Sent submission reminder',
    })
  }

  function handleView(_assignmentId: number) {
    toast('Opening submission view…', 'success')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, fontFamily: FONTS.body }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={28} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: COLORS.stone }}>Loading field data…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up" style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, margin: 0 }}>
            Field Status
          </h2>
          <p style={{ fontSize: 13, color: COLORS.stone, margin: '4px 0 0' }}>
            {periods.length} collection period{periods.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            background: COLORS.forest, border: 'none', color: '#ffffff',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Collection Period
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Assigned" value={totalAssigned} icon={<Users size={18} />} color={COLORS.fern} />
        <StatCard label="Submitted" value={totalSubmitted} icon={<ClipboardList size={18} />} color={COLORS.sage} />
        <StatCard label="Overdue" value={totalOverdue} icon={<AlertCircle size={18} />} color={COLORS.crimson} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<TrendingUp size={18} />} color={COLORS.gold} />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(f => {
          const active = filter === f
          const label = f === 'all' ? 'All'
            : f === 'not_started' ? 'Not Started'
            : f.charAt(0).toUpperCase() + f.slice(1)
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
                border: `1.5px solid ${active ? COLORS.fern : COLORS.mist}`,
                background: active ? COLORS.fern : COLORS.pearl,
                color: active ? '#ffffff' : COLORS.slate,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {periods.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '72px 32px',
          background: COLORS.snow, borderRadius: 12,
          border: `2px dashed ${COLORS.mist}`,
        }}>
          <ClipboardList size={40} style={{ color: COLORS.mist, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: COLORS.stone, marginBottom: 20, fontFamily: FONTS.heading }}>
            No collection periods yet
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: COLORS.fern, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Create First Period
          </button>
        </div>
      )}

      {/* Period cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {periods.map(p => (
          <PeriodCard
            key={p.id}
            period={p}
            filter={filter}
            onMarkSubmitted={handleMarkSubmitted}
            onSendReminder={handleSendReminder}
            onView={handleView}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <NewPeriodModal
          team={team}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
