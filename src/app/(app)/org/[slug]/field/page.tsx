'use client'

// Mobile-friendly field staff submission view
// Optimized for tablet / phone use in the field

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, ChevronRight, ChevronLeft, Send, ArrowLeft, ClipboardList, History } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { FieldCollectionForm, FieldSubmission, FormField, CreateSubmissionPayload } from '@/types/field'
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS, FORM_FIELD_TYPE_LABELS } from '@/types/field'

// ── Wizard step renderer ──────────────────────────────────────────────────────

function WizardField({
  field, value, onChange,
}: {
  field: FormField
  value: unknown
  onChange: (v: unknown) => void
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: `2px solid ${COLORS.mist}`,
    fontSize: 16,
    color: COLORS.charcoal,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  switch (field.type) {
    case 'text':
      return (
        <input
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${field.label.toLowerCase()}…`}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = COLORS.forest)}
          onBlur={e => (e.currentTarget.style.borderColor = COLORS.mist)}
        />
      )
    case 'number':
      return (
        <input
          type="number"
          inputMode="numeric"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = COLORS.forest)}
          onBlur={e => (e.currentTarget.style.borderColor = COLORS.mist)}
        />
      )
    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = COLORS.forest)}
          onBlur={e => (e.currentTarget.style.borderColor = COLORS.mist)}
        />
      )
    case 'boolean':
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 12, fontSize: 16, fontWeight: 600,
                background: value === opt ? COLORS.forest : COLORS.foam,
                color: value === opt ? '#fff' : COLORS.slate,
                border: `2px solid ${value === opt ? COLORS.forest : COLORS.mist}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )
    case 'select':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(field.options ?? []).map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                padding: '14px 16px', borderRadius: 12, fontSize: 15, fontWeight: 500,
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                background: value === opt ? COLORS.foam : '#fff',
                border: `2px solid ${value === opt ? COLORS.forest : COLORS.mist}`,
                color: value === opt ? COLORS.forest : COLORS.charcoal,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              {opt}
              {value === opt && <span style={{ color: COLORS.forest }}>✓</span>}
            </button>
          ))}
        </div>
      )
    default:
      return null
  }
}

// ── Form Wizard ───────────────────────────────────────────────────────────────

