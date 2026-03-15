'use client'

import React, { useState, useOptimistic, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Plus, Star, Eye, EyeOff, TrendingUp, Calendar,
  MapPin, Link2, Tag, Edit2, Trash2, Loader2, Save, Globe,
  Lock, BarChart3, FileText, Users, Settings, ChevronDown, Wallet,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { formatCurrency, formatDate, pct } from '@/lib/utils'
import {
  updateProgram,
  updateProgramVisibility,
  deleteProgram,
} from '@/app/actions/programs'
import {
  createIndicator,
  updateIndicator,
  deleteIndicator,
  toggleIndicatorVisibility,
  toggleKeyIndicator,
  submitIndicatorUpdate,
  createProgramUpdate,
  toggleUpdateDonorVisibility,
} from '@/app/actions/indicators'
import BudgetTab from './BudgetTab'
import type { BudgetCategory, Expenditure, BudgetAmendment, FundingTranche, BudgetSummary, CategorySpend } from '@/lib/budget'
import type { Program, Indicator, ProgramUpdate, IndicatorFrequency, UpdateType, ProgramVisibility } from '@/lib/programs'
import {
  PROGRAM_STATUS_LABELS,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
  FREQUENCY_LABELS,
  UPDATE_TYPE_LABELS,
  UPDATE_TYPE_COLORS,
  INDICATOR_FREQUENCIES,
  UPDATE_TYPES,
} from '@/lib/programs'
import type { OmanyeRole, ProgramStatusDB } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  program:              Program
  indicators:           Indicator[]
  updates:              ProgramUpdate[]
  userRole:             OmanyeRole
  orgSlug:              string
  currentUserId:        string
  initialCategories:    BudgetCategory[]
  initialExpenditures:  Expenditure[]
  initialSummary:       BudgetSummary | null
  initialCategorySpend: CategorySpend[]
  initialTranches:      FundingTranche[]
  initialAmendments:    BudgetAmendment[]
}

type TabId = 'overview' | 'indicators' | 'updates' | 'budget' | 'settings'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Overview',   icon: <BarChart3 size={14} /> },
  { id: 'indicators', label: 'Indicators', icon: <TrendingUp size={14} /> },
  { id: 'updates',    label: 'Updates',    icon: <FileText size={14} /> },
  { id: 'budget',     label: 'Budget',     icon: <Wallet size={14} /> },
  { id: 'settings',   label: 'Settings',   icon: <Settings size={14} /> },
]

const CATEGORY_OPTIONS = [
  { value: 'Output',  label: 'Output' },
  { value: 'Outcome', label: 'Outcome' },
  { value: 'Impact',  label: 'Impact' },
  { value: 'Input',   label: 'Input' },
  { value: 'Process', label: 'Process' },
]

