'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PenLine, Plus, List, Clock, RotateCcw, Save, Trash2,
  ChevronDown, ChevronUp, RefreshCw, AlertCircle, CheckCircle,
  Download, Layers, X, TrendingUp,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import {
  SECTION_KEYS, SECTION_LABELS, GRANT_STATUS_LABELS, GRANT_STATUS_COLORS,
  type GrantInputForm, type GrantSections, type GrantStatus, type Grant, type GrantVersion,
  type SectionKey,
} from '@/lib/grant-types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GrantWithVersions extends Grant {
  grant_versions: GrantVersion[]
}

interface ProgramOption {
  id:     string
  name:   string
  status: string
}

interface ImpactEstimate {
  id:                      string
  program_type:            string
  geography_region:        string
  total_budget:            number
  currency:                string
  duration_months:         number
  target_beneficiary_count?: number
  notes?:                  string
  results: {
    estimated_beneficiaries_min: number
    estimated_beneficiaries_max: number
    cost_per_beneficiary_actual_min: number
    cost_per_beneficiary_actual_max: number
  }
  created_at: string
}

type StreamPhase = 'idle' | 'streaming' | 'done' | 'error'

interface Props {
  orgSlug:        string
  orgId:          string
  orgName:        string
  userId:         string
  userRole:       'NGO_ADMIN' | 'NGO_STAFF'
  grantProfile:   {
    mission_statement:      string | null
    founding_year:          number | null
    beneficiary_types:      string[]
    past_program_summaries: string | null
    key_achievements:       string | null
    typical_budget_range:   string | null
  }
  profileComplete:  boolean
  initialGrants:    unknown[]
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: `1px solid ${COLORS.mist}`, borderRadius: 8,
  fontSize: 14, color: COLORS.charcoal, background: COLORS.pearl,
  outline: 'none', boxSizing: 'border-box', fontFamily: FONTS.body,
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'KES', 'GHS', 'NGN', 'ZAR', 'UGX', 'TZS']

const EMPTY_FORM: GrantInputForm = {
  funder_name:              '',
  opportunity_title:        '',
  funding_amount_requested: 0,
  currency:                 'USD',
  application_deadline:     '',
  funder_priorities:        '',
  geographic_focus:         '',
  target_beneficiary_count: 0,
  program_duration_months:  0,
  specific_requirements:    '',
}

// ── Section key normalisation ─────────────────────────────────────────────────
// Handles malformed keys from stream events: trims whitespace, normalises case.

