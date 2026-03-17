'use client'

import React, { useState } from 'react'
import { Plus, BarChart2, TrendingUp, PieChart, Activity, GitBranch, Layers } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge } from '@/components/atoms/Badge'
import { EmptyState }  from '@/components/atoms/EmptyState'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { useModal, ModalFooter } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { nextId, todayISO } from '@/lib/utils'
import type { Analysis, Dataset } from '@/lib/types'

// ── Analysis types ────────────────────────────────────────────────────────────

interface AnalysisType {
  id:    string
  label: string
  desc:  string
  icon:  React.ElementType
}

const ANALYSIS_TYPES: AnalysisType[] = [
  { id: 'descriptive', label: 'Descriptive',     desc: 'Summary statistics and distributions',   icon: BarChart2   },
  { id: 'trend',       label: 'Trend Analysis',  desc: 'Time-series and progress over time',      icon: TrendingUp  },
  { id: 'comparison',  label: 'Comparison',      desc: 'Compare groups, regions, or periods',     icon: Layers      },
  { id: 'impact',      label: 'Impact',          desc: 'Measure program outcomes and attribution',icon: Activity    },
  { id: 'regression',  label: 'Regression',      desc: 'Statistical models and predictions',       icon: GitBranch   },
  { id: 'custom',      label: 'Custom (R/Python)', desc: 'Run your own analysis scripts',          icon: PieChart    },
]

// ── New analysis form ─────────────────────────────────────────────────────────

function NewAnalysisForm({ datasets, onSave }: { datasets: Dataset[]; onSave: (a: Analysis) => void }) {
  const { close } = useModal()
  const [title,     setTitle]     = useState('')
  const [type,      setType]      = useState('')
  const [datasetId, setDatasetId] = useState('')
  const [script,    setScript]    = useState('')

  const isCustom = type === 'custom'

  function handleRun() {
    if (!title.trim() || !type) return
    onSave({
      id: nextId(),
      title: title.trim(),
      type,
      status: 'running',
      createdAt: todayISO(),
    })
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Analysis title" required htmlFor="na-title">
        <Input id="na-title" placeholder="e.g. Q2 Beneficiary Analysis" value={title} onChange={e => setTitle(e.target.value)} />
      </FormField>
      <FormField label="Analysis type" required htmlFor="na-type">
        <Select
          id="na-type"
          placeholder="Select type…"
          options={ANALYSIS_TYPES.map(t => ({ value: t.id, label: t.label }))}
          value={type}
          onChange={e => setType(e.target.value)}
        />
      </FormField>
      {datasets.length > 0 && (
        <FormField label="Dataset" htmlFor="na-ds">
          <Select
            id="na-ds"
            placeholder="Select dataset…"
            options={datasets.map(d => ({ value: String(d.id), label: d.name }))}
            value={datasetId}
            onChange={e => setDatasetId(e.target.value)}
          />
        </FormField>
      )}
      {isCustom && (
        <FormField label="R / Python script" htmlFor="na-script" hint="Paste your analysis code below">
          <Textarea
            id="na-script"
            placeholder="# Your R or Python script here&#10;summary(data)"
            rows={6}
            mono
            value={script}
            onChange={e => setScript(e.target.value)}
          />
        </FormField>
      )}
      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleRun}
          disabled={!title.trim() || !type}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: title.trim() && type ? COLORS.moss : COLORS.mist,
            color: title.trim() && type ? COLORS.forest : COLORS.stone,
            cursor: title.trim() && type ? 'pointer' : 'not-allowed',
          }}
        >
          Run Analysis
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Analytics view ────────────────────────────────────────────────────────────

interface AnalyticsProps {
  analyses:    Analysis[]
  setAnalyses: React.Dispatch<React.SetStateAction<Analysis[]>>
  datasets:    Dataset[]
}

export function Analytics({ analyses, setAnalyses, datasets }: AnalyticsProps) {
  const { open }    = useModal()
  const { success } = useToast()

  function openNew() {
    open({
      title: 'New Analysis',
      content: (
        <NewAnalysisForm
          datasets={datasets}
          onSave={(a) => {
            setAnalyses(prev => [...prev, a])
            success(`Analysis "${a.title}" queued`)
          }}
        />
      ),
    })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Analytics</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{analyses.length} analys{analyses.length !== 1 ? 'es' : 'is'}</p>
        </div>
        <button
          onClick={openNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: COLORS.moss, color: COLORS.forest, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Analysis
        </button>
      </div>

      {/* Type cards */}
      <div className="fade-up-1" style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 14 }}>
          Analysis Types
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {ANALYSIS_TYPES.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={openNew}
                className="card card-hover"
                style={{ padding: '18px 18px', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: COLORS.foam,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Icon size={16} style={{ color: COLORS.fern }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, marginBottom: 4 }}>{t.label}</p>
                <p style={{ fontSize: 11, color: COLORS.stone, lineHeight: 1.5 }}>{t.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Analysis history */}
      <div className="fade-up-2">
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 14 }}>
          Analysis History
        </h3>
        {analyses.length === 0 ? (
          <div className="card" style={{ padding: 0 }}>
            <EmptyState
              icon={<BarChart2 size={24} />}
              title="No analyses yet"
              description="Run your first analysis to surface insights from your data."
              action={
                <button
                  onClick={openNew}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 8,
                    background: COLORS.moss, color: COLORS.forest, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> New Analysis
                </button>
              }
            />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.snow }}>
                  {['Title', 'Type', 'Status', 'Created'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: COLORS.stone, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analyses.map((a, i) => {
                  const TypeInfo = ANALYSIS_TYPES.find(t => t.id === a.type)
                  const Icon = TypeInfo?.icon ?? BarChart2
                  return (
                    <tr key={a.id} style={{ borderTop: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? COLORS.pearl : COLORS.snow }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.foam, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={13} style={{ color: COLORS.fern }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.forest }}>{a.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.slate }}>{TypeInfo?.label ?? a.type}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} /></td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.stone }}>{a.createdAt}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