const FREQ_OPTIONS = INDICATOR_FREQUENCIES.map(f => ({ value: f, label: FREQUENCY_LABELS[f] }))
const UPDATE_TYPE_OPTIONS = UPDATE_TYPES.map(t => ({ value: t, label: UPDATE_TYPE_LABELS[t] }))

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProgramDetailClient({
  program: initialProgram,
  indicators: initialIndicators,
  updates: initialUpdates,
  userRole,
  orgSlug,
  currentUserId,
  initialCategories,
  initialExpenditures,
  initialSummary,
  initialCategorySpend,
  initialTranches,
  initialAmendments,
}: Props) {
  const router = useRouter()
  const [tab, setTab]                = useState<TabId>('overview')
  const [program, setProgram]        = useState(initialProgram)
  const [indicators, setIndicators]  = useState(initialIndicators)
  const [updates, setUpdates]        = useState(initialUpdates)

  const isAdmin  = userRole === 'NGO_ADMIN'
  const canEdit  = userRole === 'NGO_ADMIN' || userRole === 'NGO_STAFF'

  // ── Realtime: live indicator value updates ──────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('indicator-updates-' + initialProgram.id)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'indicator_updates',
          filter: `program_id=eq.${initialProgram.id}`,
        },
        (payload) => {
          const update = payload.new as { indicator_id: string; new_value: number }
          setIndicators(prev =>
            prev.map(ind =>
              ind.id === update.indicator_id
                ? { ...ind, current_value: update.new_value }
                : ind
            )
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialProgram.id])

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 4px' }}>
      {/* Back */}
      <button
        onClick={() => router.push(`/org/${orgSlug}/programs`)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          color: COLORS.slate, cursor: 'pointer', background: 'none',
          border: 'none', padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} /> Back to Programs
      </button>

      {/* Program hero header */}
      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{
          height:     160,
          background: program.cover_image_url
            ? `url(${program.cover_image_url}) center/cover`
            : `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.moss} 100%)`,
          position:  'relative',
        }}>
          {!program.cover_image_url && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
              <svg viewBox="0 0 80 80" width={80} fill="none">
                <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="26" stroke="white" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="12" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
          )}
          <div style={{ position: 'absolute', top: 14, left: 18, display: 'flex', gap: 8 }}>
            <StatusBadge status={program.status.toLowerCase()} />
            <span style={{
              padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 600,
              background: 'rgba(0,0,0,0.4)', color: '#fff',
            }}>
              {VISIBILITY_LABELS[program.visibility]}
            </span>
          </div>
        </div>
        <div style={{ padding: '20px 24px 22px' }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, marginBottom: 6 }}>
            {program.name}
          </h1>
          {program.objective && (
            <p style={{ fontSize: 14, color: COLORS.slate, marginBottom: 12, lineHeight: 1.6 }}>{program.objective}</p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: COLORS.stone }}>
            {program.primary_funder && (
              <GenericBadge label={program.primary_funder} bg={COLORS.gold + '22'} text={COLORS.gold} />
            )}
            {(program.location_country || program.location_region) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} />
                {[program.location_region, program.location_country].filter(Boolean).join(', ')}
              </span>
            )}
            {program.start_date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} />
                {formatDate(program.start_date)} – {program.end_date ? formatDate(program.end_date) : 'Ongoing'}
              </span>
            )}
            {program.total_budget && (
              <span style={{ fontWeight: 700, color: COLORS.charcoal }}>
                {formatCurrency(program.total_budget, program.currency)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: `1px solid ${COLORS.mist}` }}>
        {TABS.map(t => (
          t.id === 'settings' && !isAdmin ? null : (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        6,
                padding:    '10px 16px',
                fontSize:   13,
                fontWeight: tab === t.id ? 700 : 500,
                color:      tab === t.id ? COLORS.fern : COLORS.slate,
                background: 'none',
                border:     'none',
                borderBottom: `2px solid ${tab === t.id ? COLORS.fern : 'transparent'}`,
                cursor:     'pointer',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          )
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab program={program} />
      )}
      {tab === 'indicators' && (
        <IndicatorsTab
          programId={program.id}
          indicators={indicators}
          setIndicators={setIndicators}
          canEdit={canEdit}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      )}
      {tab === 'updates' && (
        <UpdatesTab
          programId={program.id}
          updates={updates}
          setUpdates={setUpdates}
          canEdit={canEdit}
          isAdmin={isAdmin}
        />
      )}
      {tab === 'budget' && (
        <BudgetTab
          programId={program.id}
          organizationId={program.organization_id}
          currency={program.currency}
          totalBudget={program.total_budget ?? null}
          userRole={userRole}
          currentUserId={currentUserId}
          initialCategories={initialCategories}
          initialCategorySpend={initialCategorySpend}
          initialExpenditures={initialExpenditures}
          initialSummary={initialSummary}
          initialTranches={initialTranches}
          initialAmendments={initialAmendments}
        />
      )}
      {tab === 'settings' && isAdmin && (
        <SettingsTab
          program={program}
          setProgram={setProgram}
          orgSlug={orgSlug}
        />
      )}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ program: p }: { program: Program }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Description */}
      {p.description && (
        <div className="card" style={{ padding: '20px 22px', gridColumn: '1 / -1' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 10 }}>
            About this program
          </h3>
          <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7 }}>{p.description}</p>
        </div>
      )}

      {/* Budget card */}
      {p.total_budget && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Budget
          </h3>
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.forest, fontFamily: FONTS.heading, marginBottom: 2 }}>
            {formatCurrency(p.total_budget, p.currency)}
          </div>
          <div style={{ fontSize: 11, color: COLORS.stone }}>{p.currency}</div>
        </div>
      )}

      {/* Timeline */}
      {(p.start_date || p.end_date) && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.start_date && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: COLORS.stone }}>Start</span>
                <span style={{ color: COLORS.charcoal, fontWeight: 600 }}>{formatDate(p.start_date)}</span>
              </div>
            )}
            {p.end_date && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: COLORS.stone }}>End</span>
                <span style={{ color: COLORS.charcoal, fontWeight: 600 }}>{formatDate(p.end_date)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {p.tags?.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Tags
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {p.tags.map(t => (
              <span key={t} style={{
                padding: '4px 10px', borderRadius: 14, fontSize: 12,
                background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
                color: COLORS.slate,
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Logframe link */}
      {p.logframe_url && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 13, fontWeight: 700, color: COLORS.stone, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Logframe
          </h3>
          <a
            href={p.logframe_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: COLORS.fern, textDecoration: 'none', fontWeight: 600 }}
          >
            <Link2 size={13} /> View Logframe Document
          </a>
        </div>
      )}
    </div>
  )
}

// ── Indicators Tab ────────────────────────────────────────────────────────────

interface IndicatorsTabProps {
  programId:     string
  indicators:    Indicator[]
  setIndicators: React.Dispatch<React.SetStateAction<Indicator[]>>
  canEdit:       boolean
  isAdmin:       boolean
  currentUserId: string
}

function IndicatorsTab({ programId, indicators, setIndicators, canEdit, isAdmin }: IndicatorsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [updateModal, setUpdateModal]       = useState<Indicator | null>(null)

  // Group by category
  const grouped: Record<string, Indicator[]> = {}
  for (const ind of indicators) {
    const cat = ind.category ?? 'Other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(ind)
  }
  const categoryOrder = ['Output', 'Outcome', 'Impact', 'Input', 'Process', 'Other']
  const sortedCategories = [...new Set([...categoryOrder.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !categoryOrder.includes(c))])]

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: COLORS.moss, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            }}
          >
            <Plus size={14} /> Add Indicator
          </button>
        </div>
      )}

      {showCreateForm && (
        <CreateIndicatorForm
          programId={programId}
          onSave={ind => { setIndicators(is => [...is, ind]); setShowCreateForm(false) }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {indicators.length === 0 && !showCreateForm ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon={<TrendingUp size={24} />}
            title="No indicators yet"
            description="Add indicators to track program performance against targets."
          />
        </div>
      ) : (
        sortedCategories.map(cat => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <h3 style={{
              fontSize: 11, fontWeight: 800, color: COLORS.stone, textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 12,
            }}>
              {cat} · {grouped[cat]?.length ?? 0}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(grouped[cat] ?? []).map(ind => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  isAdmin={isAdmin}
                  canEdit={canEdit}
                  onUpdate={ind => {
                    setUpdateModal(ind)
                  }}
                  onToggleKey={async (id, val) => {
                    const res = await toggleKeyIndicator(id, val)
                    if (!res.error && res.data) setIndicators(is => is.map(i => i.id === id ? res.data! : i))
                  }}
                  onToggleVisibility={async (id, val) => {
                    const res = await toggleIndicatorVisibility(id, val)
                    if (!res.error && res.data) setIndicators(is => is.map(i => i.id === id ? res.data! : i))
                  }}
                  onDelete={async id => {
                    const res = await deleteIndicator(id)
                    if (!res.error) setIndicators(is => is.filter(i => i.id !== id))
                  }}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {updateModal && (
        <UpdateValueModal
          indicator={updateModal}
          onClose={() => setUpdateModal(null)}
          onSave={async (indId, payload) => {
            const res = await submitIndicatorUpdate(indId, payload)
            if (!res.error) {
              setIndicators(is => is.map(i =>
                i.id === indId ? { ...i, current_value: payload.new_value } : i
              ))
              setUpdateModal(null)
            }
            return res.error
          }}
        />
      )}
    </div>
  )
}

function IndicatorCard({
  indicator: ind, isAdmin, canEdit, onUpdate, onToggleKey, onToggleVisibility, onDelete,
}: {
  indicator:          Indicator
  isAdmin:            boolean
  canEdit:            boolean
  onUpdate:           (ind: Indicator) => void
  onToggleKey:        (id: string, val: boolean) => void
  onToggleVisibility: (id: string, val: boolean) => void
  onDelete:           (id: string) => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  const progress = pct(ind.current_value, ind.target_value ?? 0)

  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {ind.is_key_indicator && (
              <Star size={12} fill={COLORS.gold} color={COLORS.gold} />
            )}
            <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest }}>{ind.name}</h4>
          </div>
          {ind.description && (
            <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 6, lineHeight: 1.5 }}>{ind.description}</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ind.frequency && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: COLORS.foam, color: COLORS.slate, border: `1px solid ${COLORS.mist}` }}>
                {FREQUENCY_LABELS[ind.frequency]}
              </span>
            )}
            {ind.data_source && (
              <span style={{ fontSize: 10, color: COLORS.stone }}>· {ind.data_source}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isAdmin && (
            <>
              <button
                onClick={() => onToggleKey(ind.id, !ind.is_key_indicator)}
                title={ind.is_key_indicator ? 'Remove key indicator' : 'Mark as key indicator'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Star size={14} fill={ind.is_key_indicator ? COLORS.gold : 'none'} color={ind.is_key_indicator ? COLORS.gold : COLORS.stone} />
              </button>
              <button
                onClick={() => onToggleVisibility(ind.id, !ind.visible_to_donors)}
                title={ind.visible_to_donors ? 'Hide from donors' : 'Show to donors'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                {ind.visible_to_donors
                  ? <Eye size={14} color={COLORS.fern} />
                  : <EyeOff size={14} color={COLORS.stone} />}
              </button>
              <button
                onClick={() => onDelete(ind.id)}
                title="Delete indicator"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <Trash2 size={13} color={COLORS.stone} />
              </button>
            </>
          )}
          {canEdit && (
            <button
              onClick={() => onUpdate(ind)}
              style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: COLORS.fern, color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              Update Value
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span style={{ color: COLORS.stone }}>
            {ind.current_value.toLocaleString()}{ind.unit ? ` ${ind.unit}` : ''} current
          </span>
          <span style={{ color: COLORS.charcoal, fontWeight: 700 }}>
            {ind.target_value ? `${progress}% of ${ind.target_value.toLocaleString()}` : 'No target set'}
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </div>
  )
}

// ── Create Indicator Form ─────────────────────────────────────────────────────

function CreateIndicatorForm({
  programId, onSave, onCancel,
}: {
  programId: string
  onSave:    (ind: Indicator) => void
  onCancel:  () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [name,       setName]       = useState('')
  const [desc,       setDesc]       = useState('')
  const [category,   setCategory]   = useState('Output')
  const [unit,       setUnit]       = useState('')
  const [target,     setTarget]     = useState('')
  const [baseline,   setBaseline]   = useState('')
  const [frequency,  setFrequency]  = useState<IndicatorFrequency>('MONTHLY')
  const [source,     setSource]     = useState('')
  const [error,      setError]      = useState<string | null>(null)

  function handleSave() {
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await createIndicator({
        program_id:  programId,
        name:        name.trim(),
        description: desc.trim() || undefined,
        category,
        unit:        unit.trim() || undefined,
        target_value: target ? parseFloat(target) : undefined,
        baseline_value: baseline ? parseFloat(baseline) : undefined,
        frequency,
        data_source: source.trim() || undefined,
      })
      if (res.error) { setError(res.error); return }
      onSave(res.data!)
    })
  }

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20, border: `1px solid ${COLORS.fern}40` }}>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 16 }}>
        New Indicator
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label="Name" required htmlFor="ni-name">
            <Input id="ni-name" placeholder="e.g. Children Screened for Malnutrition" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </FormField>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <FormField label="Description" htmlFor="ni-desc">
            <Input id="ni-desc" placeholder="Brief description…" value={desc} onChange={e => setDesc(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Category" htmlFor="ni-cat">
          <Select id="ni-cat" options={CATEGORY_OPTIONS} value={category} onChange={e => setCategory(e.target.value)} />
        </FormField>
        <FormField label="Unit" htmlFor="ni-unit">
          <Input id="ni-unit" placeholder="e.g. children, %, households" value={unit} onChange={e => setUnit(e.target.value)} />
        </FormField>
        <FormField label="Target value" htmlFor="ni-target">
          <Input id="ni-target" type="number" min={0} placeholder="0" value={target} onChange={e => setTarget(e.target.value)} />
        </FormField>
        <FormField label="Baseline value" htmlFor="ni-baseline">
          <Input id="ni-baseline" type="number" min={0} placeholder="0" value={baseline} onChange={e => setBaseline(e.target.value)} />
        </FormField>
        <FormField label="Reporting frequency" htmlFor="ni-freq">
          <Select id="ni-freq" options={FREQ_OPTIONS} value={frequency} onChange={e => setFrequency(e.target.value as IndicatorFrequency)} />
        </FormField>
        <FormField label="Data source" htmlFor="ni-src">
          <Input id="ni-src" placeholder="e.g. KoBoToolbox, Monthly report" value={source} onChange={e => setSource(e.target.value)} />
        </FormField>
      </div>
      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, background: '#fff', border: `1px solid ${COLORS.mist}`, cursor: 'pointer', color: COLORS.slate }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: name.trim() && !isPending ? COLORS.moss : COLORS.mist,
            color: name.trim() && !isPending ? '#fff' : COLORS.stone,
            border: 'none', cursor: name.trim() && !isPending ? 'pointer' : 'not-allowed',
          }}
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save Indicator
        </button>
      </div>
    </div>
  )
}

