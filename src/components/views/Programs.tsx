'use client'

import React, { useState } from 'react'
import { Plus, FolderOpen, MapPin, Calendar } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar }   from '@/components/atoms/ProgressBar'
import { EmptyState }    from '@/components/atoms/EmptyState'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { useModal }      from '@/components/Modal'
import { ModalFooter }   from '@/components/Modal'
import { useToast }      from '@/components/Toast'
import { nextId, todayISO, formatCurrency } from '@/lib/utils'
import type { Program, ProgramStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: ProgramStatus; label: string }[] = [
  { value: 'planning',  label: 'Planning'  },
  { value: 'active',    label: 'Active'    },
  { value: 'paused',    label: 'Paused'    },
  { value: 'completed', label: 'Completed' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'GHS', label: 'GHS' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'KES', label: 'KES' },
]

const STATUS_FILTERS: (ProgramStatus | 'all')[] = ['all', 'active', 'planning', 'paused', 'completed']

// ── NewProgramForm ────────────────────────────────────────────────────────────

interface NewProgramFormProps {
  onSave: (p: Program) => void
}

function NewProgramForm({ onSave }: NewProgramFormProps) {
  const { close } = useModal()
  const [name,     setName]     = useState('')
  const [funder,   setFunder]   = useState('')
  const [location, setLocation] = useState('')
  const [budget,   setBudget]   = useState('')
  const [currency, setCurrency] = useState('USD')
  const [start,    setStart]    = useState(todayISO())
  const [end,      setEnd]      = useState('')
  const [status,   setStatus]   = useState<ProgramStatus>('planning')
  const [objective,setObjective]= useState('')

  function handleSave() {
    if (!name.trim()) return
    const prog: Program = {
      id: nextId(),
      name: name.trim(),
      funder: funder.trim() || 'TBD',
      location: location.trim() || 'TBD',
      budget: parseFloat(budget) || 0,
      currency,
      spent: 0,
      start,
      end: end || todayISO(),
      status,
      progress: 0,
      objective: objective.trim(),
      indicators: [],
      budgetCategories: [],
      logframe: [],
      createdAt: todayISO(),
    }
    onSave(prog)
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Program name" required htmlFor="np-name">
        <Input id="np-name" placeholder="e.g. Clean Water Initiative" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <FormField label="Funder / Donor" htmlFor="np-funder">
        <Input id="np-funder" placeholder="e.g. USAID, GIZ" value={funder} onChange={e => setFunder(e.target.value)} />
      </FormField>
      <FormField label="Location" htmlFor="np-location">
        <Input id="np-location" placeholder="e.g. Northern Region, Ghana" value={location} onChange={e => setLocation(e.target.value)} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
        <FormField label="Budget" htmlFor="np-budget">
          <Input id="np-budget" type="number" min={0} placeholder="0" value={budget} onChange={e => setBudget(e.target.value)} />
        </FormField>
        <FormField label="Currency" htmlFor="np-currency">
          <Select id="np-currency" options={CURRENCY_OPTIONS} value={currency} onChange={e => setCurrency(e.target.value)} />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Start date" htmlFor="np-start">
          <Input id="np-start" type="date" value={start} onChange={e => setStart(e.target.value)} />
        </FormField>
        <FormField label="End date" htmlFor="np-end">
          <Input id="np-end" type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Status" htmlFor="np-status">
        <Select id="np-status" options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value as ProgramStatus)} />
      </FormField>
      <FormField label="Objective" htmlFor="np-obj">
        <Textarea id="np-obj" placeholder="What does this program aim to achieve?" rows={3} value={objective} onChange={e => setObjective(e.target.value)} />
      </FormField>
      <ModalFooter>
        <button
          onClick={close}
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
          Create Program
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Programs view ─────────────────────────────────────────────────────────────

interface ProgramsProps {
  programs:    Program[]
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>
  onSelect:    (id: number) => void
}

export function Programs({ programs, setPrograms, onSelect }: ProgramsProps) {
  const { open }    = useModal()
  const { success } = useToast()
  const [filter, setFilter] = useState<ProgramStatus | 'all'>('all')

  function openCreate() {
    open({
      title: 'New Program',
      content: (
        <NewProgramForm
          onSave={(prog) => {
            setPrograms(ps => [...ps, prog])
            success(`Program "${prog.name}" created`)
          }}
        />
      ),
      wide: true,
    })
  }

  const filtered = filter === 'all' ? programs : programs.filter(p => p.status === filter)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Programs</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{programs.length} program{programs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: COLORS.moss, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Program
        </button>
      </div>

      {/* Filters */}
      {programs.length > 0 && (
        <div className="fade-up-1" style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f ? COLORS.moss : COLORS.foam,
                color: filter === f ? '#fff' : COLORS.slate,
                border: `1px solid ${filter === f ? COLORS.moss : COLORS.mist}`,
              }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {programs.length === 0 ? (
        <div className="card fade-up-2" style={{ padding: 0 }}>
          <EmptyState
            icon={<FolderOpen size={24} />}
            title="No programs yet"
            description="Create your first program to start tracking activities, budgets, and indicators."
            action={
              <button
                onClick={openCreate}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 8,
                  background: COLORS.moss, color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Create First Program
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card fade-up-2" style={{ padding: 0 }}>
          <EmptyState title={`No ${filter} programs`} description="Try a different filter." compact />
        </div>
      ) : (
        <div
          className="fade-up-2"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
        >
          {filtered.map(p => <ProgramCard key={p.id} program={p} onClick={() => onSelect(p.id)} />)}
        </div>
      )}
    </div>
  )
}

// ── ProgramCard ───────────────────────────────────────────────────────────────

function ProgramCard({ program: p, onClick }: { program: Program; onClick: () => void }) {
  const barColor = p.status === 'active' ? COLORS.sage : COLORS.amber

  return (
    <div
      className="card card-hover"
      onClick={onClick}
      style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
    >
      {/* Left color bar */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 4, background: barColor, flexShrink: 0, borderRadius: '8px 0 0 8px' }} />
        <div style={{ padding: '18px 18px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest, lineHeight: 1.3 }}>{p.name}</h3>
            <StatusBadge status={p.status} />
          </div>

          {p.funder && p.funder !== 'TBD' && (
            <GenericBadge label={p.funder} bg={COLORS.gold + '1a'} text={COLORS.gold} style={{ marginBottom: 10 }} />
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {p.location && p.location !== 'TBD' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
                <MapPin size={10} /> {p.location}
              </span>
            )}
            {p.end && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
                <Calendar size={10} /> {p.end}
              </span>
            )}
          </div>

          <ProgressBar value={p.progress} showLabel />

          {p.budget > 0 && (
            <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 8 }}>
              Budget: {formatCurrency(p.budget, p.currency)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