function normalizeSection(raw: string): SectionKey | null {
  if (!raw) return null
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, '_')
  const exact = SECTION_KEYS.find(k => k === cleaned)
  if (exact) return exact
  // Fuzzy match: strip all separators and compare
  const stripped = cleaned.replace(/_/g, '')
  return SECTION_KEYS.find(k => k.replace(/_/g, '') === stripped) ?? null
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GrantsClient({
  orgSlug, orgId, orgName, userId, userRole, grantProfile, profileComplete, initialGrants,
}: Props) {
  const [mainTab,       setMainTab]       = useState<'new' | 'list'>('new')
  const [grants,        setGrants]        = useState<GrantWithVersions[]>(initialGrants as GrantWithVersions[])
  const [activeGrantId, setActiveGrantId] = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)

  const activeGrant = grants.find(g => g.id === activeGrantId) ?? null

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  function refreshGrant(updated: GrantWithVersions) {
    setGrants(prev => prev.map(g => g.id === updated.id ? updated : g))
  }

  function addGrant(g: GrantWithVersions) {
    setGrants(prev => [g, ...prev])
  }

  function removeGrant(id: string) {
    setGrants(prev => prev.filter(g => g.id !== id))
    if (activeGrantId === id) setActiveGrantId(null)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: toast.ok ? '#1A3A2A' : '#3A1A1A',
          border: `1px solid ${toast.ok ? '#38A169' : COLORS.crimson}40`,
          color: toast.ok ? '#38A169' : COLORS.crimson,
          padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 500, boxShadow: SHADOW.toast,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <PenLine size={22} style={{ color: COLORS.gold }} />
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.charcoal, margin: 0 }}>
            Grant Writing
          </h1>
        </div>
        <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>{orgName}</p>
      </div>

      {/* Incomplete profile banner */}
      {!profileComplete && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, marginBottom: 24,
          background: '#2A1E00', border: `1px solid ${COLORS.amber}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={16} style={{ color: COLORS.amber, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: COLORS.amber, margin: 0 }}>
              Your grant profile is incomplete. Complete it to help the AI generate more accurate proposals.
            </p>
          </div>
          <Link
            href={`/org/${orgSlug}/settings`}
            style={{
              flexShrink: 0, padding: '7px 14px',
              background: COLORS.amber, color: COLORS.forest,
              border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.mist}`, marginBottom: 32, gap: 0 }}>
        {([['new', 'New Grant', Plus], ['list', 'My Grants', List]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => { setMainTab(id); setActiveGrantId(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', fontSize: 14,
              fontWeight: mainTab === id ? 600 : 400,
              color: mainTab === id ? COLORS.gold : COLORS.stone,
              borderBottom: mainTab === id ? `2px solid ${COLORS.gold}` : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer', background: 'transparent', fontFamily: FONTS.body,
              border: 'none',
            }}
          >
            <Icon size={14} />
            {label}
            {id === 'list' && grants.length > 0 && (
              <span style={{
                background: COLORS.mist, color: COLORS.slate,
                borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 600,
              }}>
                {grants.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {mainTab === 'new' && !activeGrantId && (
        <NewGrantForm
          orgId={orgId}
          orgSlug={orgSlug}
          grantProfile={grantProfile}
          onGenerated={(g) => { addGrant(g); setActiveGrantId(g.id); setMainTab('list') }}
          onToast={showToast}
        />
      )}

      {mainTab === 'list' && !activeGrantId && (
        <MyGrantsList
          grants={grants}
          userRole={userRole}
          onOpen={(id) => setActiveGrantId(id)}
          onStatusChange={(id, status) => {
            setGrants(prev => prev.map(g => g.id === id ? { ...g, status } : g))
          }}
          onDelete={removeGrant}
          onToast={showToast}
        />
      )}

      {activeGrantId && activeGrant && (
        <GrantEditor
          grant={activeGrant}
          orgId={orgId}
          userRole={userRole}
          onBack={() => setActiveGrantId(null)}
          onUpdate={refreshGrant}
          onToast={showToast}
          userId={userId}
        />
      )}
    </div>
  )
}

// ── NewGrantForm ───────────────────────────────────────────────────────────────

function NewGrantForm({ orgId, orgSlug, grantProfile, onGenerated, onToast }: {
  orgId:        string
  orgSlug:      string
  grantProfile: Props['grantProfile']
  onGenerated:  (g: GrantWithVersions) => void
  onToast:      (msg: string, ok?: boolean) => void
}) {
  const [form,           setForm]           = useState<GrantInputForm>(EMPTY_FORM)
  const [errors,         setErrors]         = useState<Partial<Record<keyof GrantInputForm, string>>>({})
  const [selectedProgId, setSelectedProgId] = useState<string>('')
  const [programs,       setPrograms]       = useState<ProgramOption[]>([])
  const [streaming,      setStreaming]      = useState<Partial<Record<string, string>>>({})
  const [streamPhase,    setStreamPhase]    = useState<StreamPhase>('idle')
  const [currentSection, setCurrentSection] = useState<string | null>(null)
  const [savedGrant,     setSavedGrant]     = useState<GrantWithVersions | null>(null)
  const [streamError,    setStreamError]    = useState<string | null>(null)
  const [showImpactModal,setShowImpactModal]= useState(false)
  const [estimates,      setEstimates]      = useState<ImpactEstimate[]>([])
  const [loadingEst,     setLoadingEst]     = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch programs for program selector
  useEffect(() => {
    fetch('/api/programs')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j?.data) {
          setPrograms((j.data as { id: string; name: string; status: string }[])
            .filter(p => p.status === 'ACTIVE')
            .map(p => ({ id: p.id, name: p.name, status: p.status })))
        }
      })
      .catch(() => {/* non-critical */})
  }, [])

  // Fetch recent impact estimates for the import modal
  const loadEstimates = useCallback(async () => {
    setLoadingEst(true)
    try {
      const res = await fetch('/api/impact/estimate?limit=5')
      if (res.ok) {
        const j = await res.json() as { data?: ImpactEstimate[] }
        setEstimates(j.data ?? [])
      }
    } catch { /* non-critical */ }
    finally { setLoadingEst(false) }
  }, [])

  function openImpactModal() {
    setShowImpactModal(true)
    loadEstimates()
  }

  function applyEstimate(est: ImpactEstimate) {
    setForm(prev => ({
      ...prev,
      target_beneficiary_count: est.target_beneficiary_count ?? prev.target_beneficiary_count,
      program_duration_months:  est.duration_months,
      funder_priorities: prev.funder_priorities
        ? `${prev.funder_priorities}\n\n--- Impact Estimate Context ---\nEstimated reach: ${est.results.estimated_beneficiaries_min.toLocaleString()}–${est.results.estimated_beneficiaries_max.toLocaleString()} people. Estimated cost per beneficiary: ${est.currency} ${est.results.cost_per_beneficiary_actual_min.toLocaleString()}–${est.results.cost_per_beneficiary_actual_max.toLocaleString()}. Program type: ${est.program_type}. Geography: ${est.geography_region}.`
        : `--- Impact Estimate Context ---\nEstimated reach: ${est.results.estimated_beneficiaries_min.toLocaleString()}–${est.results.estimated_beneficiaries_max.toLocaleString()} people. Estimated cost per beneficiary: ${est.currency} ${est.results.cost_per_beneficiary_actual_min.toLocaleString()}–${est.results.cost_per_beneficiary_actual_max.toLocaleString()}. Program type: ${est.program_type}. Geography: ${est.geography_region}.`,
    }))
    setShowImpactModal(false)
    onToast('Impact estimate applied to form')
  }

  function set<K extends keyof GrantInputForm>(k: K, v: GrantInputForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  function validate(): boolean {
    const e: Partial<Record<keyof GrantInputForm, string>> = {}
    if (!form.funder_name.trim())              e.funder_name = 'Funder name is required'
    if (!form.opportunity_title.trim())        e.opportunity_title = 'Opportunity title is required'
    if (!form.funding_amount_requested || form.funding_amount_requested <= 0)
                                               e.funding_amount_requested = 'Enter a valid funding amount'
    if (!form.application_deadline)            e.application_deadline = 'Application deadline is required'
    if (!form.funder_priorities.trim())        e.funder_priorities = 'Funder priorities are required'
    if (!form.geographic_focus.trim())         e.geographic_focus = 'Geographic focus is required'
    if (!form.target_beneficiary_count || form.target_beneficiary_count <= 0)
                                               e.target_beneficiary_count = 'Enter a target beneficiary count'
    if (!form.program_duration_months || form.program_duration_months <= 0)
                                               e.program_duration_months = 'Enter a program duration in months'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGenerate() {
    if (!validate()) return
    setStreamPhase('streaming')
    setStreaming({})
    setCurrentSection(null)
    setSavedGrant(null)
    setStreamError(null)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/grants/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          organization_id: orgId,
          form,
          program_id: selectedProgId || undefined,
        }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        onToast((j as { message?: string }).message ?? 'Generation failed', false)
        setStreamPhase('idle')
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { onToast('No stream response', false); setStreamPhase('idle'); return }

      const decoder = new TextDecoder()
      let buf = ''
      let doneEventReceived = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const evt = JSON.parse(raw) as {
              type: string; section?: string; text?: string
              grant?: GrantWithVersions; message?: string
            }

            if (evt.type === 'section_start' && evt.section) {
              const key = normalizeSection(evt.section) ?? evt.section
              setCurrentSection(key)
              setStreaming(prev => ({ ...prev, [key]: prev[key] ?? '' }))

            } else if (evt.type === 'delta' && evt.section && evt.text) {
              const key = normalizeSection(evt.section) ?? evt.section
              // Insert into streaming in SECTION_KEYS order (handled by display)
              setStreaming(prev => ({ ...prev, [key]: (prev[key] ?? '') + evt.text! }))

            } else if (evt.type === 'done' && evt.grant) {
              doneEventReceived = true
              setCurrentSection(null)
              setSavedGrant(evt.grant)
              setStreamPhase('done')

            } else if (evt.type === 'error') {
              doneEventReceived = true
              setStreamError(evt.message ?? 'Stream error')
              setStreamPhase('error')
            }
          } catch { /* skip malformed lines */ }
        }
      }

      // Stream ended without a done event — unexpected close
      if (!doneEventReceived) {
        setStreamPhase('error')
        setStreamError('Stream closed before generation completed. Some sections may be incomplete.')
        setCurrentSection(null)
      }

    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        setStreamPhase('error')
        setStreamError('Generation failed — please try again')
        setCurrentSection(null)
      } else {
        setStreamPhase('idle')
      }
    }
  }

  async function handleRegenMissingSection(sectionKey: string) {
    if (!savedGrant) return
    try {
      const res = await fetch('/api/grants/regenerate-section', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          grant_id:       savedGrant.id,
          version_number: 1,
          section_name:   sectionKey,
        }),
      })
      if (!res.ok) { onToast('Section regeneration failed', false); return }
      const { text } = await res.json() as { text: string }
      setStreaming(prev => ({ ...prev, [sectionKey]: text }))
      onToast(`${SECTION_LABELS[sectionKey as SectionKey] ?? sectionKey} regenerated`)
    } catch {
      onToast('Section regeneration failed', false)
    }
  }

  function handleCancelStream() {
    abortRef.current?.abort()
    setStreamPhase('idle')
    setStreaming({})
    setCurrentSection(null)
    setSavedGrant(null)
    setStreamError(null)
  }

  const err = (k: keyof GrantInputForm) => errors[k]
    ? <p style={{ fontSize: 11, color: COLORS.crimson, marginTop: 3 }}>{errors[k]}</p>
    : null

  if (streamPhase !== 'idle') {
    return (
      <StreamingPreview
        streaming={streaming}
        currentSection={currentSection}
        streamPhase={streamPhase}
        streamError={streamError}
        savedGrant={savedGrant}
        onRegenMissingSection={handleRegenMissingSection}
        onViewGrant={(g) => onGenerated(g)}
        onCancel={handleCancelStream}
        onRetry={() => { setStreamPhase('idle'); setStreaming({}); setSavedGrant(null); setStreamError(null) }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontSize: 14, color: COLORS.stone, margin: 0 }}>
          Fill in the grant details below. The AI will combine these with your organization profile to generate a full proposal.
        </p>
        <button
          onClick={openImpactModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: COLORS.foam,
            color: COLORS.sky, border: `1px solid ${COLORS.sky}30`, borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <TrendingUp size={13} /> Import from Impact Estimate
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Funder Name */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Funder Name <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input style={{ ...inputStyle, borderColor: errors.funder_name ? COLORS.crimson : COLORS.mist }}
            value={form.funder_name} onChange={e => set('funder_name', e.target.value)}
            placeholder="e.g. USAID, Gates Foundation, EU Delegation" />
          {err('funder_name')}
        </div>

        {/* Opportunity Title */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Opportunity Title <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input style={{ ...inputStyle, borderColor: errors.opportunity_title ? COLORS.crimson : COLORS.mist }}
            value={form.opportunity_title} onChange={e => set('opportunity_title', e.target.value)}
            placeholder="e.g. Community Resilience Grant 2025" />
          {err('opportunity_title')}
        </div>

        {/* Funding Amount + Currency */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Funding Amount Requested <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={form.currency} onChange={e => set('currency', e.target.value)}
              style={{ ...inputStyle, width: 90, flexShrink: 0 }}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              style={{ ...inputStyle, flex: 1, borderColor: errors.funding_amount_requested ? COLORS.crimson : COLORS.mist }}
              type="number" min={0}
              value={form.funding_amount_requested || ''}
              onChange={e => set('funding_amount_requested', Number(e.target.value))}
              placeholder="e.g. 150000"
            />
          </div>
          {err('funding_amount_requested')}
        </div>

        {/* Application Deadline */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Application Deadline <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input
            style={{ ...inputStyle, borderColor: errors.application_deadline ? COLORS.crimson : COLORS.mist }}
            type="date" value={form.application_deadline}
            onChange={e => set('application_deadline', e.target.value)}
          />
          {err('application_deadline')}
        </div>

        {/* Geographic Focus */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Geographic Focus <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input
            style={{ ...inputStyle, borderColor: errors.geographic_focus ? COLORS.crimson : COLORS.mist }}
            value={form.geographic_focus} onChange={e => set('geographic_focus', e.target.value)}
            placeholder="e.g. Northern Ghana, Coastal Kenya"
          />
          {err('geographic_focus')}
        </div>

        {/* Target Beneficiary Count */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Target Beneficiary Count <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input
            style={{ ...inputStyle, borderColor: errors.target_beneficiary_count ? COLORS.crimson : COLORS.mist }}
            type="number" min={0}
            value={form.target_beneficiary_count || ''}
            onChange={e => set('target_beneficiary_count', Number(e.target.value))}
            placeholder="e.g. 5000"
          />
          {err('target_beneficiary_count')}
        </div>

        {/* Program Duration */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Program Duration (months) <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <input
            style={{ ...inputStyle, borderColor: errors.program_duration_months ? COLORS.crimson : COLORS.mist }}
            type="number" min={1}
            value={form.program_duration_months || ''}
            onChange={e => set('program_duration_months', Number(e.target.value))}
            placeholder="e.g. 18"
          />
          {err('program_duration_months')}
        </div>

        {/* Link to Program (optional) */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Link to Program
          </label>
          <select
            value={selectedProgId}
            onChange={e => setSelectedProgId(e.target.value)}
            style={{ ...inputStyle }}
          >
            <option value="">None</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Funder Priorities */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Funder Priorities <span style={{ color: COLORS.crimson }}>*</span>
          </label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 100, borderColor: errors.funder_priorities ? COLORS.crimson : COLORS.mist }}
            value={form.funder_priorities} onChange={e => set('funder_priorities', e.target.value)}
            placeholder="Paste the funder's stated priorities, focus areas, or call-for-proposals text here…"
          />
          {err('funder_priorities')}
        </div>

        {/* Specific Requirements */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Specific Requirements or Restrictions
          </label>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            value={form.specific_requirements} onChange={e => set('specific_requirements', e.target.value)}
            placeholder="Any eligibility restrictions, reporting formats, co-funding requirements, prohibited activities… (optional)"
          />
        </div>
      </div>

      {/* Grant profile tip */}
      {!grantProfile.mission_statement && (
        <div style={{
          padding: '12px 16px', borderRadius: 9,
          background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
          fontSize: 13, color: COLORS.stone,
        }}>
          Tip: Add your organization mission, past programs, and key achievements in{' '}
          <Link href={`/org/${orgSlug}/settings`} style={{ color: COLORS.sky }}>Settings → Grant Profile</Link>{' '}
          for richer proposals.
        </div>
      )}

      <button
        onClick={handleGenerate}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
          padding: '11px 26px',
          background: `linear-gradient(135deg, ${COLORS.forest}, #1A3A5C)`,
          color: COLORS.gold, border: `1px solid ${COLORS.gold}30`, borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.body,
          boxShadow: '0 4px 16px rgba(212,175,92,0.15)',
        }}
      >
        <PenLine size={15} />
        Generate Proposal
      </button>

      {/* Impact Estimate Import Modal */}
      {showImpactModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
          onClick={() => setShowImpactModal(false)}
        >
          <div
            style={{
              background: COLORS.pearl, borderRadius: 16, border: `1px solid ${COLORS.mist}`,
              padding: 24, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
              boxShadow: SHADOW.modal,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} style={{ color: COLORS.gold }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.charcoal, fontFamily: FONTS.heading }}>
                  Import from Impact Estimate
                </h3>
              </div>
              <button
                onClick={() => setShowImpactModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.stone, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: COLORS.stone, margin: '0 0 16px' }}>
              Select a recent estimate to pre-fill beneficiary count, program duration, and impact context.
            </p>

            {loadingEst ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.stone, fontSize: 13 }}>
                Loading estimates…
              </div>
            ) : estimates.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 0',
                border: `2px dashed ${COLORS.mist}`, borderRadius: 12,
              }}>
                <TrendingUp size={28} style={{ color: COLORS.mist, marginBottom: 10 }} />
                <p style={{ fontSize: 14, color: COLORS.stone, margin: '0 0 6px', fontWeight: 600 }}>
                  No impact estimates yet
                </p>
                <p style={{ fontSize: 12, color: COLORS.stone, margin: 0 }}>
                  Create one in the Impact Estimator to use it here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {estimates.map(est => (
                  <button
                    key={est.id}
                    onClick={() => applyEstimate(est)}
                    style={{
                      textAlign: 'left', padding: '14px 16px',
                      background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
                      borderRadius: 10, cursor: 'pointer', fontFamily: FONTS.body,
                      transition: 'border-color 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = COLORS.gold)}
                    onMouseOut={e => (e.currentTarget.style.borderColor = COLORS.mist)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, margin: '0 0 4px' }}>
                          {est.program_type} · {est.geography_region}
                        </p>
                        <p style={{ fontSize: 12, color: COLORS.slate, margin: '0 0 6px' }}>
                          Budget: {est.currency} {Number(est.total_budget).toLocaleString()} · {est.duration_months} months
                        </p>
                        <p style={{ fontSize: 12, color: COLORS.sky, margin: 0 }}>
                          Est. reach: {est.results.estimated_beneficiaries_min.toLocaleString()}–{est.results.estimated_beneficiaries_max.toLocaleString()} people
                        </p>
                      </div>
                      <span style={{ fontSize: 11, color: COLORS.stone, whiteSpace: 'nowrap' }}>
                        {new Date(est.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── StreamingPreview ───────────────────────────────────────────────────────────

function StreamingPreview({
  streaming, currentSection, streamPhase, streamError,
  savedGrant, onRegenMissingSection, onViewGrant, onCancel, onRetry,
}: {
  streaming:             Partial<Record<string, string>>
  currentSection:        string | null
  streamPhase:           StreamPhase
  streamError:           string | null
  savedGrant:            GrantWithVersions | null
  onRegenMissingSection: (key: string) => void
  onViewGrant:           (g: GrantWithVersions) => void
  onCancel:              () => void
  onRetry:               () => void
}) {
  const missingSections = streamPhase === 'done'
    ? SECTION_KEYS.filter(k => !streaming[k]?.trim())
    : []

  const allComplete = missingSections.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {streamPhase === 'streaming' && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: COLORS.gold,
              animation: 'pulse 1.2s ease-in-out infinite', flexShrink: 0,
            }} />
          )}
          {streamPhase === 'done' && <CheckCircle size={16} style={{ color: '#38A169' }} />}
          {streamPhase === 'error' && <AlertCircle size={16} style={{ color: COLORS.crimson }} />}
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal, margin: 0 }}>
            {streamPhase === 'streaming' && 'Generating proposal…'}
            {streamPhase === 'done' && (allComplete ? 'Proposal generated' : 'Generation complete — some sections missing')}
            {streamPhase === 'error' && 'Generation error'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {streamPhase === 'done' && savedGrant && allComplete && (
            <button
              onClick={() => onViewGrant(savedGrant)}
              style={{
                padding: '7px 18px', background: COLORS.forest, color: COLORS.gold,
                border: `1px solid ${COLORS.gold}30`, borderRadius: 8,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              View Grant →
            </button>
          )}
          {streamPhase === 'error' && (
            <button
              onClick={onRetry}
              style={{
                padding: '7px 14px', background: COLORS.foam, color: COLORS.slate,
                border: `1px solid ${COLORS.mist}`, borderRadius: 8,
                fontSize: 12, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              ← Back to Form
            </button>
          )}
          {streamPhase === 'streaming' && (
            <button
              onClick={onCancel}
              style={{
                padding: '6px 14px', background: 'transparent',
                border: `1px solid ${COLORS.mist}`, borderRadius: 8,
                fontSize: 12, color: COLORS.stone, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {streamPhase === 'error' && streamError && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: '#3A1A1A', border: `1px solid ${COLORS.crimson}40`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: COLORS.crimson, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>{streamError}</p>
        </div>
      )}

      {/* Section panels — always rendered in SECTION_KEYS order */}
      {SECTION_KEYS.map(key => {
        const text     = streaming[key]
        const isActive = currentSection === key
        const hasText  = text !== undefined && text !== ''

        // Missing section: stream done but no content
        const isMissing = streamPhase === 'done' && !hasText
        // Incomplete: stream errored, section was started but stream cut off
        const isIncomplete = streamPhase === 'error' && text !== undefined && !hasText

        return (
          <div key={key} style={{
            borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${
              isMissing ? COLORS.crimson + '60'
              : isIncomplete ? COLORS.amber + '60'
              : isActive ? COLORS.gold + '60'
              : COLORS.mist
            }`,
            background: COLORS.pearl,
            opacity: (hasText || isMissing || isIncomplete) ? 1 : 0.4,
            transition: 'opacity 0.3s, border-color 0.3s',
          }}>
            <div style={{
              padding: '10px 16px',
              background: isMissing ? `${COLORS.crimson}12`
                        : isActive  ? `${COLORS.gold}12`
                        : COLORS.foam,
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: (hasText || isMissing) ? `1px solid ${COLORS.mist}` : 'none',
              flexWrap: 'wrap',
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: isMissing ? COLORS.crimson : isActive ? COLORS.gold : COLORS.charcoal,
              }}>
                {SECTION_LABELS[key]}
              </span>
              {isActive && (
                <span style={{ fontSize: 11, color: COLORS.gold, fontWeight: 500, animation: 'pulse 1s ease-in-out infinite' }}>
                  writing…
                </span>
              )}
              {hasText && !isActive && streamPhase !== 'error' && (
                <CheckCircle size={13} style={{ color: '#38A169', marginLeft: 'auto' }} />
              )}
              {isMissing && savedGrant && (
                <button
                  onClick={() => onRegenMissingSection(key)}
                  style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', background: 'transparent',
                    color: COLORS.crimson, border: `1px solid ${COLORS.crimson}40`, borderRadius: 6,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
                  }}
                >
                  <RefreshCw size={10} /> Regenerate Section
                </button>
              )}
            </div>

            {isMissing && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>
                This section was not generated by the model.
                {savedGrant ? ' Click "Regenerate Section" to generate it.' : ' Retry the full generation.'}
              </div>
            )}

            {isIncomplete && (
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 12, color: COLORS.amber, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={12} /> Stream interrupted — content may be incomplete
                </p>
              </div>
            )}

            {hasText && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {text}
              </div>
            )}
          </div>
        )
      })}

      {/* View Grant button after missing sections have been filled */}
      {streamPhase === 'done' && savedGrant && !allComplete && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: 12, color: COLORS.stone, margin: '0 0 10px' }}>
            Regenerate missing sections above, or view the grant with gaps.
          </p>
          <button
            onClick={() => onViewGrant(savedGrant)}
            style={{
              padding: '8px 20px', background: COLORS.foam, color: COLORS.slate,
              border: `1px solid ${COLORS.mist}`, borderRadius: 8,
              fontSize: 12, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            View Grant Anyway
          </button>
        </div>
      )}
    </div>
  )
}

// ── MyGrantsList ───────────────────────────────────────────────────────────────

function MyGrantsList({ grants, userRole, onOpen, onStatusChange, onDelete, onToast }: {
  grants:         GrantWithVersions[]
  userRole:       'NGO_ADMIN' | 'NGO_STAFF'
  onOpen:         (id: string) => void
  onStatusChange: (id: string, s: GrantStatus) => void
  onDelete:       (id: string) => void
  onToast:        (msg: string, ok?: boolean) => void
}) {
  const [statusFilter, setStatusFilter] = useState<GrantStatus | 'all'>('all')
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [exportingId,  setExportingId]  = useState<string | null>(null)

  const filtered = statusFilter === 'all' ? grants : grants.filter(g => g.status === statusFilter)

  async function handleStatusChange(g: GrantWithVersions, status: GrantStatus) {
    try {
      const res = await fetch(`/api/grants/${g.id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      if (!res.ok) { onToast('Failed to update status', false); return }
      onStatusChange(g.id, status)
      onToast('Status updated')
    } catch {
      onToast('Failed to update status', false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/grants/${id}`, { method: 'DELETE' })
      if (!res.ok) { onToast('Failed to delete grant', false); return }
      onDelete(id)
      onToast('Grant deleted')
    } catch {
      onToast('Failed to delete grant', false)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleExportPdf(g: GrantWithVersions) {
    setExportingId(g.id)
    try {
      const res = await fetch(`/api/grants/${g.id}/pdf`)
      if (!res.ok) { onToast('PDF export failed', false); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${g.opportunity_title.replace(/[^a-z0-9]/gi, '_')}_v${g.current_version}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      onToast('PDF exported')
    } catch {
      onToast('PDF export failed', false)
    } finally {
      setExportingId(null)
    }
  }

  if (grants.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 24px',
        border: `2px dashed ${COLORS.mist}`, borderRadius: 16,
      }}>
        <PenLine size={36} style={{ color: COLORS.mist, marginBottom: 16 }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.stone, margin: '0 0 8px' }}>
          No grant proposals yet
        </p>
        <p style={{ fontSize: 13, color: COLORS.stone, margin: 0 }}>
          Switch to the New Grant tab to generate your first proposal.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['all', 'draft', 'submitted', 'awarded', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONTS.body,
              background: statusFilter === s ? COLORS.gold : COLORS.foam,
              color: statusFilter === s ? COLORS.forest : COLORS.slate,
              border: `1px solid ${statusFilter === s ? COLORS.gold : COLORS.mist}`,
            }}
          >
            {s === 'all' ? 'All' : GRANT_STATUS_LABELS[s]}
            {s !== 'all' && (
              <span style={{ marginLeft: 5, opacity: 0.7 }}>
                {grants.filter(g => g.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.map(g => {
        const daysLeft = g.application_deadline
          ? Math.ceil((new Date(g.application_deadline).getTime() - Date.now()) / 86400000)
          : null

        const urgency = daysLeft !== null
          ? daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'soon' : null
          : null

        const isExporting = exportingId === g.id

        return (
          <div key={g.id} style={{
            background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
            borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: GRANT_STATUS_COLORS[g.status].bg,
                    color: GRANT_STATUS_COLORS[g.status].text,
                  }}>
                    {GRANT_STATUS_LABELS[g.status]}
                  </span>
                  <span style={{ fontSize: 11, color: COLORS.stone }}>v{g.current_version}</span>
                </div>

                <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal, margin: '0 0 2px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.opportunity_title}
                </p>
                <p style={{ fontSize: 13, color: COLORS.stone, margin: '0 0 10px' }}>{g.funder_name}</p>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: COLORS.slate }}>
                  <span>{g.currency} {Number(g.funding_amount_requested).toLocaleString()}</span>
                  {g.application_deadline && (
                    <span style={{
                      color: urgency === 'overdue' ? COLORS.crimson
                           : urgency === 'urgent' ? '#FB923C'
                           : urgency === 'soon' ? COLORS.amber
                           : COLORS.slate,
                      fontWeight: urgency ? 600 : 400,
                    }}>
                      {urgency === 'overdue'
                        ? `Overdue by ${Math.abs(daysLeft!)} days`
                        : urgency === 'urgent' ? `${daysLeft} days left`
                        : urgency === 'soon'   ? `${daysLeft} days left`
                        : `Deadline: ${new Date(g.application_deadline).toLocaleDateString()}`}
                    </span>
                  )}
                  <span>Updated {new Date(g.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onOpen(g.id)}
                  style={{
                    padding: '7px 14px', background: COLORS.forest,
                    color: '#ffffff', border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
                  }}
                >
                  Open
                </button>

                <button
                  onClick={() => handleExportPdf(g)}
                  disabled={isExporting}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', background: 'transparent',
                    color: COLORS.sky, border: `1px solid ${COLORS.sky}40`, borderRadius: 7,
                    fontSize: 11, fontWeight: 600, cursor: isExporting ? 'not-allowed' : 'pointer',
                    fontFamily: FONTS.body,
                  }}
                >
                  <Download size={11} /> {isExporting ? 'Exporting…' : 'PDF'}
                </button>

                {userRole === 'NGO_ADMIN' && (
                  <select
                    value={g.status}
                    onChange={e => handleStatusChange(g, e.target.value as GrantStatus)}
                    style={{ ...inputStyle, padding: '5px 8px', fontSize: 11, width: 'auto' }}
                  >
                    {(['draft', 'submitted', 'awarded', 'rejected'] as GrantStatus[]).map(s => (
                      <option key={s} value={s}>{GRANT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                )}

                {userRole === 'NGO_ADMIN' && g.status === 'draft' && (
                  deletingId === g.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDelete(g.id)}
                        style={{
                          flex: 1, padding: '5px 8px', background: COLORS.crimson,
                          color: '#ffffff', border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          flex: 1, padding: '5px 8px', background: COLORS.foam,
                          color: COLORS.slate, border: `1px solid ${COLORS.mist}`, borderRadius: 6,
                          fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(g.id)}
                      style={{
                        padding: '5px 10px', background: 'transparent',
                        color: COLORS.crimson, border: `1px solid ${COLORS.crimson}40`, borderRadius: 6,
                        fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── GrantEditor ────────────────────────────────────────────────────────────────

function GrantEditor({ grant, orgId, userRole, onBack, onUpdate, onToast, userId }: {
  grant:    GrantWithVersions
  orgId:    string
  userRole: 'NGO_ADMIN' | 'NGO_STAFF'
  onBack:   () => void
  onUpdate: (g: GrantWithVersions) => void
  onToast:  (msg: string, ok?: boolean) => void
  userId:   string
}) {
  const latestVersion = grant.grant_versions
    .slice()
    .sort((a, b) => b.version_number - a.version_number)[0]

  const [sections,         setSections]         = useState<GrantSections>(latestVersion?.content ?? {})
  const [viewingVersion,   setViewingVersion]   = useState<number>(latestVersion?.version_number ?? 1)
  const [hasUnsaved,       setHasUnsaved]       = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [showVersions,     setShowVersions]     = useState(false)
  const [collapsedSects,   setCollapsedSects]   = useState<Set<string>>(new Set())
  const [regenLoading,     setRegenLoading]     = useState<string | null>(null)
  const [regenInstruct,    setRegenInstruct]    = useState<Partial<Record<string, string>>>({})
  const [exportingPdf,     setExportingPdf]     = useState(false)

  // Regenerate Full Draft state
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)
  const [regenPhase,       setRegenPhase]       = useState<StreamPhase>('idle')
  const [regenStreaming,   setRegenStreaming]    = useState<Partial<Record<string, string>>>({})
  const [regenCurrent,     setRegenCurrent]     = useState<string | null>(null)
  const regenAbortRef = useRef<AbortController | null>(null)

  const isCurrentVersion = viewingVersion === (latestVersion?.version_number ?? 1)

  function toggleCollapse(k: string) {
    setCollapsedSects(prev => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k); else n.add(k)
      return n
    })
  }

  function handleEdit(key: string, value: string) {
    setSections(prev => ({ ...prev, [key]: value }))
    setHasUnsaved(true)
  }

  function loadVersion(vn: number) {
    const v = grant.grant_versions.find(x => x.version_number === vn)
    if (!v) return
    setSections(v.content)
    setViewingVersion(vn)
    setHasUnsaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/grants/${grant.id}/versions`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: sections, generation_inputs: latestVersion?.generation_inputs ?? {} }),
      })
      if (!res.ok) { onToast('Failed to save version', false); return }
      const { grant: updated } = await res.json() as { grant: GrantWithVersions }
      onUpdate(updated)
      setViewingVersion(updated.current_version)
      setHasUnsaved(false)
      onToast('Version saved')
    } catch {
      onToast('Failed to save', false)
    } finally {
      setSaving(false)
    }
  }

  async function handleRegenSection(sectionKey: string) {
    setRegenLoading(sectionKey)
    try {
      const res = await fetch('/api/grants/regenerate-section', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          grant_id:         grant.id,
          version_number:   viewingVersion,
          section_name:     sectionKey,
          user_instruction: regenInstruct[sectionKey] || undefined,
        }),
      })
      if (!res.ok) { onToast('Regeneration failed', false); return }
      const { text } = await res.json() as { text: string }
      setSections(prev => ({ ...prev, [sectionKey]: text }))
      setHasUnsaved(true)
      setRegenInstruct(prev => { const n = { ...prev }; delete n[sectionKey]; return n })
      onToast(`${SECTION_LABELS[sectionKey as SectionKey] ?? sectionKey} regenerated`)
    } catch {
      onToast('Regeneration failed', false)
    } finally {
      setRegenLoading(null)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch(`/api/grants/${grant.id}/pdf`)
      if (!res.ok) { onToast('PDF export failed', false); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${grant.opportunity_title.replace(/[^a-z0-9]/gi, '_')}_v${grant.current_version}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      onToast('PDF exported')
    } catch {
      onToast('PDF export failed', false)
    } finally {
      setExportingPdf(false)
    }
  }

  async function handleRegenFull() {
    if (!latestVersion?.generation_inputs) return
    setShowRegenConfirm(false)
    setRegenPhase('streaming')
    setRegenStreaming({})
    setRegenCurrent(null)

    regenAbortRef.current = new AbortController()

    try {
      const res = await fetch('/api/grants/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          organization_id: orgId,
          form:            latestVersion.generation_inputs,
          stream_only:     true,
        }),
        signal: regenAbortRef.current.signal,
      })

      if (!res.ok) {
        setRegenPhase('error')
        onToast('Regeneration failed', false)
        return
      }

      const reader  = res.body?.getReader()
      if (!reader) { setRegenPhase('error'); return }

      const decoder = new TextDecoder()
      let buf = ''
      let doneReceived = false
      const accum: Partial<Record<string, string>> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const evt = JSON.parse(raw) as {
              type: string; section?: string; text?: string
              sections?: Partial<Record<string, string>>
            }
            if (evt.type === 'section_start' && evt.section) {
              const key = normalizeSection(evt.section) ?? evt.section
              setRegenCurrent(key)
              accum[key] = ''
              setRegenStreaming({ ...accum })
            } else if (evt.type === 'delta' && evt.section && evt.text) {
              const key = normalizeSection(evt.section) ?? evt.section
              accum[key] = (accum[key] ?? '') + evt.text
              setRegenStreaming({ ...accum })
            } else if (evt.type === 'done' && evt.sections) {
              doneReceived = true
              setRegenCurrent(null)
              // Save as new version
              const saveRes = await fetch(`/api/grants/${grant.id}/versions`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  content:           evt.sections,
                  generation_inputs: latestVersion.generation_inputs ?? {},
                }),
              })
              if (!saveRes.ok) {
                setRegenPhase('error')
                onToast('Failed to save regenerated draft', false)
                return
              }
              const { grant: updated } = await saveRes.json() as { grant: GrantWithVersions }
              onUpdate(updated)
              setSections(evt.sections as GrantSections)
              setViewingVersion(updated.current_version)
              setHasUnsaved(false)
              setRegenPhase('idle')
              onToast('Full draft regenerated as new version')
            } else if (evt.type === 'error') {
              doneReceived = true
              setRegenPhase('error')
              onToast('Regeneration failed', false)
            }
          } catch { /* skip */ }
        }
      }

      if (!doneReceived) {
        setRegenPhase('error')
        onToast('Stream closed before regeneration completed', false)
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        setRegenPhase('error')
        onToast('Regeneration failed', false)
      } else {
        setRegenPhase('idle')
      }
    }
  }

  // Prevent unused variable warnings
  void userId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              padding: '6px 12px', background: COLORS.foam, color: COLORS.slate,
              border: `1px solid ${COLORS.mist}`, borderRadius: 8,
              fontSize: 12, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            ← Back
          </button>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.charcoal, margin: 0 }}>
              {grant.opportunity_title}
            </p>
            <p style={{ fontSize: 12, color: COLORS.stone, margin: 0 }}>
              {grant.funder_name} · v{viewingVersion}
              {!isCurrentVersion && <span style={{ color: COLORS.amber }}> (historical)</span>}
              {hasUnsaved && <span style={{ color: COLORS.amber }}> · unsaved changes</span>}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Regenerate Full Draft */}
          <button
            onClick={() => setShowRegenConfirm(true)}
            disabled={regenPhase === 'streaming'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', background: COLORS.foam,
              color: COLORS.amber, border: `1px solid ${COLORS.amber}40`, borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              cursor: regenPhase === 'streaming' ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.body,
            }}
          >
            <Layers size={12} /> Regenerate Draft
          </button>

          {/* PDF export */}
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', background: COLORS.foam,
              color: COLORS.sky, border: `1px solid ${COLORS.sky}40`, borderRadius: 8,
              fontSize: 12, cursor: exportingPdf ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
            }}
          >
            <Download size={12} /> {exportingPdf ? 'Exporting…' : 'Export PDF'}
          </button>

          <button
            onClick={() => setShowVersions(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', background: COLORS.foam,
              color: COLORS.slate, border: `1px solid ${COLORS.mist}`, borderRadius: 8,
              fontSize: 12, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            <Clock size={12} /> History
          </button>

          {hasUnsaved && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', background: COLORS.forest,
                color: COLORS.gold, border: `1px solid ${COLORS.gold}30`, borderRadius: 8,
                fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
              }}
            >
              <Save size={12} /> {saving ? 'Saving…' : 'Save Version'}
            </button>
          )}
        </div>
      </div>

      {/* Regenerate Full Draft Confirmation Dialog */}
      {showRegenConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: COLORS.pearl, borderRadius: 16, border: `1px solid ${COLORS.mist}`,
            padding: 28, width: '100%', maxWidth: 440, boxShadow: SHADOW.modal,
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: COLORS.charcoal, fontFamily: FONTS.heading }}>
              Regenerate Full Draft?
            </h3>
            <p style={{ fontSize: 13, color: COLORS.slate, margin: '0 0 20px', lineHeight: 1.6 }}>
              This will generate a new full draft using the original inputs. The current version will be preserved in version history. A new version will be saved automatically on completion.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRegenConfirm(false)}
                style={{
                  padding: '8px 18px', background: COLORS.foam, color: COLORS.slate,
                  border: `1px solid ${COLORS.mist}`, borderRadius: 8,
                  fontSize: 13, cursor: 'pointer', fontFamily: FONTS.body,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRegenFull}
                style={{
                  padding: '8px 18px',
                  background: `linear-gradient(135deg, ${COLORS.forest}, #1A3A5C)`,
                  color: COLORS.gold, border: `1px solid ${COLORS.gold}30`, borderRadius: 8,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.body,
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerating Full Draft — streaming overlay */}
      {regenPhase === 'streaming' && (
        <div style={{
          background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
          borderRadius: 12, padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.gold, animation: 'pulse 1.2s ease-in-out infinite' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, margin: 0 }}>
                Regenerating full draft…
              </p>
            </div>
            <button
              onClick={() => { regenAbortRef.current?.abort(); setRegenPhase('idle') }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: COLORS.stone, fontSize: 12, fontFamily: FONTS.body,
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SECTION_KEYS.map(k => (
              <span key={k} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                background: regenCurrent === k ? `${COLORS.gold}20`
                          : regenStreaming[k] !== undefined ? `${COLORS.forest}80`
                          : COLORS.pearl,
                color: regenCurrent === k ? COLORS.gold
                     : regenStreaming[k] !== undefined ? '#38A169'
                     : COLORS.stone,
                border: `1px solid ${regenCurrent === k ? COLORS.gold + '60' : COLORS.mist}`,
              }}>
                {regenCurrent === k && '✦ '}
                {SECTION_LABELS[k]}
                {regenStreaming[k] !== undefined && regenCurrent !== k && ' ✓'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Regeneration error */}
      {regenPhase === 'error' && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: '#3A1A1A', border: `1px solid ${COLORS.crimson}40`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={15} style={{ color: COLORS.crimson }} />
          <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>
            Regeneration failed.{' '}
            <button
              onClick={() => setRegenPhase('idle')}
              style={{ background: 'none', border: 'none', color: COLORS.sky, cursor: 'pointer', fontSize: 13, padding: 0 }}
            >
              Dismiss
            </button>
          </p>
        </div>
      )}

      {/* Version History Panel */}
      {showVersions && (
        <div style={{
          background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
          borderRadius: 12, padding: '16px 18px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, margin: '0 0 12px' }}>
            Version History
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {grant.grant_versions
              .slice()
              .sort((a, b) => b.version_number - a.version_number)
              .map(v => (
                <div key={v.version_number} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8,
                  background: v.version_number === viewingVersion ? `${COLORS.gold}15` : COLORS.pearl,
                  border: `1px solid ${v.version_number === viewingVersion ? COLORS.gold + '40' : COLORS.mist}`,
                }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal }}>
                      Version {v.version_number}
                    </span>
                    {v.version_number === (latestVersion?.version_number ?? 1) && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.sage, fontWeight: 500 }}>Latest</span>
                    )}
                    <p style={{ fontSize: 11, color: COLORS.stone, margin: 0 }}>
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  {v.version_number !== viewingVersion && (
                    <button
                      onClick={() => loadVersion(v.version_number)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', background: COLORS.forest,
                        color: '#ffffff', border: 'none', borderRadius: 7,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Section Panels */}
      {SECTION_KEYS.map(key => {
        const collapsed = collapsedSects.has(key)
        const isRegen   = regenLoading === key
        const text      = sections[key] ?? ''

        return (
          <div key={key} style={{
            border: `1px solid ${COLORS.mist}`, borderRadius: 12, overflow: 'hidden',
            background: COLORS.pearl,
          }}>
            {/* Section header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: COLORS.foam,
              borderBottom: collapsed ? 'none' : `1px solid ${COLORS.mist}`,
              cursor: 'pointer',
            }}
              onClick={() => toggleCollapse(key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.charcoal }}>
                  {SECTION_LABELS[key]}
                </span>
                {!text && <span style={{ fontSize: 11, color: COLORS.stone }}>(empty)</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleRegenSection(key)}
                  disabled={isRegen}
                  title="Regenerate this section"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', background: 'transparent',
                    color: COLORS.sky, border: `1px solid ${COLORS.sky}40`, borderRadius: 7,
                    fontSize: 11, fontWeight: 600, cursor: isRegen ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RefreshCw size={11} style={{ animation: isRegen ? 'spin 1s linear infinite' : 'none' }} />
                  {isRegen ? 'Regenerating…' : 'Regenerate'}
                </button>
                {collapsed
                  ? <ChevronDown size={14} style={{ color: COLORS.stone }} />
                  : <ChevronUp size={14} style={{ color: COLORS.stone }} />}
              </div>
            </div>

            {/* Regen instruction input */}
            {!collapsed && (
              <div style={{ padding: '8px 16px 0', borderBottom: `1px solid ${COLORS.mist}` }}>
                <input
                  style={{ ...inputStyle, fontSize: 12, padding: '6px 10px', marginBottom: 8 }}
                  value={regenInstruct[key] ?? ''}
                  onChange={e => setRegenInstruct(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Optional: give the AI instructions before regenerating…"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}

            {/* Editable text area */}
            {!collapsed && (
              <textarea
                style={{
                  ...inputStyle, display: 'block',
                  border: 'none', borderRadius: 0, background: 'transparent',
                  minHeight: 180, resize: 'vertical',
                  lineHeight: 1.7, padding: '14px 16px',
                }}
                value={text}
                onChange={e => handleEdit(key, e.target.value)}
                placeholder={`Write the ${SECTION_LABELS[key]} section here…`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