// ── Update Value Modal ────────────────────────────────────────────────────────

function UpdateValueModal({
  indicator, onClose, onSave,
}: {
  indicator: Indicator
  onClose:   () => void
  onSave:    (id: string, payload: { new_value: number; reporting_period_start?: string; reporting_period_end?: string; notes?: string; source?: string }) => Promise<string | null>
}) {
  const [newValue, setNewValue]   = useState(String(indicator.current_value))
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd]   = useState('')
  const [notes, setNotes]         = useState('')
  const [source, setSource]       = useState(indicator.data_source ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError]         = useState<string | null>(null)

  function handleSubmit() {
    if (!newValue) return
    setError(null)
    startTransition(async () => {
      const err = await onSave(indicator.id, {
        new_value:              parseFloat(newValue),
        reporting_period_start: periodStart || undefined,
        reporting_period_end:   periodEnd   || undefined,
        notes:                  notes.trim() || undefined,
        source:                 source.trim() || undefined,
      })
      if (err) setError(err)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,43,30,0.55)',
    }} onClick={onClose}>
      <div
        className="card"
        style={{ width: 480, maxWidth: '95vw', padding: '24px 26px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
          Update Value
        </h3>
        <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 20 }}>
          {indicator.name}
          {indicator.unit ? ` (${indicator.unit})` : ''}
          {' · '}Current: <strong>{indicator.current_value.toLocaleString()}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="New value" required htmlFor="uv-val">
            <Input id="uv-val" type="number" value={newValue} onChange={e => setNewValue(e.target.value)} autoFocus />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Period start" htmlFor="uv-start">
              <Input id="uv-start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </FormField>
            <FormField label="Period end" htmlFor="uv-end">
              <Input id="uv-end" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Notes" htmlFor="uv-notes">
            <Textarea id="uv-notes" rows={3} placeholder="Context for this update…" value={notes} onChange={e => setNotes(e.target.value)} />
          </FormField>
          <FormField label="Source" htmlFor="uv-source">
            <Input id="uv-source" placeholder="e.g. KoBoToolbox, Monthly field report" value={source} onChange={e => setSource(e.target.value)} />
          </FormField>
        </div>
        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, background: '#fff', border: `1px solid ${COLORS.mist}`, cursor: 'pointer', color: COLORS.slate }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!newValue || isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              background: newValue && !isPending ? COLORS.moss : COLORS.mist,
              color: newValue && !isPending ? '#fff' : COLORS.stone,
              border: 'none', cursor: newValue && !isPending ? 'pointer' : 'not-allowed',
            }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : null}
            Submit Update
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Updates Tab ───────────────────────────────────────────────────────────────

