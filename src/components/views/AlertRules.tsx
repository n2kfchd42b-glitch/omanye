'use client'

import React, { useState } from 'react'
import {
  Plus, X, Bell, Mail, Pencil, Trash2,
  AlertTriangle, AlertCircle, Info, Zap, MessageSquare,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField } from '@/components/atoms/FormField'
import { useToast } from '@/components/Toast'
import { useAuditLog } from '@/lib/useAuditLog'
import { nextId } from '@/lib/utils'
import type { AlertRule, Program, User, TriggerType, Severity } from '@/lib/types'

// ── Severity ──────────────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string }> = {
  low:      { bg: COLORS.foam,   text: COLORS.stone   },
  medium:   { bg: '#FEF3C7',     text: '#92400E'      },
  high:     { bg: '#E6F5EC',     text: COLORS.fern    },
  critical: { bg: '#FEE2E2',     text: COLORS.crimson },
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  indicator_below:     'Indicator falls below threshold',
  indicator_above:     'Indicator exceeds threshold',
  budget_burn:         'Budget burn rate exceeds %',
  report_due:          'Report deadline approaching',
  submission_overdue:  'Submission is overdue',
}

function ruleDescription(r: AlertRule): string {
  switch (r.triggerType) {
    case 'indicator_below':
      return `Alert when ${r.indicatorName ?? 'indicator'} falls below ${r.threshold} ${r.unit ?? ''} in ${r.programName ?? 'any program'}`
    case 'indicator_above':
      return `Alert when ${r.indicatorName ?? 'indicator'} exceeds ${r.threshold} ${r.unit ?? ''} in ${r.programName ?? 'any program'}`
    case 'budget_burn':
      return `Alert when budget burn rate exceeds ${r.threshold}% in ${r.programName ?? 'any program'}`
    case 'report_due':
      return `Alert ${r.threshold} days before report deadline in ${r.programName ?? 'any program'}`
    case 'submission_overdue':
      return `Alert when submission is ${r.threshold}+ days overdue in ${r.programName ?? 'any program'}`
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlertRulesProps {
  alertRules:    AlertRule[]
  setAlertRules: React.Dispatch<React.SetStateAction<AlertRule[]>>
  programs:      Program[]
  user:          User
}

// ── AlertRules view ───────────────────────────────────────────────────────────

export function AlertRules({ alertRules, setAlertRules, programs, user }: AlertRulesProps) {
  const { success, error } = useToast()
  const { append } = useAuditLog()
  const [showModal, setShowModal] = useState(false)
  const [editRule, setEditRule] = useState<AlertRule | null>(null)

  function handleSave(rule: AlertRule) {
    if (editRule) {
      setAlertRules(rs => rs.map(r => r.id === rule.id ? rule : r))
      success(`Rule "${rule.name}" updated`)
      append({ actor: user.name, action: 'UPDATE', resource: 'Alert', resourceName: rule.name, details: `Updated alert rule` })
    } else {
      setAlertRules(rs => [...rs, rule])
      success(`Alert rule "${rule.name}" created`)
      append({ actor: user.name, action: 'CREATE', resource: 'Alert', resourceName: rule.name, details: `Created alert rule: ${rule.name}` })
    }
    setShowModal(false)
    setEditRule(null)
  }

  function handleDelete(id: number) {
    const rule = alertRules.find(r => r.id === id)
    setAlertRules(rs => rs.filter(r => r.id !== id))
    success(`Rule deleted`)
    if (rule) append({ actor: user.name, action: 'DELETE', resource: 'Alert', resourceName: rule.name, details: `Deleted alert rule` })
  }

  function toggleActive(id: number) {
    setAlertRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r))
  }

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest }}>Alert Rules</h3>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{alertRules.length} rule{alertRules.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => { setEditRule(null); setShowModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: COLORS.moss, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Add Rule
        </button>
      </div>

      {/* Rules list */}
      {alertRules.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="No alert rules yet"
            description="Create rules to get notified when indicators drop, budgets burn, or submissions are late."
            action={
              <button
                onClick={() => setShowModal(true)}
                style={{ padding: '8px 16px', borderRadius: 8, background: COLORS.moss, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Add First Rule
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alertRules.map(rule => {
            const sc = SEVERITY_COLORS[rule.severity]
            return (
              <div key={rule.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest }}>{rule.name}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: sc.bg, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {rule.severity}
                      </span>
                      {rule.programName && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10,
                          background: COLORS.foam, color: COLORS.fern,
                          border: `1px solid ${COLORS.mist}`,
                        }}>
                          {rule.programName}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 8 }}>{ruleDescription(rule)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {rule.channels.includes('inapp') && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
                          <Bell size={11} /> In-app
                        </span>
                      )}
                      {rule.channels.includes('email') && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
                          <Mail size={11} /> Email
                        </span>
                      )}
                      {rule.lastTriggered && (
                        <span style={{ fontSize: 11, color: COLORS.stone }}>
                          Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(rule.id)}
                      role="switch"
                      aria-checked={rule.active}
                      style={{
                        width: 36, height: 20, borderRadius: 10, padding: 2,
                        background: rule.active ? COLORS.sage : COLORS.mist,
                        display: 'flex', alignItems: 'center',
                        cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%', background: '#fff',
                        transform: rule.active ? 'translateX(16px)' : 'translateX(0)',
                        transition: 'transform 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                    <button
                      onClick={() => { setEditRule(rule); setShowModal(true) }}
                      style={{ padding: 6, borderRadius: 6, cursor: 'pointer', color: COLORS.stone }}
                      title="Edit rule"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      style={{ padding: 6, borderRadius: 6, cursor: 'pointer', color: COLORS.crimson }}
                      title="Delete rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AlertRuleModal
          programs={programs}
          editRule={editRule}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRule(null) }}
        />
      )}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface AlertRuleModalProps {
  programs:  Program[]
  editRule:  AlertRule | null
  onSave:    (rule: AlertRule) => void
  onClose:   () => void
}

const TRIGGER_OPTIONS: TriggerType[] = [
  'indicator_below', 'indicator_above', 'budget_burn', 'report_due', 'submission_overdue',
]

const SEVERITY_OPTIONS: Severity[] = ['low', 'medium', 'high', 'critical']

function AlertRuleModal({ programs, editRule, onSave, onClose }: AlertRuleModalProps) {
  const [name,        setName]        = useState(editRule?.name ?? '')
  const [triggerType, setTriggerType] = useState<TriggerType>(editRule?.triggerType ?? 'indicator_below')
  const [progId,      setProgId]      = useState<number | undefined>(editRule?.programId)
  const [indId,       setIndId]       = useState<number | undefined>(editRule?.indicatorId)
  const [threshold,   setThreshold]   = useState(editRule?.threshold ?? 0)
  const [unit,        setUnit]        = useState(editRule?.unit ?? '')
  const [severity,    setSeverity]    = useState<Severity>(editRule?.severity ?? 'medium')
  const [chInApp,     setChInApp]     = useState(editRule?.channels.includes('inapp') ?? true)
  const [chEmail,     setChEmail]     = useState(editRule?.channels.includes('email') ?? false)

  const selectedProg = programs.find(p => p.id === progId)
  const indicators   = selectedProg?.indicators ?? []

  function handleSave() {
    if (!name.trim()) return
    const channels: ('inapp' | 'email')[] = []
    if (chInApp) channels.push('inapp')
    if (chEmail) channels.push('email')

    const rule: AlertRule = {
      id:            editRule?.id ?? nextId(),
      name:          name.trim(),
      triggerType,
      programId:     progId,
      programName:   selectedProg?.name,
      indicatorId:   indId,
      indicatorName: indicators.find(i => i.id === indId)?.name,
      threshold,
      unit:          unit.trim() || undefined,
      channels,
      severity,
      active:        true,
      createdAt:     editRule?.createdAt ?? new Date().toISOString(),
    }
    onSave(rule)
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(10,26,16,0.5)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
    boxShadow: '0 24px 64px rgba(10,26,16,0.22)', maxHeight: '90vh', overflowY: 'auto',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.forest,
    outline: 'none',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={cardStyle}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest, marginBottom: 20 }}>
          {editRule ? 'Edit Alert Rule' : 'Add Alert Rule'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <FormField label="Rule name" required htmlFor="ar-name">
            <input id="ar-name" style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Beneficiaries below target" />
          </FormField>

          {/* Trigger type */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 8 }}>Trigger type <span style={{ color: COLORS.crimson }}>*</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TRIGGER_OPTIONS.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: COLORS.forest }}>
                  <input
                    type="radio" name="trigger" value={t}
                    checked={triggerType === t}
                    onChange={() => setTriggerType(t)}
                  />
                  {TRIGGER_LABELS[t]}
                </label>
              ))}
            </div>
          </div>

          {/* Program selector */}
          <FormField label="Program" htmlFor="ar-prog">
            <select
              id="ar-prog" style={selectStyle}
              value={progId ?? ''}
              onChange={e => { setProgId(e.target.value ? Number(e.target.value) : undefined); setIndId(undefined) }}
            >
              <option value="">All programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>

          {/* Indicator selector — for indicator triggers */}
          {(triggerType === 'indicator_below' || triggerType === 'indicator_above') && (
            <FormField label="Indicator" htmlFor="ar-ind">
              <select
                id="ar-ind" style={selectStyle}
                value={indId ?? ''}
                onChange={e => setIndId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Select indicator...</option>
                {indicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </FormField>
          )}

          {/* Threshold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <FormField label={triggerType === 'budget_burn' ? 'Burn rate %' : 'Threshold'} required htmlFor="ar-thr">
              <input
                id="ar-thr" type="number" min={0} style={inputStyle}
                value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                placeholder={triggerType === 'budget_burn' ? 'e.g. 80' : 'e.g. 500'}
              />
            </FormField>
            {(triggerType === 'indicator_below' || triggerType === 'indicator_above') && (
              <FormField label="Unit" htmlFor="ar-unit">
                <input id="ar-unit" style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. people" />
              </FormField>
            )}
          </div>

          {/* Severity */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 8 }}>Severity</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {SEVERITY_OPTIONS.map(s => {
                const sc = SEVERITY_COLORS[s]
                const active = severity === s
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? sc.bg : COLORS.foam,
                      color: active ? sc.text : COLORS.stone,
                      border: `1px solid ${active ? sc.bg : COLORS.mist}`,
                      textTransform: 'capitalize',
                    }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Channels */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 8 }}>Notification channels</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: COLORS.forest }}>
                <input type="checkbox" checked={chInApp} onChange={e => setChInApp(e.target.checked)} />
                <Bell size={13} /> In-app
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: COLORS.forest }}>
                <input type="checkbox" checked={chEmail} onChange={e => setChEmail(e.target.checked)} />
                <Mail size={13} /> Email
              </label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.stone, opacity: 0.5, cursor: 'not-allowed' }}>
                📱 SMS <span style={{ fontSize: 10 }}>Coming soon</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.mist}` }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: name.trim() ? COLORS.moss : COLORS.mist,
              color: name.trim() ? '#fff' : COLORS.stone,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {editRule ? 'Save Changes' : 'Add Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}
