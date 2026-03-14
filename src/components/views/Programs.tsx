'use client'

import React, { useState } from 'react'
import { Plus, Filter, Search, FolderOpen } from 'lucide-react'
import { StatusBadge, TagBadge } from '../atoms/Badge'
import { ProgressBar } from '../atoms/ProgressBar'
import { AvatarGroup } from '../atoms/Avatar'
import { EmptyState }   from '../atoms/EmptyState'
import { useModal }     from '../Modal'
import { useToast }     from '../Toast'
import { FormField, Input, Select, Textarea } from '../atoms/FormField'
import { PROGRAMS, TEAM } from '@/lib/mock'
import { formatNumber, formatCurrency, pct } from '@/lib/utils'
import type { ProgramStatus } from '@/lib/types'

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'active',    label: 'Active'    },
  { value: 'pending',   label: 'Pending'   },
  { value: 'completed', label: 'Completed' },
]

function CreateProgramForm({ onClose }: { onClose: () => void }) {
  const { success } = useToast()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')

  return (
    <div className="space-y-4">
      <FormField label="Program name" required htmlFor="cn-name">
        <Input id="cn-name" placeholder="e.g. WASH Initiative – Volta Region"
          value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Country" htmlFor="cn-country">
          <Select id="cn-country" options={[
            { value: 'GH', label: 'Ghana' }, { value: 'NG', label: 'Nigeria' },
            { value: 'KE', label: 'Kenya' },
          ]} placeholder="Select…" />
        </FormField>
        <FormField label="Region" htmlFor="cn-region">
          <Input id="cn-region" placeholder="e.g. Northern"
            value={region} onChange={e => setRegion(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Sector" htmlFor="cn-sector">
        <Select id="cn-sector" options={[
          { value: 'wash', label: 'WASH' }, { value: 'education', label: 'Education' },
          { value: 'health', label: 'Health' }, { value: 'livelihoods', label: 'Livelihoods' },
          { value: 'protection', label: 'Protection' },
        ]} placeholder="Select sector…" />
      </FormField>
      <FormField label="Description" htmlFor="cn-desc">
        <Textarea id="cn-desc" placeholder="Brief description of program objectives…" rows={3} />
      </FormField>
      <FormField label="Target beneficiaries" htmlFor="cn-target">
        <Input id="cn-target" type="number" placeholder="e.g. 2000" />
      </FormField>
      <div className="flex justify-end gap-2 pt-2 border-t border-mist">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-mist text-sm text-fern hover:bg-foam transition-colors">
          Cancel
        </button>
        <button
          onClick={() => { success('Program created', `"${name || 'New program'}" added to your workspace.`); onClose() }}
          className="px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors"
        >
          Create Program
        </button>
      </div>
    </div>
  )
}

interface ProgramsProps {
  onSelectProgram: (id: string) => void
}

export function Programs({ onSelectProgram }: ProgramsProps) {
  const { open, close } = useModal()
  const [search,    setSearch]    = useState('')
  const [statusTab, setStatusTab] = useState('all')

  const openCreate = () => open({
    title:   'New Program',
    content: <CreateProgramForm onClose={close} />,
    size:    'md',
  })

  const filtered = PROGRAMS.filter(p => {
    const matchStatus = statusTab === 'all' || p.status === statusTab
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.region.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Programs</h2>
          <p className="text-sm text-fern/60 mt-0.5">
            {PROGRAMS.length} programs · {PROGRAMS.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
          <Plus size={14} /> New Program
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none" />
          <input
            type="text" placeholder="Search programs…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-mist bg-white text-forest placeholder:text-forest/35 focus:outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss w-52 transition-all"
          />
        </div>
        <div className="flex gap-1 bg-foam rounded-lg p-1 border border-mist/60">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusTab(t.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                statusTab === t.value
                  ? 'bg-white text-forest shadow-sm'
                  : 'text-fern/60 hover:text-fern'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={22} />}
          title="No programs found"
          description="Try adjusting your search or filter, or create a new program."
          action={
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
              <Plus size={14} /> New Program
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const budPct = pct(p.spent, p.budget)
            return (
              <button
                key={p.id}
                onClick={() => onSelectProgram(p.id)}
                className="card card-hover p-5 flex flex-col gap-3.5 text-left group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-fraunces text-sm font-semibold text-forest group-hover:text-moss transition-colors line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-xs text-fern/50 mt-1">{p.region} · {p.country}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {p.sector.map(s => <TagBadge key={s} label={s} />)}
                </div>

                <div className="space-y-2">
                  <ProgressBar
                    label="Beneficiaries"
                    value={pct(p.beneficiaries, p.targetBenef)}
                    showPct size="sm"
                  />
                  <ProgressBar
                    label="Budget spent"
                    value={budPct}
                    showPct size="sm"
                    color={budPct > 85 ? 'gold' : 'green'}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-mist/60">
                  <AvatarGroup names={p.team} max={4} size="xs" />
                  <div className="text-right">
                    <p className="text-xs font-mono text-fern/70">{formatNumber(p.beneficiaries)} beneficiaries</p>
                    <p className="text-[10px] text-fern/40">{formatCurrency(p.spent)} of {formatCurrency(p.budget)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
