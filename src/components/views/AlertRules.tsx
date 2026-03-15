'use client'

import React, { useState } from 'react'
import {
  Plus, X, Bell, Mail, Pencil, Trash2,
  AlertTriangle, AlertCircle, Info, Zap, MessageSquare,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { useToast } from '@/components/Toast'
import { useAuditLog } from '@/lib/useAuditLog'
import type { AlertRule, Program, User, TriggerType, Severity } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const SEVERITY_META: Record<Severity, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  low:      { label: 'Low',      color: COLORS.stone,   bg: '#F0F4F2', Icon: Info },
  medium:   { label: 'Medium',   color: COLORS.amber,   bg: '#FEF3C7', Icon: AlertTriangle },
  high:     { label: 'High',     color: COLORS.fern,    bg: '#E8F5EE', Icon: AlertCircle },
  critical: { label: 'Critical', color: COLORS.crimson, bg: '#FEE2E2', Icon: Zap },
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  indicator_below:    'Indicator Below Threshold',
  indicator_above:    'Indicator Above Threshold',
  budget_burn:        'Budget Burn Rate Exceeded',
  report_due:         'Report Due Soon',
  submission_overdue: 'Submission Overdue',
}

const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']
const TRIGGER_TYPES: TriggerType[] = [
  'indicator_below', 'indicator_above', 'budget_burn', 'report_due', 'submission_overdue',
]

