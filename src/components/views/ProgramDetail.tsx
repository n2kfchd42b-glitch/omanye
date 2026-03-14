'use client'

import React, { useState } from 'react'
import { ChevronLeft, Plus, MapPin, Calendar, Target, DollarSign, Users, Activity } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar }  from '@/components/atoms/ProgressBar'
import { EmptyState }   from '@/components/atoms/EmptyState'
import { FormField, Input, Textarea } from '@/components/atoms/FormField'
import { useModal, ModalFooter } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { nextId, todayISO, formatCurrency, pct } from '@/lib/utils'
import type { Program, Indicator, BudgetCategory } from '@/lib/types'

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'indicators' | 'budget' | 'team' | 'activity'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',    label: 'Overview'    },
  { id: 'indicators',  label: 'Indicators'  },
  { id: 'budget',      label: 'Budget'      },
  { id: 'team',        label: 'Team'        },
  { id: 'activity',    label: 'Activity'    },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProgramDetailProps {
  program:  Program | null
  onBack:   () => void
  onUpdate: (p: Program) => void
}

export function ProgramDetail({ program, onBack, onUpdate }: ProgramDetailProps) {
  const [tab, setTab] = useState<Tab>('overview')

  if (!program) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <EmptyState title="Program not found" description="This program may have been deleted." action={
          <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: 8, background: COLORS.moss, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Back to Programs
          </button>
        } />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={onBack}
        className="fade-up"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: COLORS.stone, cursor: 'pointer',
          marginBottom: 16, transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = COLORS.fern)}
        onMouseLeave={e => (e.currentTarget.style.color = COLORS.stone)}
      >
        <ChevronLeft size={14} /> Back to Programs
      </button>

      {/* Header card */}
      <div
        className="fade-up-1"
        style={{
          borderRadius: 16,
          background: `linear-gradient(135deg, ${COLORS.forest} 0%, ${COLORS.canopy} 100%)`,
          padding: '28px 32px',
          marginBottom: 24,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <StatusBadge status={program.status} />
            <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: '#fff', marginTop: 8 }}>
              {program.name}
            </h1>
            {program.funder && program.funder !== 'TBD' && (
              <GenericBadge label={program.funder} bg={COLORS.gold + '22'} text={COLORS.gold} style={{ marginTop: 6 }} />
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'rgba(125,212,160,0.6)', marginBottom: 4 }}>Progress</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{program.progress}%</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {program.location && program.location !== 'TBD' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.mint }}>
              <MapPin size={12} /> {program.location}
            </span>
          )}
          {program.start && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.mint }}>
              <Calendar size={12} /> {program.start} → {program.end}
            </span>
          )}
          {program.budget > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: COLORS.mint }}>
              <DollarSign size={12} /> {formatCurrency(program.budget, program.currency)}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="fade-up-2"
        style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${COLORS.mist}`, marginBottom: 24 }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? COLORS.forest : COLORS.stone,
              borderBottom: `2px solid ${tab === t.id ? COLORS.sage : 'transparent'}`,
              cursor: 'pointer', transition: 'color 0.15s',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="fade-up-3">
        {tab === 'overview'   && <OverviewTab   program={program} onUpdate={onUpdate} />}
        {tab === 'indicators' && <IndicatorsTab program={program} onUpdate={onUpdate} />}
        {tab === 'budget'     && <BudgetTab     program={program} onUpdate={onUpdate} />}
        {tab === 'team'       && <EmptyState icon={<Users size={22} />}    title="No team members assigned" description="Assign team members from the Team view." compact />}
        {tab === 'activity'   && <EmptyState icon={<Activity size={22} />} title="No activity yet"           description="Activity will appear as the program progresses." compact />}
      </div>
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ program, onUpdate }: { program: Program; onUpdate: (p: Program) => void }) {
  const { success } = useToast()
  const [progress, setProgress] = useState(program.progress)

  function handleSave() {
    onUpdate({ ...program, progress })
    success('Progress updated')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 12 }}>Objective</h3>
        {program.objective
          ? <p style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6 }}>{program.objective}</p>
          : <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>No objective set.</p>
        }
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 12 }}>Overall Progress</h3>
        <ProgressBar value={progress} showLabel style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range" min={0} max={100} value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ width: 36, fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{progress}%</span>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: COLORS.moss, color: '#fff', cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Indicators tab ────────────────────────────────────────────────────────────

function IndicatorsTab({ program, onUpdate }: { program: Program; onUpdate: (p: Program) => void }) {
  const { open } = useModal()
  const { success } = useToast()

  function openAdd() {
    open({
      title: 'Add Indicator',
      content: <AddIndicatorForm onSave={(ind) => {
        onUpdate({ ...program, indicators: [...program.indicators, ind] })
        success(`Indicator "${ind.name}" added`)
      }} />,
    })
  }

  function updateCurrent(id: number, value: number) {
    const updated = program.indicators.map(i => i.id === id ? { ...i, current: value } : i)
    onUpdate({ ...program, indicators: updated })
    success('Indicator updated')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: COLORS.moss, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Add Indicator
        </button>
      </div>

      {program.indicators.length === 0 ? (
        <EmptyState icon={<Target size={22} />} title="No indicators yet" description="Add outcome indicators to track program performance." compact />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {program.indicators.map(ind => (
            <IndicatorRow key={ind.id} indicator={ind} onUpdateCurrent={(v) => updateCurrent(ind.id, v)} />
          ))}
        </div>
      )}
    </div>
  )
}

function IndicatorRow({ indicator: ind, onUpdateCurrent }: {
  indicator: Indicator; onUpdateCurrent: (v: number) => void
}) {
  const { success } = useToast()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(ind.current)
  const progress = pct(ind.current, ind.target)

  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{ind.name}</p>
        <span style={{ fontSize: 12, color: COLORS.stone }}>{ind.current} / {ind.target} {ind.unit}</span>
      </div>
      <ProgressBar value={progress} showLabel style={{ marginBottom: 10 }} />
      {editing ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number" min={0} max={ind.target} value={val}
            onChange={e => setVal(Number(e.target.value))}
            style={{
              width: 80, padding: '5px 8px', borderRadius: 6,
              border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.forest,
            }}
          />
          <span style={{ fontSize: 12, color: COLORS.stone }}>{ind.unit}</span>
          <button
            onClick={() => { onUpdateCurrent(val); setEditing(false); success('Updated') }}
            style={{ padding: '5px 12px', borderRadius: 6, background: COLORS.sage, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Save
          </button>
          <button onClick={() => { setVal(ind.current); setEditing(false) }} style={{ fontSize: 12, color: COLORS.stone, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ fontSize: 11, color: COLORS.sage, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Update value
        </button>
      )}
    </div>
  )
}

function AddIndicatorForm({ onSave }: { onSave: (i: Indicator) => void }) {
  const { close } = useModal()
  const [name,   setName]   = useState('')
  const [target, setTarget] = useState('')
  const [unit,   setUnit]   = useState('')

  function handleSave() {
    if (!name.trim() || !target) return
    onSave({ id: nextId(), name: name.trim(), target: Number(target), current: 0, unit: unit.trim() || 'units' })
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Indicator name" required htmlFor="ai-name">
        <Input id="ai-name" placeholder="e.g. Beneficiaries reached" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Target value" required htmlFor="ai-target">
          <Input id="ai-target" type="number" min={1} placeholder="1000" value={target} onChange={e => setTarget(e.target.value)} />
        </FormField>
        <FormField label="Unit" htmlFor="ai-unit">
          <Input id="ai-unit" placeholder="e.g. people" value={unit} onChange={e => setUnit(e.target.value)} />
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || !target}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: name.trim() && target ? COLORS.moss : COLORS.mist,
            color: name.trim() && target ? '#fff' : COLORS.stone,
            cursor: name.trim() && target ? 'pointer' : 'not-allowed',
          }}
        >
          Add Indicator
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Budget tab ────────────────────────────────────────────────────────────────

function BudgetTab({ program, onUpdate }: { program: Program; onUpdate: (p: Program) => void }) {
  const { open } = useModal()
  const { success } = useToast()
  const totalAllocated = program.budgetCategories.reduce((s, c) => s + c.allocated, 0)
  const totalSpent     = program.budgetCategories.reduce((s, c) => s + c.spent, 0)

  function openAdd() {
    open({
      title: 'Add Budget Category',
      content: <AddBudgetForm onSave={(cat) => {
        onUpdate({ ...program, budgetCategories: [...program.budgetCategories, cat] })
        success(`Category "${cat.name}" added`)
      }} />,
    })
  }

  return (
    <div>
      {program.budget > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          <StatPill label="Total Budget"  value={formatCurrency(program.budget, program.currency)} color={COLORS.forest} />
          <StatPill label="Allocated"     value={formatCurrency(totalAllocated, program.currency)} color={COLORS.fern}   />
          <StatPill label="Spent"         value={formatCurrency(totalSpent, program.currency)}     color={COLORS.amber}  />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: COLORS.moss, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Add Category
        </button>
      </div>

      {program.budgetCategories.length === 0 ? (
        <EmptyState icon={<DollarSign size={22} />} title="No budget categories yet" description="Break down your program budget into categories." compact />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.snow }}>
                {['Category', 'Allocated', 'Spent', 'Remaining', 'Utilization'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: COLORS.stone, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {program.budgetCategories.map((cat, i) => (
                <tr key={cat.id} style={{ borderTop: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: COLORS.forest }}>{cat.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate }}>{formatCurrency(cat.allocated, program.currency)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate }}>{formatCurrency(cat.spent, program.currency)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate }}>{formatCurrency(cat.allocated - cat.spent, program.currency)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <ProgressBar value={pct(cat.spent, cat.allocated)} showLabel />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <p style={{ fontSize: 11, color: COLORS.stone, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 17, fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function AddBudgetForm({ onSave }: { onSave: (c: BudgetCategory) => void }) {
  const { close } = useModal()
  const [name,      setName]      = useState('')
  const [allocated, setAllocated] = useState('')
  const [spent,     setSpent]     = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Category name" required htmlFor="bc-name">
        <Input id="bc-name" placeholder="e.g. Staff costs" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Allocated" required htmlFor="bc-alloc">
          <Input id="bc-alloc" type="number" min={0} placeholder="0" value={allocated} onChange={e => setAllocated(e.target.value)} />
        </FormField>
        <FormField label="Spent" htmlFor="bc-spent">
          <Input id="bc-spent" type="number" min={0} placeholder="0" value={spent} onChange={e => setSpent(e.target.value)} />
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={() => { if (!name.trim() || !allocated) return; onSave({ id: nextId(), name: name.trim(), allocated: Number(allocated), spent: Number(spent) || 0 }); close() }}
          disabled={!name.trim() || !allocated}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: name.trim() && allocated ? COLORS.moss : COLORS.mist,
            color: name.trim() && allocated ? '#fff' : COLORS.stone,
            cursor: name.trim() && allocated ? 'pointer' : 'not-allowed',
          }}
        >
          Add Category
        </button>
      </ModalFooter>
    </div>
  )
}
