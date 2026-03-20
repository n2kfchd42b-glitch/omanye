'use client'

// Mobile-friendly field staff submission view
// Optimized for tablet / phone use in the field

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Plus, ChevronRight, ChevronLeft, Send, ArrowLeft, ClipboardList, History, MapPin, Camera, Wifi, WifiOff, RefreshCw, X } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { FieldCollectionForm, FieldSubmission, FormField, CreateSubmissionPayload, QueuedSubmission, OfflineAttachment } from '@/types/field'
import { SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_COLORS, FORM_FIELD_TYPE_LABELS } from '@/types/field'
import { enqueue, syncQueue, queueCount } from '@/lib/field/offline-queue'

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
  form, programId, isOnline, onClose, onSubmitted, onQueued,
}: {
  form:        FieldCollectionForm
  programId:   string
  isOnline:    boolean
  onClose:     () => void
  onSubmitted: (sub: FieldSubmission) => void
  onQueued:    () => void
}) {
  const allSteps = ['meta', ...form.fields.map((_, i) => `field_${i}`), 'review']
  const [stepIndex, setStepIndex] = useState(0)
  const [locationName, setLocationName] = useState('')
  const [locationLat,  setLocationLat]  = useState<number | null>(null)
  const [locationLng,  setLocationLng]  = useState<number | null>(null)
  const [gpsLoading,   setGpsLoading]   = useState(false)
  const [gpsError,     setGpsError]     = useState('')
  const [notes, setNotes]               = useState('')
  const [date,  setDate]                = useState(new Date().toISOString().slice(0, 10))
  const [fieldData, setFieldData]       = useState<Record<string, unknown>>({})
  const [photos,    setPhotos]          = useState<OfflineAttachment[]>([])
  const [submitting, setSubmitting]     = useState(false)
  const [queuing,    setQueuing]        = useState(false)
  const [error,      setError]          = useState('')
  const photoInputRef                   = useRef<HTMLInputElement>(null)

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

  // ── GPS ─────────────────────────────────────────────────────────────────────

  function captureGPS() {
    if (!('geolocation' in navigator)) {
      setGpsError('GPS not available on this device')
      return
    }
    setGpsLoading(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(pos.coords.latitude)
        setLocationLng(pos.coords.longitude)
        setGpsLoading(false)
      },
      (err) => {
        setGpsError(err.message)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    )
  }

  // ── Photo capture ────────────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (photos.length + files.length > 5) {
      setError('Maximum 5 photos allowed')
      return
    }
    setError('')

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotos((prev) => [
          ...prev,
          { name: file.name, dataUri: reader.result as string, type: file.type },
        ])
      }
      reader.readAsDataURL(file)
    })

    // Reset input so the same file can be re-selected
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Submit (online) ──────────────────────────────────────────────────────────

  async function submit() {
    setSubmitting(true); setError('')
    try {
      const payload: CreateSubmissionPayload = {
        program_id:      programId,
        form_id:         form.id,
        submission_date: date,
        location_name:   locationName,
        location_lat:    locationLat,
        location_lng:    locationLng,
        data:            fieldData,
        notes,
        status:          'SUBMITTED',
        sync_source:     'direct',
        attachments:     photos.map((p) => ({ name: p.name, url: p.dataUri, type: p.type })),
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

  // ── Queue for offline sync ───────────────────────────────────────────────────

  async function queueOffline() {
    setQueuing(true); setError('')
    try {
      const queued: QueuedSubmission = {
        id:             crypto.randomUUID(),
        programId,
        formId:         form.id,
        submissionDate: date,
        locationName,
        locationLat,
        locationLng,
        data:           fieldData,
        notes,
        attachments:    photos,
        queuedAt:       new Date().toISOString(),
        failCount:      0,
      }
      await enqueue(queued)
      onQueued()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save offline')
    } finally {
      setQueuing(false)
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
                boxSizing: 'border-box', marginBottom: 14,
              }}
            />

            {/* GPS capture */}
            <button
              onClick={captureGPS}
              disabled={gpsLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: locationLat ? COLORS.foam : '#fff',
                border: `2px solid ${locationLat ? COLORS.forest : COLORS.mist}`,
                color: locationLat ? COLORS.forest : COLORS.slate,
                cursor: gpsLoading ? 'wait' : 'pointer',
                marginBottom: 14,
              }}
            >
              {gpsLoading
                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : <MapPin size={15} />}
              {locationLat
                ? `GPS: ${locationLat.toFixed(5)}, ${locationLng?.toFixed(5)}`
                : gpsLoading ? 'Getting GPS…' : 'Capture GPS location'}
            </button>
            {gpsError && (
              <p style={{ fontSize: 12, color: COLORS.crimson, marginBottom: 14 }}>{gpsError}</p>
            )}

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
              {locationLat && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${COLORS.mist}` }}>
                  <span style={{ fontSize: 13, color: COLORS.stone, minWidth: 120 }}>GPS</span>
                  <span style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>
                    {locationLat.toFixed(5)}, {locationLng?.toFixed(5)}
                  </span>
                </div>
              )}
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
                resize: 'vertical', boxSizing: 'border-box', marginBottom: 20,
              }}
            />

            {/* Photo capture */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate, display: 'block', marginBottom: 10 }}>
                Photos ({photos.length}/5)
              </label>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {photos.map((photo, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 72, height: 72 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.dataUri}
                        alt={photo.name}
                        style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: `2px solid ${COLORS.mist}` }}
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 20, height: 20, borderRadius: '50%',
                          background: COLORS.crimson, color: '#fff', border: 'none',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, padding: 0,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: '#fff', border: `2px solid ${COLORS.mist}`,
                      color: COLORS.slate, cursor: 'pointer',
                    }}
                  >
                    <Camera size={15} /> Add photo
                  </button>
                </>
              )}
            </div>

            {/* Offline status */}
            {!isOnline && (
              <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: 10, fontSize: 12, color: '#92400E', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <WifiOff size={14} />
                <span>You&apos;re offline — this submission will be saved to your device and synced when you reconnect.</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, fontSize: 12, color: COLORS.crimson }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div style={{ padding: '16px 20px', background: '#1A2B4A', borderTop: `1px solid ${COLORS.mist}` }}>
        {isLastStep ? (
          isOnline ? (
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
              onClick={queueOffline}
              disabled={queuing}
              style={{
                width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 700,
                background: '#D97706', color: '#fff', cursor: queuing ? 'wait' : 'pointer',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: queuing ? 0.7 : 1,
              }}
            >
              {queuing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <WifiOff size={18} />}
              {queuing ? 'Saving…' : 'Save for later sync'}
            </button>
          )
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

  const [activeTab,          setActiveTab]          = useState<'forms' | 'history'>('forms')
  const [programs,           setPrograms]            = useState<{ id: string; name: string }[]>([])
  const [selectedProgramId,  setSelectedProgramId]  = useState('')
  const [forms,              setForms]               = useState<FieldCollectionForm[]>([])
  const [mySubmissions,      setMySubmissions]       = useState<FieldSubmission[]>([])
  const [loading,            setLoading]             = useState(true)
  const [loadError,          setLoadError]           = useState('')
  const [wizard,             setWizard]              = useState<FieldCollectionForm | null>(null)
  const [userId,             setUserId]              = useState('')
  const [isOnline,           setIsOnline]            = useState(true)
  const [pendingCount,       setPendingCount]        = useState(0)
  const [syncing,            setSyncing]             = useState(false)
  const [syncMsg,            setSyncMsg]             = useState('')

  // ── Data loading ───────────────────────────────────────────────────────────

  // Direct Supabase queries avoid the auth waterfall that fetch('/api/...') adds.
  // RLS on field_collection_forms and field_submissions already enforces org-scoping.
  const loadFormsAndSubs = useCallback(async (programId: string, uid: string) => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = supabase
    const [formsResult, subResult] = await Promise.all([
      db
        .from('field_collection_forms')
        .select('*')
        .eq('program_id', programId)
        .eq('active', true)
        .order('created_at', { ascending: false }),
      db
        .from('field_submissions')
        .select('*')
        .eq('program_id', programId)
        .order('submission_date', { ascending: false }),
    ])
    setForms((formsResult.data ?? []) as FieldCollectionForm[])
    setMySubmissions(
      ((subResult.data ?? []) as FieldSubmission[]).filter(s => s.submitted_by === uid)
    )
  }, [])

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const supabase = createClient()
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data: profileData } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      const profile = profileData as { organization_id: string } | null
      if (!profile?.organization_id) {
        setLoadError('Could not load your organisation. Please refresh.')
        return
      }

      const { data: progs } = await supabase
        .from('programs')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
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
      setLoadError('Failed to load field data. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }, [router, loadFormsAndSubs])

  useEffect(() => { load() }, [load])

  // ── Online/offline detection ───────────────────────────────────────────────

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      const count = await queueCount()
      if (count === 0) { setPendingCount(0); return }

      setSyncing(true)
      setSyncMsg(`Syncing ${count} offline submission${count > 1 ? 's' : ''}…`)

      const result = await syncQueue((done, total) => {
        setSyncMsg(`Syncing… ${done}/${total}`)
      })

      setSyncing(false)
      const remaining = await queueCount()
      setPendingCount(remaining)

      if (result.succeeded > 0) {
        setSyncMsg(`✓ Synced ${result.succeeded} submission${result.succeeded > 1 ? 's' : ''}`)
      }
      if (result.failed > 0) {
        setSyncMsg(`${result.failed} submission${result.failed > 1 ? 's' : ''} failed to sync`)
      }
      setTimeout(() => setSyncMsg(''), 5_000)
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC') handleOnline()
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [])

  // Refresh queue count on mount
  useEffect(() => {
    queueCount().then(setPendingCount).catch(() => {})
  }, [])

  async function handleProgramChange(id: string) {
    setSelectedProgramId(id)
    setForms([])
    setMySubmissions([])
    if (id) await loadFormsAndSubs(id, userId)
  }

  async function refreshQueueCount() {
    setPendingCount(await queueCount())
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
        <Loader2 size={28} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 13, color: COLORS.stone }}>Loading field data…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: COLORS.crimson }}>{loadError}</p>
        <button
          onClick={() => { setLoading(true); load() }}
          style={{ padding: '10px 20px', borderRadius: 10, background: COLORS.forest, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Retry
        </button>
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

          {/* Online/offline indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: isOnline ? '#D1FAE5' : '#FEF3C7',
            fontSize: 12, fontWeight: 600,
            color: isOnline ? '#065F46' : '#92400E',
          }}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* Pending queue badge */}
          {pendingCount > 0 && (
            <button
              onClick={async () => {
                if (!isOnline) return
                setSyncing(true)
                const result = await syncQueue((done, total) => setSyncMsg(`${done}/${total}`))
                setSyncing(false)
                setPendingCount(await queueCount())
                if (result.succeeded > 0 && selectedProgramId) {
                  await loadFormsAndSubs(selectedProgramId, userId)
                }
                setTimeout(() => setSyncMsg(''), 4_000)
              }}
              disabled={!isOnline || syncing}
              title={isOnline ? 'Tap to sync now' : 'Will sync when online'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: '#FEF3C7', border: 'none', cursor: isOnline ? 'pointer' : 'default',
                fontSize: 12, fontWeight: 600, color: '#92400E',
              }}
            >
              {syncing
                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <RefreshCw size={12} />}
              {pendingCount} queued
            </button>
          )}
        </div>

        {/* Sync status message */}
        {syncMsg && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: syncMsg.startsWith('✓') ? '#D1FAE5' : '#FEF3C7',
            color: syncMsg.startsWith('✓') ? '#065F46' : '#92400E',
            marginBottom: 8,
          }}>
            {syncMsg}
          </div>
        )}

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

                {/* Offline tip */}
                {!isOnline && (
                  <div style={{
                    padding: '12px 16px', background: '#FEF3C7', borderRadius: 12,
                    fontSize: 12, color: '#92400E', marginTop: 4,
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <WifiOff size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>You&apos;re offline. Complete a form and tap <strong>Save for later sync</strong> — it will upload automatically when you reconnect.</span>
                  </div>
                )}
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
          isOnline={isOnline}
          onClose={() => setWizard(null)}
          onSubmitted={sub => {
            setMySubmissions(prev => [{ ...sub, form_name: wizard.name } as FieldSubmission, ...prev])
            setWizard(null)
          }}
          onQueued={() => {
            setWizard(null)
            refreshQueueCount()
          }}
        />
      )}
    </div>
  )
}
