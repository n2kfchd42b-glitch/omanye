'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Plus, X, Loader2, Eye, Flag, CheckCircle2,
  ArrowLeft, ClipboardList, Database, Trash2, Edit2, AlertCircle,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { OmanyeRole } from '@/lib/supabase/database.types'
import type {
  FieldCollectionForm, FieldSubmission, FormField, FormFieldType,
  CreateFormPayload, CreateSubmissionPayload,
} from '@/types/field'
import {
  SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS, FORM_FIELD_TYPE_LABELS,
} from '@/types/field'

// ── Tab navigation bar (shared across field/mae pages) ────────────────────────

const PROGRAM_TABS = [
  { id: 'overview',   label: 'Overview',   href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}` },
  { id: 'indicators', label: 'Indicators', href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=indicators` },
  { id: 'updates',    label: 'Updates',    href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=updates` },
  { id: 'budget',     label: 'Budget',     href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=budget` },
  { id: 'reports',    label: 'Reports',    href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}?tab=reports` },
  { id: 'field',      label: 'Field Data', href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}/field` },
  { id: 'mae',        label: 'M&E',        href: (slug: string, pid: string) => `/org/${slug}/programs/${pid}/mae` },
]

function ProgramTabBar({ slug, programId, active }: { slug: string; programId: string; active: string }) {
  const router = useRouter()
  return (
    <div style={{
      display: 'flex', gap: 2, borderBottom: `1px solid ${COLORS.mist}`,
      padding: '0 24px', background: '#1A2B4A', overflowX: 'auto',
    }}>
      {PROGRAM_TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href(slug, programId))}
          style={{
            padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap',
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? COLORS.forest : COLORS.stone,
            borderBottom: active === tab.id ? `2px solid ${COLORS.forest}` : '2px solid transparent',
            background: 'none', cursor: 'pointer', marginBottom: -1,
            transition: 'color 0.15s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`
}

// ── Form Builder ──────────────────────────────────────────────────────────────

function FormBuilderModal({
  programId, onClose, onSaved,
}: {
  programId: string
  onClose: () => void
  onSaved: (form: FieldCollectionForm) => void
}) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [fields,      setFields]      = useState<FormField[]>([])
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  function addField() {
    const key = `field_${fields.length + 1}`
    setFields(prev => [...prev, { key, label: '', type: 'text', required: false }])
  }

  function updateField(i: number, patch: Partial<FormField>) {
    setFields(prev => prev.map((f, idx) => {
      if (idx !== i) return f
      const updated = { ...f, ...patch }
      if (patch.label !== undefined) updated.key = genKey(patch.label)
      return updated
    }))
  }

  function removeField(i: number) {
    setFields(prev => prev.filter((_, idx) => idx !== i))
  }

  function addOption(fieldIdx: number) {
    setFields(prev => prev.map((f, idx) => {
      if (idx !== fieldIdx) return f
      return { ...f, options: [...(f.options ?? []), ''] }
    }))
  }

  function updateOption(fieldIdx: number, optIdx: number, val: string) {
    setFields(prev => prev.map((f, idx) => {
      if (idx !== fieldIdx) return f
      const opts = [...(f.options ?? [])]
      opts[optIdx] = val
      return { ...f, options: opts }
    }))
  }

  function removeOption(fieldIdx: number, optIdx: number) {
    setFields(prev => prev.map((f, idx) => {
      if (idx !== fieldIdx) return f
      return { ...f, options: (f.options ?? []).filter((_, i) => i !== optIdx) }
    }))
  }

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      const payload: CreateFormPayload = { program_id: programId, name: name.trim(), description, fields }
      const res = await fetch('/api/field/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const json = await res.json()
      onSaved(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const typeOptions: { value: FormFieldType; label: string }[] = [
    { value: 'text',    label: 'Text' },
    { value: 'number',  label: 'Number' },
    { value: 'select',  label: 'Select' },
    { value: 'date',    label: 'Date' },
    { value: 'boolean', label: 'Yes/No' },
  ]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 680, background: '#1A2B4A',
          borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${COLORS.mist}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest }}>New Collection Form</h2>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>Define what field staff will collect</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', cursor: 'pointer', color: COLORS.stone }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Form Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Household Survey, Health Check"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.charcoal, boxSizing: 'border-box' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description for field staff"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.charcoal, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Fields */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate }}>Form Fields</label>
              <button
                onClick={addField}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: COLORS.foam, color: COLORS.forest, cursor: 'pointer', border: 'none',
                }}
              >
                <Plus size={13} /> Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <p style={{ fontSize: 12, color: COLORS.stone, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                No fields yet. Add fields above.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.map((field, i) => (
                <div
                  key={i}
                  style={{
                    background: COLORS.snow, borderRadius: 10, padding: '12px 14px',
                    border: `1px solid ${COLORS.mist}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Label */}
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.stone, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Label</label>
                      <input
                        value={field.label}
                        onChange={e => updateField(i, { label: e.target.value })}
                        placeholder="Field label"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.mist}`, fontSize: 12, boxSizing: 'border-box' }}
                      />
                    </div>
                    {/* Type */}
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.stone, display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>Type</label>
                      <select
                        value={field.type}
                        onChange={e => updateField(i, { type: e.target.value as FormFieldType, options: undefined })}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${COLORS.mist}`, fontSize: 12, background: '#1A2B4A' }}
                      >
                        {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    {/* Required toggle */}
                    <div style={{ paddingTop: 20 }}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, color: COLORS.slate, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}>
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={e => updateField(i, { required: e.target.checked })}
                          style={{ accentColor: COLORS.forest }}
                        />
                        Required
                      </label>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeField(i)}
                      style={{ background: 'none', cursor: 'pointer', color: COLORS.stone, padding: '4px', marginTop: 16 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Select options */}
                  {field.type === 'select' && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: COLORS.stone, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Options</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {(field.options ?? []).map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: 6 }}>
                            <input
                              value={opt}
                              onChange={e => updateOption(i, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${COLORS.mist}`, fontSize: 12 }}
                            />
                            <button onClick={() => removeOption(i, oi)} style={{ background: 'none', cursor: 'pointer', color: COLORS.stone }}>
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(i)}
                          style={{ alignSelf: 'flex-start', fontSize: 11, color: COLORS.forest, background: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        >
                          + Add option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: '#FEE2E2', borderRadius: 8 }}>
              <AlertCircle size={14} style={{ color: COLORS.crimson, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: COLORS.crimson }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${COLORS.mist}`,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, background: COLORS.foam, color: COLORS.slate, cursor: 'pointer', border: 'none' }}>
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: COLORS.forest, color: '#fff', cursor: saving ? 'wait' : 'pointer',
              border: 'none', opacity: (saving || !name.trim()) ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            Save Form
          </button>
        </div>
      </div>
    </div>
  )
}

// ── View / Submit Modal ───────────────────────────────────────────────────────

function SubmitDataModal({
  programId, forms, onClose, onSubmitted,
}: {
  programId: string
  forms: FieldCollectionForm[]
  onClose: () => void
  onSubmitted: (sub: FieldSubmission) => void
}) {
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? '')
  const [locationName,   setLocationName]   = useState('')
  const [notes,          setNotes]          = useState('')
  const [fieldData,      setFieldData]      = useState<Record<string, unknown>>({})
  const [date,           setDate]           = useState(new Date().toISOString().slice(0, 10))
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  const form = forms.find(f => f.id === selectedFormId)

  async function submit() {
    setSaving(true); setError('')
    try {
      const payload: CreateSubmissionPayload = {
        program_id:      programId,
        form_id:         selectedFormId || undefined,
        submission_date: date,
        location_name:   locationName,
        data:            fieldData,
        notes,
        status:          'SUBMITTED',
      }
      const res = await fetch('/api/field/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const json = await res.json()
      onSubmitted(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSaving(false)
    }
  }

  function renderFormField(field: FormField) {
    const value = fieldData[field.key]
    const set = (v: unknown) => setFieldData(prev => ({ ...prev, [field.key]: v }))

    const inputStyle = {
      width: '100%', padding: '8px 12px', borderRadius: 8,
      border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.charcoal,
      boxSizing: 'border-box' as const,
    }

    switch (field.type) {
      case 'text':
        return <input value={(value as string) ?? ''} onChange={e => set(e.target.value)} style={inputStyle} placeholder={field.label} />
      case 'number':
        return <input type="number" value={(value as string) ?? ''} onChange={e => set(e.target.value)} style={inputStyle} placeholder="0" />
      case 'date':
        return <input type="date" value={(value as string) ?? ''} onChange={e => set(e.target.value)} style={inputStyle} />
      case 'boolean':
        return (
          <div style={{ display: 'flex', gap: 16 }}>
            {['Yes', 'No'].map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                <input type="radio" name={field.key} checked={value === opt} onChange={() => set(opt)} style={{ accentColor: COLORS.forest }} />
                {opt}
              </label>
            ))}
          </div>
        )
      case 'select':
        return (
          <select
            value={(value as string) ?? ''}
            onChange={e => set(e.target.value)}
            style={{ ...inputStyle, background: '#1A2B4A' }}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 560, background: '#1A2B4A', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${COLORS.mist}`, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest }}>Submit Field Data</h2>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>Record data from the field</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', cursor: 'pointer', color: COLORS.stone }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Form selector */}
          {forms.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Form</label>
              <select
                value={selectedFormId}
                onChange={e => { setSelectedFormId(e.target.value); setFieldData({}) }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, background: '#1A2B4A' }}
              >
                <option value="">No form / free-form</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Submission Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          {/* Location */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Location Name</label>
            <input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="Village, district, or site name"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          {/* Dynamic form fields */}
          {form && form.fields.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 10 }}>Form Fields — {form.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {form.fields.map((field, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, display: 'block', marginBottom: 5 }}>
                      {field.label}{field.required && <span style={{ color: COLORS.crimson }}> *</span>}
                      <span style={{ fontSize: 10, color: COLORS.stone, fontWeight: 400, marginLeft: 6 }}>({FORM_FIELD_TYPE_LABELS[field.type]})</span>
                    </label>
                    {renderFormField(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional observations…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: '#FEE2E2', borderRadius: 8 }}>
              <AlertCircle size={14} style={{ color: COLORS.crimson, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: COLORS.crimson }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.mist}`, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, background: COLORS.foam, color: COLORS.slate, cursor: 'pointer', border: 'none' }}>Cancel</button>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: COLORS.gold, color: COLORS.forest, cursor: saving ? 'wait' : 'pointer', border: 'none',
              opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

// ── View Submission Modal ─────────────────────────────────────────────────────

function ViewSubmissionModal({
  submission, isAdmin, onClose, onReview, onFlag,
}: {
  submission: FieldSubmission & { form_fields?: FormField[] }
  isAdmin: boolean
  onClose: () => void
  onReview: (id: string) => void
  onFlag: (id: string) => void
}) {
  const statusStyle = SUBMISSION_STATUS_COLORS[submission.status]
  const [acting, setActing] = useState(false)

  async function doAction(action: 'review' | 'flag') {
    setActing(true)
    try {
      const res = await fetch(`/api/field/submissions/${submission.id}/${action}`, { method: 'PATCH' })
      if (res.ok) {
        action === 'review' ? onReview(submission.id) : onFlag(submission.id)
        onClose()
      }
    } finally {
      setActing(false)
    }
  }

  const dataEntries = Object.entries(submission.data ?? {})

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div style={{ width: '100%', maxWidth: 560, background: '#1A2B4A', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${COLORS.mist}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest }}>Submission</h2>
              <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: statusStyle.bg, color: statusStyle.text }}>
                {SUBMISSION_STATUS_LABELS[submission.status]}
              </span>
            </div>
            <p style={{ fontSize: 12, color: COLORS.stone }}>
              {formatDate(submission.submission_date)} · {submission.submitter_name ?? 'Unknown'}
              {submission.location_name && ` · ${submission.location_name}`}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', cursor: 'pointer', color: COLORS.stone }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Form name */}
          {submission.form_name && (
            <div style={{ padding: '8px 12px', background: COLORS.foam, borderRadius: 8, fontSize: 12, color: COLORS.forest, fontWeight: 600 }}>
              Form: {submission.form_name}
            </div>
          )}

          {/* Field data */}
          {dataEntries.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Field Data</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dataEntries.map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                    <span style={{ minWidth: 140, color: COLORS.stone, fontWeight: 500, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                    <span style={{ color: COLORS.charcoal }}>{String(value ?? '—')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {submission.notes && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notes</p>
              <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{submission.notes}</p>
            </div>
          )}

          {/* Attachments */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Attachments</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {submission.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: COLORS.sky, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    📎 {att.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reviewed by */}
          {submission.reviewed_by && submission.reviewer_name && (
            <p style={{ fontSize: 11, color: COLORS.stone, fontStyle: 'italic' }}>
              Reviewed by {submission.reviewer_name} on {formatDate(submission.reviewed_at ?? '')}
            </p>
          )}
        </div>

        {isAdmin && submission.status !== 'REVIEWED' && (
          <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.mist}`, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {submission.status !== 'FLAGGED' && (
              <button
                onClick={() => doAction('flag')}
                disabled={acting}
                style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#FEE2E2', color: COLORS.crimson, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Flag size={12} /> Flag
              </button>
            )}
            <button
              onClick={() => doAction('review')}
              disabled={acting}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: COLORS.forest, color: '#fff', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {acting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={12} />}
              Mark Reviewed
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FieldDataPage() {
  const params = useParams<{ slug: string; programId: string }>()
  const router = useRouter()

  const [userRole,       setUserRole]       = useState<OmanyeRole | null>(null)
  const [programName,    setProgramName]    = useState('')
  const [forms,          setForms]          = useState<FieldCollectionForm[]>([])
  const [submissions,    setSubmissions]    = useState<FieldSubmission[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showFormModal,  setShowFormModal]  = useState(false)
  const [showSubmitModal,setShowSubmitModal]= useState(false)
  const [viewSubmission, setViewSubmission] = useState<FieldSubmission | null>(null)
  const [statusFilter,   setStatusFilter]   = useState<string>('all')
  const [searchTerm,     setSearchTerm]     = useState('')

  const isAdmin = userRole === 'NGO_ADMIN'
  const canSubmit = userRole === 'NGO_ADMIN' || userRole === 'NGO_STAFF'

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: profileRaw } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const profile = profileRaw as { role: string } | null
    setUserRole((profile?.role ?? null) as OmanyeRole)

    const { data: prog } = await supabase.from('programs').select('name').eq('id', params.programId).single()
    setProgramName((prog as { name: string } | null)?.name ?? '')

    const [formsRes, subRes] = await Promise.all([
      fetch(`/api/field/forms?program_id=${params.programId}`),
      fetch(`/api/field/submissions?program_id=${params.programId}`),
    ])

    if (formsRes.ok) {
      const j = await formsRes.json()
      setForms(j.data ?? [])
    }
    if (subRes.ok) {
      const j = await subRes.json()
      setSubmissions(j.data ?? [])
    }
    setLoading(false)
  }, [params.programId, params.slug, router])

  useEffect(() => { load() }, [load])

  async function deactivateForm(id: string) {
    if (!confirm('Deactivate this form? It will no longer appear to field staff.')) return
    const res = await fetch(`/api/field/forms/${id}`, { method: 'DELETE' })
    if (res.ok) setForms(prev => prev.map(f => f.id === id ? { ...f, active: false } : f))
  }

  const filteredSubs = submissions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        s.location_name?.toLowerCase().includes(q) ||
        s.submitter_name?.toLowerCase().includes(q) ||
        s.form_name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Topbar */}
      <div style={{ background: COLORS.forest, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push(`/org/${params.slug}/programs/${params.programId}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', background: 'none', cursor: 'pointer', fontSize: 13, border: 'none' }}
        >
          <ArrowLeft size={14} /> {programName || 'Program'}
        </button>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
        <span style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: '#fff' }}>Field Data</span>
        {canSubmit && (
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: COLORS.gold, color: COLORS.forest, cursor: 'pointer', border: 'none',
            }}
          >
            <Plus size={13} /> Submit Data
          </button>
        )}
      </div>

      {/* Tab bar */}
      <ProgramTabBar slug={params.slug} programId={params.programId} active="field" />

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Collection Forms ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                Collection Forms
              </h2>
              <p style={{ fontSize: 12, color: COLORS.stone }}>
                {forms.filter(f => f.active).length} active form{forms.filter(f => f.active).length !== 1 ? 's' : ''}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowFormModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: COLORS.forest, color: '#fff', cursor: 'pointer', border: 'none',
                }}
              >
                <Plus size={13} /> New Form
              </button>
            )}
          </div>

          {forms.length === 0 ? (
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <ClipboardList size={28} style={{ color: COLORS.stone, marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, marginBottom: 4 }}>No forms yet</p>
              <p style={{ fontSize: 12, color: COLORS.stone }}>
                {isAdmin ? 'Create a form to define what field staff collect.' : 'No collection forms have been created.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {forms.map(form => (
                <div
                  key={form.id}
                  className="card"
                  style={{ padding: '16px 18px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {form.name}
                      </p>
                      <p style={{ fontSize: 11, color: COLORS.stone }}>
                        {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 8,
                      background: form.active ? '#38A16920' : '#F1F5F9',
                      color: form.active ? '#38A169' : '#64748B',
                    }}>
                      {form.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {form.description && (
                    <p style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.5, marginBottom: 10 }}>
                      {form.description}
                    </p>
                  )}
                  {isAdmin && form.active && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        onClick={() => deactivateForm(form.id)}
                        style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#FEE2E2', color: COLORS.crimson, cursor: 'pointer', border: 'none' }}
                      >
                        Deactivate
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Submissions ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
                Submissions
              </h2>
              <p style={{ fontSize: 12, color: COLORS.stone }}>
                {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['all', 'SUBMITTED', 'REVIEWED', 'FLAGGED', 'DRAFT'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 12, fontWeight: statusFilter === status ? 600 : 400,
                  background: statusFilter === status ? COLORS.forest : COLORS.foam,
                  color: statusFilter === status ? '#fff' : COLORS.slate,
                  cursor: 'pointer', border: 'none',
                }}
              >
                {status === 'all' ? 'All' : SUBMISSION_STATUS_LABELS[status]}
                {' '}
                <span style={{ opacity: 0.7 }}>
                  {status === 'all' ? submissions.length : submissions.filter(s => s.status === status).length}
                </span>
              </button>
            ))}
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search location, submitter…"
              style={{
                marginLeft: 'auto', padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.charcoal,
                width: 200,
              }}
            />
          </div>

          {filteredSubs.length === 0 ? (
            <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
              <Database size={28} style={{ color: COLORS.stone, marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, marginBottom: 4 }}>No submissions</p>
              <p style={{ fontSize: 12, color: COLORS.stone }}>
                {searchTerm || statusFilter !== 'all' ? 'No submissions match your filter.' : 'Field data submissions will appear here.'}
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.mist}`, background: COLORS.snow }}>
                    {['Date', 'Location', 'Submitted By', 'Form', 'Status', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                        color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub, i) => {
                    const statusStyle = SUBMISSION_STATUS_COLORS[sub.status]
                    return (
                      <tr
                        key={sub.id}
                        style={{ borderBottom: `1px solid ${COLORS.foam}`, background: i % 2 === 0 ? '#1A2B4A' : COLORS.snow }}
                      >
                        <td style={{ padding: '10px 14px', fontSize: 13, color: COLORS.charcoal }}>{formatDate(sub.submission_date)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: COLORS.charcoal }}>{sub.location_name || '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: COLORS.slate }}>{sub.submitter_name ?? '—'}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: COLORS.stone }}>{sub.form_name ?? '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: statusStyle.bg, color: statusStyle.text }}>
                            {SUBMISSION_STATUS_LABELS[sub.status]}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => setViewSubmission(sub)}
                              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: COLORS.foam, color: COLORS.slate, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={11} /> View
                            </button>
                            {isAdmin && sub.status !== 'REVIEWED' && (
                              <>
                                <button
                                  onClick={async () => {
                                    const res = await fetch(`/api/field/submissions/${sub.id}/review`, { method: 'PATCH' })
                                    if (res.ok) setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'REVIEWED' } : s))
                                  }}
                                  style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#38A16920', color: '#38A169', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <CheckCircle2 size={11} /> Review
                                </button>
                                {sub.status !== 'FLAGGED' && (
                                  <button
                                    onClick={async () => {
                                      const res = await fetch(`/api/field/submissions/${sub.id}/flag`, { method: 'PATCH' })
                                      if (res.ok) setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'FLAGGED' } : s))
                                    }}
                                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#FEE2E2', color: COLORS.crimson, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                  >
                                    <Flag size={11} /> Flag
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {showFormModal && (
        <FormBuilderModal
          programId={params.programId}
          onClose={() => setShowFormModal(false)}
          onSaved={form => { setForms(prev => [form, ...prev]); setShowFormModal(false) }}
        />
      )}

      {showSubmitModal && (
        <SubmitDataModal
          programId={params.programId}
          forms={forms.filter(f => f.active)}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={sub => { setSubmissions(prev => [sub, ...prev]); setShowSubmitModal(false) }}
        />
      )}

      {viewSubmission && (
        <ViewSubmissionModal
          submission={viewSubmission}
          isAdmin={isAdmin}
          onClose={() => setViewSubmission(null)}
          onReview={id => setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'REVIEWED' } : s))}
          onFlag={id => setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'FLAGGED' } : s))}
        />
      )}
    </div>
  )
}