let _id = Date.now()
const nextId = () => ++_id

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function ruleDescription(rule: AlertRule): string {
  const prog = rule.programName ? `for ${rule.programName}` : ''
  switch (rule.triggerType) {
    case 'indicator_below':
      return `Alert when ${rule.indicatorName ?? 'indicator'} falls below ${rule.threshold}${rule.unit ? ` ${rule.unit}` : ''} ${prog}`
    case 'indicator_above':
      return `Alert when ${rule.indicatorName ?? 'indicator'} exceeds ${rule.threshold}${rule.unit ? ` ${rule.unit}` : ''} ${prog}`
    case 'budget_burn':
      return `Alert when budget burn rate exceeds ${rule.threshold}% ${prog}`
    case 'report_due':
      return `Alert ${rule.threshold} days before report deadline ${prog}`
    case 'submission_overdue':
      return `Alert when submission is ${rule.threshold} days overdue ${prog}`
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  alertRules:    AlertRule[]
  setAlertRules: React.Dispatch<React.SetStateAction<AlertRule[]>>
  programs:      Program[]
  user:          User
}

// ── Wizard form state ─────────────────────────────────────────────────────────

interface RuleForm {
  name: string
  triggerType: TriggerType
  programId: number | ''
  indicatorId: number | ''
  threshold: string
  unit: string
  severity: Severity
  channels: ('inapp' | 'email')[]
}

function blankForm(): RuleForm {
  return {
    name: '', triggerType: 'indicator_below',
    programId: '', indicatorId: '', threshold: '', unit: '',
    severity: 'medium', channels: ['inapp'],
  }
}

// ── Form helpers ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: FONTS.body,
  fontSize: 13, color: COLORS.charcoal, background: COLORS.snow,
  border: `1px solid ${COLORS.mist}`, outline: 'none', boxSizing: 'border-box',
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: checked ? COLORS.fern : COLORS.mist,
        position: 'relative', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 20 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#ffffff',
        display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

// ── Rule Modal ────────────────────────────────────────────────────────────────

function RuleModal({
  programs, initial, onClose, onSave,
}: {
  programs: Program[]
  initial?: AlertRule
  onClose: () => void
  onSave: (rule: AlertRule) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<RuleForm>(
    initial
      ? {
          name: initial.name, triggerType: initial.triggerType,
          programId: initial.programId ?? '', indicatorId: initial.indicatorId ?? '',
          threshold: String(initial.threshold), unit: initial.unit ?? '',
          severity: initial.severity, channels: [...initial.channels],
        }
      : blankForm()
  )

  function set<K extends keyof RuleForm>(k: K, v: RuleForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleChannel(ch: 'inapp' | 'email') {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }))
  }

  const selectedProg = programs.find(p => p.id === form.programId) ?? null
  const isIndicatorTrigger = form.triggerType === 'indicator_below' || form.triggerType === 'indicator_above'

  function handleSave() {
    if (!form.name.trim()) { toast('Rule name is required', 'error'); return }
    if (!form.threshold || isNaN(Number(form.threshold))) { toast('Valid threshold is required', 'error'); return }

    const rule: AlertRule = {
      id: initial?.id ?? nextId(),
      name: form.name.trim(),
      triggerType: form.triggerType,
      programId: form.programId !== '' ? (form.programId as number) : undefined,
      programName: selectedProg?.name,
      indicatorId: form.indicatorId !== '' ? Number(form.indicatorId) : undefined,
      indicatorName: isIndicatorTrigger && form.indicatorId !== ''
        ? selectedProg?.indicators.find(i => i.id === Number(form.indicatorId))?.name
        : undefined,
      threshold: Number(form.threshold),
      unit: form.unit.trim() || undefined,
      channels: form.channels,
      severity: form.severity,
      active: initial?.active ?? true,
      lastTriggered: initial?.lastTriggered,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    }
    onSave(rule)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,26,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: SHADOW.modal, fontFamily: FONTS.body,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${COLORS.mist}`,
        }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.forest, margin: 0 }}>
            {initial ? 'Edit Alert Rule' : 'Add Alert Rule'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.stone }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <InlineField label="Rule Name *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Low Beneficiary Coverage"
              style={inputStyle}
            />
          </InlineField>

          <InlineField label="Trigger Type">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRIGGER_TYPES.map(tt => (
                <label key={tt} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                  background: form.triggerType === tt ? COLORS.foam : COLORS.snow,
                  border: `1.5px solid ${form.triggerType === tt ? COLORS.mint : COLORS.mist}`,
                }}>
                  <input
                    type="radio" name="triggerType" value={tt}
                    checked={form.triggerType === tt}
                    onChange={() => set('triggerType', tt)}
                    style={{ accentColor: COLORS.fern }}
                  />
                  <span style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: form.triggerType === tt ? 600 : 400 }}>
                    {TRIGGER_LABELS[tt]}
                  </span>
                </label>
              ))}
            </div>
          </InlineField>

          <InlineField label="Program (optional)">
            <select
              value={form.programId}
              onChange={e => { set('programId', Number(e.target.value) || ''); set('indicatorId', '') }}
              style={inputStyle}
            >
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </InlineField>

          {isIndicatorTrigger && (
            <InlineField label="Indicator">
              <select
                value={form.indicatorId}
                onChange={e => set('indicatorId', Number(e.target.value) || '')}
                style={inputStyle}
                disabled={!selectedProg}
              >
                <option value="">{selectedProg ? 'Select indicator…' : 'Select a program first'}</option>
                {(selectedProg?.indicators ?? []).map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </InlineField>
          )}

          <InlineField label={
            form.triggerType === 'budget_burn' ? 'Burn Rate Threshold (%)'
            : form.triggerType === 'report_due' || form.triggerType === 'submission_overdue' ? 'Days Threshold'
            : 'Value Threshold'
          }>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number" value={form.threshold}
                onChange={e => set('threshold', e.target.value)}
                placeholder="e.g. 80"
                style={{ ...inputStyle, flex: 1 }}
              />
              {isIndicatorTrigger && (
                <input
                  value={form.unit} onChange={e => set('unit', e.target.value)}
                  placeholder="unit" style={{ ...inputStyle, width: 80, flex: 'none' }}
                />
              )}
            </div>
          </InlineField>

          <InlineField label="Severity">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SEVERITIES.map(s => {
                const sm = SEVERITY_META[s]
                const active = form.severity === s
                return (
                  <button
                    key={s} onClick={() => set('severity', s)}
                    style={{
                      padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                      fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
                      border: `2px solid ${active ? sm.color : COLORS.mist}`,
                      background: active ? sm.bg : '#ffffff',
                      color: active ? sm.color : COLORS.stone,
                    }}
                  >
                    {sm.label}
                  </button>
                )
              })}
            </div>
          </InlineField>

          <InlineField label="Notification Channels">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(['inapp', 'email'] as const).map(ch => {
                const active = form.channels.includes(ch)
                const label = ch === 'inapp' ? 'In-App' : 'Email'
                const Icon = ch === 'inapp' ? Bell : Mail
                return (
                  <label key={ch} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                    background: active ? COLORS.foam : COLORS.snow,
                    border: `1.5px solid ${active ? COLORS.mint : COLORS.mist}`,
                  }}>
                    <input type="checkbox" checked={active} onChange={() => toggleChannel(ch)} style={{ display: 'none' }} />
                    <Icon size={14} style={{ color: active ? COLORS.fern : COLORS.stone }} />
                    <span style={{ fontSize: 13, color: active ? COLORS.fern : COLORS.stone, fontWeight: active ? 600 : 400 }}>
                      {label}
                    </span>
                  </label>
                )
              })}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                borderRadius: 8, background: COLORS.snow, border: `1.5px solid ${COLORS.mist}`,
                opacity: 0.55, cursor: 'not-allowed',
              }}>
                <MessageSquare size={14} style={{ color: COLORS.stone }} />
                <span style={{ fontSize: 13, color: COLORS.stone }}>SMS</span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 20,
                  background: COLORS.mist, color: COLORS.stone, fontWeight: 600,
                }}>Coming soon</span>
              </div>
            </div>
          </InlineField>
        </div>

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
            onClick={handleSave}
            style={{
              padding: '8px 22px', borderRadius: 8,
              background: COLORS.forest, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {initial ? 'Save Changes' : 'Add Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Icon button style ─────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: `1px solid ${COLORS.mist}`,
  borderRadius: 7, padding: '6px 8px', cursor: 'pointer',
  color: COLORS.slate, display: 'inline-flex', alignItems: 'center',
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AlertRules({ alertRules, setAlertRules, programs, user }: Props) {
  const { toast } = useToast()
  const { append } = useAuditLog()
  const [showModal, setShowModal] = useState(false)
  const [editRule, setEditRule] = useState<AlertRule | undefined>()

  function handleSave(rule: AlertRule) {
    const isEdit = alertRules.some(r => r.id === rule.id)
    if (isEdit) {
      setAlertRules(prev => prev.map(r => r.id === rule.id ? rule : r))
      toast(`Rule "${rule.name}" updated`, 'success')
      append({ actor: user.name, action: 'UPDATE', resource: 'Alert', resourceName: rule.name, details: `Updated: ${TRIGGER_LABELS[rule.triggerType]}` })
    } else {
      setAlertRules(prev => [rule, ...prev])
      toast(`Rule "${rule.name}" created`, 'success')
      append({ actor: user.name, action: 'CREATE', resource: 'Alert', resourceName: rule.name, details: `Created: ${TRIGGER_LABELS[rule.triggerType]}` })
    }
  }

  function handleDelete(rule: AlertRule) {
    setAlertRules(prev => prev.filter(r => r.id !== rule.id))
    toast(`Rule "${rule.name}" deleted`, 'success')
    append({ actor: user.name, action: 'DELETE', resource: 'Alert', resourceName: rule.name, details: 'Deleted alert rule' })
  }

  function handleToggleActive(rule: AlertRule) {
    const updated = { ...rule, active: !rule.active }
    setAlertRules(prev => prev.map(r => r.id === rule.id ? updated : r))
    toast(`Rule "${rule.name}" ${updated.active ? 'enabled' : 'disabled'}`, 'success')
    append({ actor: user.name, action: 'UPDATE', resource: 'Alert', resourceName: rule.name, details: `Alert rule ${updated.active ? 'activated' : 'deactivated'}` })
  }

  return (
    <div className="fade-up" style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, margin: 0 }}>Alert Rules</h2>
          <p style={{ fontSize: 13, color: COLORS.stone, margin: '4px 0 0' }}>
            {alertRules.length} rule{alertRules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => { setEditRule(undefined); setShowModal(true) }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            background: COLORS.forest, border: 'none', color: '#ffffff',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Add Rule
        </button>
      </div>

      {/* Empty state */}
      {alertRules.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '72px 32px',
          background: COLORS.snow, borderRadius: 12, border: `2px dashed ${COLORS.mist}`,
        }}>
          <Bell size={40} style={{ color: COLORS.mist, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: COLORS.stone, marginBottom: 8, fontFamily: FONTS.heading }}>
            No alert rules configured
          </p>
          <p style={{ fontSize: 13, color: COLORS.stone, marginBottom: 20 }}>
            Create rules to get notified when indicators, budget, or submissions need attention.
          </p>
          <button
            onClick={() => { setEditRule(undefined); setShowModal(true) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: COLORS.fern, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Add Your First Rule
          </button>
        </div>
      )}

      {/* Rule cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alertRules.map(rule => {
          const sm = SEVERITY_META[rule.severity]
          const SevIcon = sm.Icon
          return (
            <div key={rule.id} style={{
              background: '#ffffff', borderRadius: 12, boxShadow: SHADOW.card,
              border: `1px solid ${COLORS.mist}`, borderLeft: `4px solid ${sm.color}`,
              padding: '16px 20px', opacity: rule.active ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.forest }}>{rule.name}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600,
                      background: sm.bg, color: sm.color,
                    }}>
                      <SevIcon size={10} /> {sm.label}
                    </span>
                    {rule.programName && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: COLORS.mist, color: COLORS.moss, fontWeight: 500,
                      }}>{rule.programName}</span>
                    )}
                    {!rule.active && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: COLORS.mist, color: COLORS.stone }}>
                        DISABLED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.slate, margin: '0 0 8px', lineHeight: 1.5 }}>
                    {ruleDescription(rule)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {rule.channels.includes('inapp') && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.fern }}>
                          <Bell size={13} /> In-App
                        </span>
                      )}
                      {rule.channels.includes('email') && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.slate }}>
                          <Mail size={13} /> Email
                        </span>
                      )}
                    </div>
                    {rule.lastTriggered && (
                      <span style={{ fontSize: 11, color: COLORS.stone }}>
                        Last triggered: {fmtDate(rule.lastTriggered)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <ToggleSwitch checked={rule.active} onChange={() => handleToggleActive(rule)} />
                  <button onClick={() => { setEditRule(rule); setShowModal(true) }} title="Edit" style={iconBtnStyle}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(rule)} title="Delete" style={{ ...iconBtnStyle, color: COLORS.crimson }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <RuleModal
          programs={programs}
          initial={editRule}
          onClose={() => { setShowModal(false); setEditRule(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
