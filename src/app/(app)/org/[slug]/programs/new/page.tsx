'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { createProgram } from '@/app/actions/programs'
import type { ProgramStatusDB, ProgramVisibility } from '@/lib/supabase/database.types'
import {
  PROGRAM_STATUS_LABELS,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
} from '@/lib/programs'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Basics',     desc: 'Name, objective, description' },
  { label: 'Details',    desc: 'Funder, dates, location, budget' },
  { label: 'Visibility', desc: 'Who can see this program' },
  { label: 'Review',     desc: 'Confirm and create' },
]

const STATUS_OPTIONS = [
  { value: 'PLANNING',  label: 'Planning' },
  { value: 'ACTIVE',    label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'ETB', label: 'ETB — Ethiopian Birr' },
  { value: 'UGX', label: 'UGX — Ugandan Shilling' },
]

// ── NewProgramPage ────────────────────────────────────────────────────────────

export default function NewProgramPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Step 1 — Basics
  const [name,        setName]        = useState('')
  const [objective,   setObjective]   = useState('')
  const [description, setDescription] = useState('')
  const [status,      setStatus]      = useState<ProgramStatusDB>('PLANNING')
  const [tagInput,    setTagInput]    = useState('')
  const [tags,        setTags]        = useState<string[]>([])

  // Step 2 — Details
  const [funder,   setFunder]   = useState('')
  const [startDate,setStartDate]= useState('')
  const [endDate,  setEndDate]  = useState('')
  const [country,  setCountry]  = useState('')
  const [region,   setRegion]   = useState('')
  const [budget,   setBudget]   = useState('')
  const [currency, setCurrency] = useState('USD')
  const [logframe, setLogframe] = useState('')

  // Step 3 — Visibility
  const [visibility, setVisibility] = useState<ProgramVisibility>('PRIVATE')

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(ts => [...ts, t])
    setTagInput('')
  }

  function canNext(): boolean {
    if (step === 0) return name.trim().length > 0
    return true
  }

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createProgram({
        name:             name.trim(),
        status,
        description:      description.trim() || undefined,
        objective:        objective.trim()   || undefined,
        start_date:       startDate          || undefined,
        end_date:         endDate            || undefined,
        location_country: country.trim()     || undefined,
        location_region:  region.trim()      || undefined,
        primary_funder:   funder.trim()      || undefined,
        total_budget:     budget ? parseFloat(budget) : undefined,
        currency:         currency || 'USD',
        logframe_url:     logframe.trim()    || undefined,
        tags:             tags.length ? tags : undefined,
        visibility,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      router.push(`/org/${params.slug}/programs/${result.data?.id}`)
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Back link */}
      <button
        onClick={() => router.push(`/org/${params.slug}/programs`)}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          fontSize:   13,
          color:      COLORS.slate,
          cursor:     'pointer',
          background: 'none',
          border:     'none',
          marginBottom: 24,
          padding:    0,
        }}
      >
        <ArrowLeft size={14} /> Back to Programs
      </button>

      <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 6 }}>
        New Program
      </h1>
      <p style={{ fontSize: 13, color: COLORS.stone, marginBottom: 28 }}>
        Fill in the details to create your program. You can add indicators and invite donors after creation.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {i > 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 14, width: '50%', height: 2,
                background: i <= step ? COLORS.moss : COLORS.mist,
                transform: 'none',
              }} />
            )}
            {i < STEPS.length - 1 && (
              <div style={{
                position: 'absolute', right: 0, top: 14, width: '50%', height: 2,
                background: i < step ? COLORS.moss : COLORS.mist,
              }} />
            )}
            <div style={{
              width:       28,
              height:      28,
              borderRadius: '50%',
              background:  i < step ? COLORS.moss : i === step ? COLORS.fern : '#fff',
              border:      `2px solid ${i <= step ? COLORS.moss : COLORS.mist}`,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              zIndex:      1,
              transition:  'all 0.2s',
            }}>
              {i < step
                ? <Check size={12} color="#fff" />
                : <span style={{ fontSize: 11, fontWeight: 700, color: i === step ? '#fff' : COLORS.stone }}>{i + 1}</span>
              }
            </div>
            <span style={{
              fontSize:  10,
              fontWeight: i === step ? 700 : 500,
              color:     i === step ? COLORS.forest : COLORS.stone,
              marginTop:  6,
              textAlign: 'center',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ padding: '28px 28px 24px' }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
          {STEPS[step].label}
        </h2>
        <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 20 }}>
          {STEPS[step].desc}
        </p>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Program name" required htmlFor="pn-name">
              <Input
                id="pn-name"
                placeholder="e.g. Community Nutrition Program"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </FormField>
            <FormField label="Status" htmlFor="pn-status">
              <Select
                id="pn-status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={e => setStatus(e.target.value as ProgramStatusDB)}
              />
            </FormField>
            <FormField label="Objective (one-line goal)" htmlFor="pn-obj">
              <Input
                id="pn-obj"
                placeholder="e.g. Reduce acute malnutrition in children under 5"
                value={objective}
                onChange={e => setObjective(e.target.value)}
              />
            </FormField>
            <FormField label="Description" htmlFor="pn-desc">
              <Textarea
                id="pn-desc"
                rows={3}
                placeholder="Brief overview of the program…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </FormField>
            <FormField label="Tags" htmlFor="pn-tags">
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  id="pn-tags"
                  placeholder="e.g. nutrition, child health"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={addTag}
                  type="button"
                  style={{
                    padding: '7px 14px', borderRadius: 7, background: COLORS.foam,
                    border: `1px solid ${COLORS.mist}`, cursor: 'pointer', fontSize: 12,
                    color: COLORS.slate, fontWeight: 600,
                  }}
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {tags.map(t => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 14,
                      background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
                      fontSize: 11, color: COLORS.slate,
                    }}>
                      {t}
                      <button
                        onClick={() => setTags(ts => ts.filter(x => x !== t))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                      >
                        <X size={10} color={COLORS.stone} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </FormField>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Primary funder" htmlFor="pn-funder">
              <Input
                id="pn-funder"
                placeholder="e.g. USAID, GIZ, FCDO"
                value={funder}
                onChange={e => setFunder(e.target.value)}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Start date" htmlFor="pn-start">
                <Input id="pn-start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="End date" htmlFor="pn-end">
                <Input id="pn-end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Country" htmlFor="pn-country">
                <Input id="pn-country" placeholder="e.g. Ghana" value={country} onChange={e => setCountry(e.target.value)} />
              </FormField>
              <FormField label="Region / Area" htmlFor="pn-region">
                <Input id="pn-region" placeholder="e.g. Northern Region" value={region} onChange={e => setRegion(e.target.value)} />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <FormField label="Total budget" htmlFor="pn-budget">
                <Input id="pn-budget" type="number" min={0} placeholder="0" value={budget} onChange={e => setBudget(e.target.value)} />
              </FormField>
              <FormField label="Currency" htmlFor="pn-currency">
                <Select id="pn-currency" options={CURRENCY_OPTIONS} value={currency} onChange={e => setCurrency(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Logframe URL (optional)" htmlFor="pn-logframe">
              <Input
                id="pn-logframe"
                type="url"
                placeholder="https://docs.google.com/..."
                value={logframe}
                onChange={e => setLogframe(e.target.value)}
              />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['PRIVATE', 'DONOR_ONLY', 'PUBLIC'] as ProgramVisibility[]).map(v => (
              <label
                key={v}
                onClick={() => setVisibility(v)}
                style={{
                  display:       'flex',
                  alignItems:    'flex-start',
                  gap:           14,
                  padding:       '14px 16px',
                  borderRadius:  10,
                  border:        `2px solid ${visibility === v ? COLORS.moss : COLORS.mist}`,
                  background:    visibility === v ? COLORS.foam : '#fff',
                  cursor:        'pointer',
                  transition:    'all 0.15s',
                }}
              >
                <div style={{
                  width:         18,
                  height:        18,
                  borderRadius:  '50%',
                  border:        `2px solid ${visibility === v ? COLORS.moss : COLORS.mist}`,
                  background:    visibility === v ? COLORS.moss : '#fff',
                  flexShrink:    0,
                  marginTop:     2,
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent: 'center',
                }}>
                  {visibility === v && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 3 }}>
                    {VISIBILITY_LABELS[v]}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.5 }}>
                    {VISIBILITY_DESCRIPTIONS[v]}
                  </div>
                </div>
              </label>
            ))}
            <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4, lineHeight: 1.5 }}>
              You can add indicators and invite donors after creation. Visibility can be changed at any time in Settings.
            </p>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ReviewRow label="Program name"    value={name} />
            <ReviewRow label="Status"          value={PROGRAM_STATUS_LABELS[status]} />
            {objective   && <ReviewRow label="Objective"      value={objective} />}
            {funder      && <ReviewRow label="Primary funder" value={funder} />}
            {(country || region) && <ReviewRow label="Location" value={[region, country].filter(Boolean).join(', ')} />}
            {startDate   && <ReviewRow label="Start date"     value={startDate} />}
            {endDate     && <ReviewRow label="End date"       value={endDate} />}
            {budget      && <ReviewRow label="Total budget"   value={`${parseFloat(budget).toLocaleString()} ${currency}`} />}
            {logframe    && <ReviewRow label="Logframe URL"   value={logframe} />}
            {tags.length > 0 && <ReviewRow label="Tags" value={tags.join(', ')} />}
            <ReviewRow label="Visibility"    value={VISIBILITY_LABELS[visibility]} />

            {error && (
              <div style={{
                padding: 12, borderRadius: 8, background: '#FEE2E2',
                border: '1px solid #FECACA', fontSize: 13, color: '#991B1B',
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button
          onClick={() => step === 0 ? router.push(`/org/${params.slug}/programs`) : setStep(s => s - 1)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            padding:    '9px 16px',
            borderRadius: 8,
            background: '#fff',
            border:     `1px solid ${COLORS.mist}`,
            fontSize:   13,
            color:      COLORS.slate,
            cursor:     'pointer',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        6,
              padding:    '9px 18px',
              borderRadius: 8,
              background: canNext() ? COLORS.moss : COLORS.mist,
              color:      canNext() ? '#fff' : COLORS.stone,
              border:     'none',
              fontSize:   13,
              fontWeight: 600,
              cursor:     canNext() ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Continue <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={isPending}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        6,
              padding:    '9px 20px',
              borderRadius: 8,
              background: isPending ? COLORS.mist : COLORS.moss,
              color:      isPending ? COLORS.stone : '#fff',
              border:     'none',
              fontSize:   13,
              fontWeight: 700,
              cursor:     isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Plus size={14} /> Create Program</>}
          </button>
        )}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: `1px solid ${COLORS.mist}` }}>
      <span style={{ fontSize: 12, color: COLORS.stone, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: COLORS.charcoal, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}