function FormWizard({
  form, programId, onClose, onSubmitted,
}: {
  form: FieldCollectionForm
  programId: string
  onClose: () => void
  onSubmitted: (sub: FieldSubmission) => void
}) {
  const allSteps = ['meta', ...form.fields.map((_, i) => `field_${i}`), 'review']
  const [stepIndex, setStepIndex] = useState(0)
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [fieldData, setFieldData] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentStep = allSteps[stepIndex]
  const isLastStep  = stepIndex === allSteps.length - 1
  const isFirstStep = stepIndex === 0

  const currentField = currentStep?.startsWith('field_')
    ? form.fields[parseInt(currentStep.split('_')[1])]
    : null

  function canAdvance() {
    if (currentStep === 'meta') return !!locationName.trim()
    if (currentField && currentField.required) return !!fieldData[currentField.key]
    return true
  }

  async function submit() {
    setSubmitting(true); setError('')
    try {
      const payload: CreateSubmissionPayload = {
        program_id:      programId,
        form_id:         form.id,
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
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = Math.round((stepIndex / (allSteps.length - 1)) * 100)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: COLORS.snow, display: 'flex', flexDirection: 'column',
    }}>
      {/* Progress header */}
      <div style={{ background: COLORS.forest, padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={isFirstStep ? onClose : () => setStepIndex(p => p - 1)}
            style={{ background: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <ChevronLeft size={16} /> Back
          </button>
          <span style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: '#fff', flex: 1, textAlign: 'center' }}>
            {form.name}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {stepIndex + 1}/{allSteps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: COLORS.gold, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px' }}>

        {/* ── Meta step ── */}
        {currentStep === 'meta' && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
              Where are you?
            </h2>
            <p style={{ fontSize: 14, color: COLORS.stone, marginBottom: 24 }}>Enter the location for this submission</p>

            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 8 }}>
              Location Name *
            </label>
            <input
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="Village, district, site name…"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${COLORS.mist}`, fontSize: 16, color: COLORS.charcoal,
                boxSizing: 'border-box', marginBottom: 20,
              }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 8 }}>
              Submission Date
            </label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${COLORS.mist}`, fontSize: 16, color: COLORS.charcoal,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* ── Field step ── */}
        {currentField && (
          <div>
            <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              {FORM_FIELD_TYPE_LABELS[currentField.type]}
            </p>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 6 }}>
              {currentField.label}
              {currentField.required && <span style={{ color: COLORS.crimson, marginLeft: 4 }}>*</span>}
            </h2>
            <p style={{ fontSize: 14, color: COLORS.stone, marginBottom: 24 }}>
              {currentField.required ? 'Required' : 'Optional — tap Next to skip'}
            </p>
            <WizardField
              field={currentField}
              value={fieldData[currentField.key]}
              onChange={v => setFieldData(prev => ({ ...prev, [currentField.key]: v }))}
            />
          </div>
        )}

        {/* ── Review step ── */}
        {currentStep === 'review' && (
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 6 }}>
              Review & Submit
            </h2>
            <p style={{ fontSize: 14, color: COLORS.stone, marginBottom: 20 }}>Check your entries before submitting</p>

            <div style={{ background: '#1A2B4A', borderRadius: 12, padding: '16px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${COLORS.mist}` }}>
                <span style={{ fontSize: 13, color: COLORS.stone, minWidth: 120 }}>Location</span>
                <span style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>{locationName}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${COLORS.mist}` }}>
                <span style={{ fontSize: 13, color: COLORS.stone, minWidth: 120 }}>Date</span>
                <span style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>{formatDate(date)}</span>
              </div>
              {form.fields.map(field => {
                const val = fieldData[field.key]
                if (!val && val !== 0) return null
                return (
                  <div key={field.key} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: COLORS.stone, minWidth: 120 }}>{field.label}</span>
                    <span style={{ fontSize: 13, color: COLORS.charcoal }}>{String(val)}</span>
                  </div>
                )
              })}
            </div>

            {/* Notes */}
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 8 }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional observations…"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `2px solid ${COLORS.mist}`, fontSize: 14, color: COLORS.charcoal,
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* Offline note */}
            <div style={{ marginTop: 16, padding: '10px 14px', background: COLORS.foam, borderRadius: 10, fontSize: 12, color: COLORS.slate }}>
              💡 <strong>Tip:</strong> Save as draft if you have no connection. Offline support coming soon.
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, fontSize: 12, color: COLORS.crimson }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div style={{ padding: '16px 20px', background: '#1A2B4A', borderTop: `1px solid ${COLORS.mist}` }}>
        {isLastStep ? (
          <button
            onClick={submit}
            disabled={submitting}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 700,
              background: COLORS.gold, color: COLORS.forest, cursor: submitting ? 'wait' : 'pointer',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        ) : (
          <button
            onClick={() => setStepIndex(p => p + 1)}
            disabled={!canAdvance()}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 700,
              background: canAdvance() ? COLORS.forest : COLORS.mist,
              color: canAdvance() ? '#fff' : COLORS.stone,
              cursor: canAdvance() ? 'pointer' : 'not-allowed', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FieldStaffPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()

  const [activeTab, setActiveTab]     = useState<'forms' | 'history'>('forms')
  const [programs,   setPrograms]     = useState<{ id: string; name: string }[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [forms,      setForms]        = useState<FieldCollectionForm[]>([])
  const [mySubmissions, setMySubmissions] = useState<FieldSubmission[]>([])
  const [loading,    setLoading]      = useState(true)
  const [wizard,     setWizard]       = useState<FieldCollectionForm | null>(null)
  const [userId,     setUserId]       = useState('')

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data: profileRaw } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      const profile = profileRaw as { organization_id: string } | null

      // Org programs
      const { data: progs } = await supabase
        .from('programs')
        .select('id, name')
        .eq('organization_id', profile?.organization_id ?? '')
        .is('deleted_at', null)
        .order('name')

      const progList = (progs ?? []) as { id: string; name: string }[]
      setPrograms(progList)

      const firstProg = progList[0]?.id ?? ''
      setSelectedProgramId(firstProg)

      if (firstProg) {
        await loadFormsAndSubs(firstProg, user.id)
      }
    } catch (err) {
      console.error('Field data load error:', err)
    } finally {
      setLoading(false)
    }
  }, [params.slug, router])

  async function loadFormsAndSubs(programId: string, uid: string) {
    const [formsRes, subRes] = await Promise.all([
      fetch(`/api/field/forms?program_id=${programId}`),
      fetch(`/api/field/submissions?program_id=${programId}`),
    ])
    if (formsRes.ok) {
      const j = await formsRes.json()
      setForms((j.data ?? []).filter((f: FieldCollectionForm) => f.active))
    }
    if (subRes.ok) {
      const j = await subRes.json()
      setMySubmissions((j.data ?? []).filter((s: FieldSubmission) => s.submitted_by === uid))
    }
  }

  useEffect(() => { load() }, [load])

  async function handleProgramChange(id: string) {
    setSelectedProgramId(id)
    setForms([])
    setMySubmissions([])
    if (id) await loadFormsAndSubs(id, userId)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={28} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 0', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.forest, flex: 1 }}>
            Field Data
          </h1>
        </div>

        {/* Program selector */}
        {programs.length > 1 && (
          <select
            value={selectedProgramId}
            onChange={e => handleProgramChange(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)', fontSize: 14,
            }}
          >
            {programs.map(p => <option key={p.id} value={p.id} style={{ color: COLORS.forest, background: '#1A2B4A' }}>{p.name}</option>)}
          </select>
        )}
        {programs.length === 1 && (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{programs[0].name}</p>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: '#1A2B4A', borderBottom: `1px solid ${COLORS.mist}` }}>
        {([
          { id: 'forms',   label: 'Collection Forms', icon: <ClipboardList size={15} /> },
          { id: 'history', label: 'My Submissions',   icon: <History size={15} /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '12px 0', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? COLORS.forest : COLORS.stone,
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.forest}` : '2px solid transparent',
              background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px' }}>

        {/* ── Forms tab ── */}
        {activeTab === 'forms' && (
          <div>
            {forms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <ClipboardList size={36} style={{ color: COLORS.stone, marginBottom: 12, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 6 }}>No forms available</p>
                <p style={{ fontSize: 13, color: COLORS.stone }}>Contact your programme administrator.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {forms.map(form => (
                  <button
                    key={form.id}
                    onClick={() => setWizard(form)}
                    style={{
                      background: '#1A2B4A',
                      borderRadius: 16, padding: '18px 20px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      border: `1px solid ${COLORS.mist}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: COLORS.foam, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ClipboardList size={22} style={{ color: COLORS.forest }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 3 }}>{form.name}</p>
                      {form.description && (
                        <p style={{ fontSize: 13, color: COLORS.slate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {form.description}
                        </p>
                      )}
                      <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 3 }}>{form.fields.length} fields</p>
                    </div>
                    <ChevronRight size={18} style={{ color: COLORS.stone, flexShrink: 0 }} />
                  </button>
                ))}

                {/* Offline note */}
                <div style={{
                  padding: '12px 16px', background: COLORS.foam, borderRadius: 12,
                  fontSize: 12, color: COLORS.slate, marginTop: 4,
                }}>
                  💡 <strong>Save draft if no connection.</strong> Full offline support is coming soon.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div>
            {mySubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <History size={36} style={{ color: COLORS.stone, marginBottom: 12, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 6 }}>No submissions yet</p>
                <p style={{ fontSize: 13, color: COLORS.stone }}>Your field data submissions will appear here.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mySubmissions.map(sub => {
                  const statusStyle = SUBMISSION_STATUS_COLORS[sub.status]
                  return (
                    <div key={sub.id} style={{
                      background: '#1A2B4A', borderRadius: 14, padding: '14px 16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: `1px solid ${COLORS.mist}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, marginBottom: 2 }}>
                            {sub.location_name || 'Unknown location'}
                          </p>
                          <p style={{ fontSize: 12, color: COLORS.stone }}>
                            {formatDate(sub.submission_date)}
                            {sub.form_name && ` · ${sub.form_name}`}
                          </p>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: statusStyle.bg, color: statusStyle.text,
                        }}>
                          {SUBMISSION_STATUS_LABELS[sub.status]}
                        </span>
                      </div>
                      {sub.notes && (
                        <p style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.5, marginTop: 6 }} >
                          {sub.notes.slice(0, 100)}{sub.notes.length > 100 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form wizard overlay */}
      {wizard && (
        <FormWizard
          form={wizard}
          programId={selectedProgramId}
          onClose={() => setWizard(null)}
          onSubmitted={sub => {
            setMySubmissions(prev => [{ ...sub, form_name: wizard.name } as FieldSubmission, ...prev])
            setWizard(null)
          }}
        />
      )}
    </div>
  )
}