interface UpdatesTabProps {
  programId:  string
  updates:    ProgramUpdate[]
  setUpdates: React.Dispatch<React.SetStateAction<ProgramUpdate[]>>
  canEdit:    boolean
  isAdmin:    boolean
}

function UpdatesTab({ programId, updates, setUpdates, canEdit, isAdmin }: UpdatesTabProps) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: COLORS.moss, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
            }}
          >
            <Plus size={14} /> New Update
          </button>
        </div>
      )}

      {showCreate && (
        <CreateUpdateForm
          programId={programId}
          onSave={u => { setUpdates(us => [u, ...us]); setShowCreate(false) }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {updates.length === 0 && !showCreate ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState icon={<FileText size={24} />} title="No updates yet" description="Post a progress update, milestone, or field dispatch." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {updates.map(u => (
            <UpdateCard
              key={u.id}
              update={u}
              isAdmin={isAdmin}
              onToggleVisibility={async (id, val) => {
                const res = await toggleUpdateDonorVisibility(id, val)
                if (!res.error) setUpdates(us => us.map(x => x.id === id ? { ...x, visible_to_donors: val } : x))
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UpdateCard({
  update: u, isAdmin, onToggleVisibility,
}: {
  update:             ProgramUpdate
  isAdmin:            boolean
  onToggleVisibility: (id: string, val: boolean) => void
}) {
  const typeColors = UPDATE_TYPE_COLORS[u.update_type]

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
            background: typeColors.bg, color: typeColors.text,
          }}>
            {UPDATE_TYPE_LABELS[u.update_type]}
          </span>
          <span style={{ fontSize: 12, color: COLORS.stone }}>
            {u.published_at ? formatDate(u.published_at) : ''}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => onToggleVisibility(u.id, !u.visible_to_donors)}
            title={u.visible_to_donors ? 'Hide from donors' : 'Show to donors'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {u.visible_to_donors
              ? <Eye size={14} color={COLORS.fern} />
              : <EyeOff size={14} color={COLORS.stone} />}
          </button>
        )}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>{u.title}</h4>
      {u.body && (
        <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{u.body}</p>
      )}
      {u.attachments?.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {u.attachments.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 7, background: COLORS.foam,
              border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.fern,
              textDecoration: 'none', fontWeight: 500,
            }}>
              📎 {a.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateUpdateForm({
  programId, onSave, onCancel,
}: {
  programId: string
  onSave:    (u: ProgramUpdate) => void
  onCancel:  () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [type,       setType]       = useState<UpdateType>('PROGRESS')
  const [visible,    setVisible]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  function handleSave() {
    if (!title.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await createProgramUpdate(programId, {
        title:              title.trim(),
        body:               body.trim() || undefined,
        update_type:        type,
        visible_to_donors:  visible,
        published_at:       new Date().toISOString(),
      })
      if (res.error) { setError(res.error); return }
      onSave(res.data!)
    })
  }

  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 20, border: `1px solid ${COLORS.fern}40` }}>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 16 }}>New Update</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Title" required htmlFor="nu-title">
          <Input id="nu-title" placeholder="Update title…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </FormField>
        <FormField label="Type" htmlFor="nu-type">
          <Select id="nu-type" options={UPDATE_TYPE_OPTIONS} value={type} onChange={e => setType(e.target.value as UpdateType)} />
        </FormField>
        <FormField label="Body (markdown supported)" htmlFor="nu-body">
          <Textarea id="nu-body" rows={5} placeholder="Write your update…" value={body} onChange={e => setBody(e.target.value)} />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: COLORS.charcoal }}>
          <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} />
          Visible to donors
        </label>
      </div>
      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, background: '#fff', border: `1px solid ${COLORS.mist}`, cursor: 'pointer', color: COLORS.slate }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: title.trim() && !isPending ? COLORS.moss : COLORS.mist,
            color: title.trim() && !isPending ? '#fff' : COLORS.stone,
            border: 'none', cursor: title.trim() && !isPending ? 'pointer' : 'not-allowed',
          }}
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Post Update
        </button>
      </div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({
  program, setProgram, orgSlug,
}: {
  program:    Program
  setProgram: React.Dispatch<React.SetStateAction<Program>>
  orgSlug:    string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name,       setName]       = useState(program.name)
  const [objective,  setObjective]  = useState(program.objective ?? '')
  const [description,setDescription]= useState(program.description ?? '')
  const [status,     setStatus]     = useState(program.status)
  const [funder,     setFunder]     = useState(program.primary_funder ?? '')
  const [country,    setCountry]    = useState(program.location_country ?? '')
  const [region,     setRegion]     = useState(program.location_region ?? '')
  const [budget,     setBudget]     = useState(String(program.total_budget ?? ''))
  const [currency,   setCurrency]   = useState(program.currency)
  const [visibility, setVisibility] = useState<ProgramVisibility>(program.visibility)
  const [error,      setError]      = useState<string | null>(null)
  const [saved,      setSaved]      = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const STATUS_OPTIONS = [
    { value: 'PLANNING',  label: 'Planning' },
    { value: 'ACTIVE',    label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ]

  const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD' }, { value: 'GHS', label: 'GHS' },
    { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' },
    { value: 'KES', label: 'KES' }, { value: 'NGN', label: 'NGN' },
  ]

  function handleSave() {
    setError(null); setSaved(false)
    startTransition(async () => {
      const res = await updateProgram(program.id, {
        name:             name.trim(),
        status:           status as ProgramStatusDB,
        description:      description.trim() || null,
        objective:        objective.trim()   || null,
        primary_funder:   funder.trim()      || null,
        location_country: country.trim()     || null,
        location_region:  region.trim()      || null,
        total_budget:     budget ? parseFloat(budget) : null,
        currency,
        visibility,
      })
      if (res.error) { setError(res.error); return }
      setProgram(res.data!)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteProgram(program.id)
      if (res.error) { setError(res.error); return }
      router.push(`/org/${orgSlug}/programs`)
    })
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ padding: '24px 26px', marginBottom: 24 }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 20 }}>
          Program Settings
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Program name" required htmlFor="ps-name">
            <Input id="ps-name" value={name} onChange={e => setName(e.target.value)} />
          </FormField>
          <FormField label="Status" htmlFor="ps-status">
            <Select id="ps-status" options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value as ProgramStatusDB)} />
          </FormField>
          <FormField label="Objective" htmlFor="ps-obj">
            <Input id="ps-obj" value={objective} onChange={e => setObjective(e.target.value)} />
          </FormField>
          <FormField label="Description" htmlFor="ps-desc">
            <Textarea id="ps-desc" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </FormField>
          <FormField label="Primary funder" htmlFor="ps-funder">
            <Input id="ps-funder" value={funder} onChange={e => setFunder(e.target.value)} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Country" htmlFor="ps-country">
              <Input id="ps-country" value={country} onChange={e => setCountry(e.target.value)} />
            </FormField>
            <FormField label="Region" htmlFor="ps-region">
              <Input id="ps-region" value={region} onChange={e => setRegion(e.target.value)} />
            </FormField>
            <FormField label="Total budget" htmlFor="ps-budget">
              <Input id="ps-budget" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
            </FormField>
            <FormField label="Currency" htmlFor="ps-currency">
              <Select id="ps-currency" options={CURRENCY_OPTIONS} value={currency} onChange={e => setCurrency(e.target.value)} />
            </FormField>
          </div>

          {/* Visibility */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>Visibility</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['PRIVATE', 'DONOR_ONLY', 'PUBLIC'] as ProgramVisibility[]).map(v => (
                <label key={v} onClick={() => setVisibility(v)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${visibility === v ? COLORS.moss : COLORS.mist}`,
                  background: visibility === v ? COLORS.foam : '#fff',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: `2px solid ${visibility === v ? COLORS.moss : COLORS.mist}`,
                    background: visibility === v ? COLORS.moss : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {visibility === v && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{VISIBILITY_LABELS[v]}</span>
                    <span style={{ fontSize: 11, color: COLORS.stone, marginLeft: 8 }}>{VISIBILITY_DESCRIPTIONS[v]}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <div style={{ marginTop: 14, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
        )}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {saved && <span style={{ fontSize: 12, color: COLORS.fern, alignSelf: 'center' }}>Saved!</span>}
          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8,
              background: isPending ? COLORS.mist : COLORS.moss,
              color: isPending ? COLORS.stone : '#fff',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '20px 22px', border: '1px solid #FECACA' }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Danger Zone</h3>
        <p style={{ fontSize: 12, color: COLORS.slate, marginBottom: 14, lineHeight: 1.5 }}>
          Deleting this program will archive all its indicators and updates. This action can be reversed by support.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            style={{ padding: '7px 16px', borderRadius: 7, background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Delete Program
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>Are you sure?</span>
            <button onClick={handleDelete} disabled={isPending} style={{ padding: '7px 14px', borderRadius: 7, background: '#DC2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {isPending ? 'Deleting…' : 'Yes, Delete'}
            </button>
            <button onClick={() => setShowDelete(false)} style={{ padding: '7px 12px', borderRadius: 7, background: '#fff', border: `1px solid ${COLORS.mist}`, fontSize: 12, cursor: 'pointer', color: COLORS.slate }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
