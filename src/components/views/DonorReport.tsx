'use client'

import React, { useState } from 'react'
import {
  FileText, Plus, X, Eye, Download, Send, Trash2,
  ChevronRight, ChevronLeft, CheckSquare, Square,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { useToast } from '@/components/Toast'
import { useAuditLog } from '@/lib/useAuditLog'
import type { DonorReport, Program, User } from '@/lib/types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  reports: DonorReport[]
  setReports: React.Dispatch<React.SetStateAction<DonorReport[]>>
  programs: Program[]
  user: User
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  'Executive Summary',
  'Program Overview',
  'Key Indicators Table',
  'Budget Summary',
  'Field Data Summary',
  'Challenges & Recommendations',
  'Appendix',
]

const FORMAT_OPTIONS: DonorReport['format'][] = ['pdf', 'word', 'both']

const STATUS_META: Record<DonorReport['status'], { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: '#FEF3C7', color: '#92400E' },
  generated: { label: 'Generated', bg: COLORS.foam, color: COLORS.moss },
  submitted: { label: 'Submitted', bg: '#E0F2FE', color: '#0369A1' },
}

let _id = Date.now()
const nextId = () => ++_id

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Blank wizard state ────────────────────────────────────────────────────────

interface WizardState {
  title: string
  programId: number | ''
  periodStart: string
  periodEnd: string
  format: DonorReport['format']
  funder: string
  challenges: string
  sections: string[]
}

function blankWizard(): WizardState {
  return {
    title: '',
    programId: '',
    periodStart: '',
    periodEnd: '',
    format: 'pdf',
    funder: '',
    challenges: '',
    sections: [...ALL_SECTIONS],
  }
}

// ── Preview Report Modal ──────────────────────────────────────────────────────

function PreviewModal({
  report, programs, onClose,
}: { report: DonorReport; programs: Program[]; onClose: () => void }) {
  const prog = programs.find(p => p.id === report.programId)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,26,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 780,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: SHADOW.modal, padding: 40,
          fontFamily: FONTS.body,
        }}
      >
        {/* Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: `2px solid ${COLORS.mist}`, paddingBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, color: COLORS.forest, margin: 0 }}>
              {report.title || 'Untitled Report'}
            </h1>
            <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 6 }}>
              {report.programName} · Funder: <strong style={{ color: COLORS.charcoal }}>{report.funder}</strong>
            </p>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 4 }}>
              Period: {fmtDate(report.period.start)} – {fmtDate(report.period.end)}
            </p>
          </div>
          <div style={{
            fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700,
            color: COLORS.gold, letterSpacing: 2,
          }}>
            OMANYE
          </div>
        </div>

        {/* Key Indicators */}
        {report.sections.includes('Key Indicators Table') && prog && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, marginBottom: 12 }}>
              Key Indicators
            </h2>
            {prog.indicators.length === 0 ? (
              <p style={{ color: COLORS.stone, fontSize: 13 }}>No indicators available.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.forest }}>
                    {['Indicator', 'Target', 'Current', '% Achieved', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '9px 12px', textAlign: 'left',
                        fontFamily: FONTS.heading, fontWeight: 700,
                        color: '#ffffff', fontSize: 12,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prog.indicators.map((ind, i) => {
                    const pct = ind.target > 0 ? Math.round((ind.current / ind.target) * 100) : 0
                    const status = pct >= 100 ? 'Achieved' : pct >= 70 ? 'On Track' : 'Lagging'
                    const statusColor = pct >= 100 ? COLORS.fern : pct >= 70 ? COLORS.amber : COLORS.crimson
                    return (
                      <tr key={ind.id} style={{ background: i % 2 === 0 ? '#ffffff' : COLORS.snow }}>
                        <td style={{ padding: '8px 12px', color: COLORS.charcoal }}>{ind.name}</td>
                        <td style={{ padding: '8px 12px', color: COLORS.slate }}>{ind.target} {ind.unit}</td>
                        <td style={{ padding: '8px 12px', color: COLORS.slate }}>{ind.current} {ind.unit}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: statusColor }}>{pct}%</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* Budget Summary */}
        {report.sections.includes('Budget Summary') && prog && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, marginBottom: 12 }}>
              Budget Summary
            </h2>
            {prog.budgetCategories.length === 0 ? (
              <p style={{ color: COLORS.stone, fontSize: 13 }}>No budget categories available.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.forest }}>
                    {['Category', 'Allocated', 'Spent', 'Remaining', 'Burn %'].map(h => (
                      <th key={h} style={{
                        padding: '9px 12px', textAlign: 'left',
                        fontFamily: FONTS.heading, fontWeight: 700,
                        color: '#ffffff', fontSize: 12,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prog.budgetCategories.map((cat, i) => {
                    const burn = cat.allocated > 0 ? Math.round((cat.spent / cat.allocated) * 100) : 0
                    const remaining = cat.allocated - cat.spent
                    return (
                      <tr key={cat.id} style={{ background: i % 2 === 0 ? '#ffffff' : COLORS.snow }}>
                        <td style={{ padding: '8px 12px', color: COLORS.charcoal }}>{cat.name}</td>
                        <td style={{ padding: '8px 12px', color: COLORS.slate }}>{prog.currency} {cat.allocated.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: COLORS.slate }}>{prog.currency} {cat.spent.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', color: remaining < 0 ? COLORS.crimson : COLORS.slate }}>
                          {prog.currency} {remaining.toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: burn > 90 ? COLORS.crimson : COLORS.amber }}>
                          {burn}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* Challenges */}
        {report.sections.includes('Challenges & Recommendations') && report.challenges && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, marginBottom: 10 }}>
              Challenges &amp; Recommendations
            </h2>
            <p style={{ fontSize: 13, color: COLORS.charcoal, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {report.challenges}
            </p>
          </section>
        )}

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${COLORS.mist}`, paddingTop: 16, marginTop: 24,
          textAlign: 'center', fontSize: 11, color: COLORS.stone,
        }}>
          Generated by OMANYE · {today}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: 8,
              background: COLORS.forest, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Wizard Modal ──────────────────────────────────────────────────────────────

function WizardModal({
  programs, user, onClose, onGenerate,
}: {
  programs: Program[]
  user: User
  onClose: () => void
  onGenerate: (r: DonorReport) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<WizardState>(blankWizard())
  const { toast } = useToast()

  const selectedProg = programs.find(p => p.id === form.programId) ?? null

  function set<K extends keyof WizardState>(k: K, v: WizardState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleSection(s: string) {
    setForm(f => ({
      ...f,
      sections: f.sections.includes(s)
        ? f.sections.filter(x => x !== s)
        : [...f.sections, s],
    }))
  }

  function handleGenerate() {
    if (!selectedProg || !form.title) {
      toast('Please complete required fields', 'error')
      return
    }
    const report: DonorReport = {
      id: nextId(),
      title: form.title,
      programId: selectedProg.id,
      programName: selectedProg.name,
      funder: form.funder || selectedProg.funder,
      period: { start: form.periodStart, end: form.periodEnd },
      format: form.format,
      sections: form.sections,
      challenges: form.challenges,
      status: 'generated',
      createdAt: new Date().toISOString(),
    }
    onGenerate(report)
    onClose()
  }

  const stepLabels = ['Configure', 'Select Sections', 'Preview & Generate']

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,26,16,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 14, width: '100%', maxWidth: 620,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: SHADOW.modal,
          fontFamily: FONTS.body,
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px', borderBottom: `1px solid ${COLORS.mist}`,
        }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.forest, margin: 0 }}>
            New Donor Report
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.stone }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', padding: '16px 28px', gap: 0, borderBottom: `1px solid ${COLORS.mist}` }}>
          {stepLabels.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const active = step === n
            const done = step > n
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                    background: active ? COLORS.fern : done ? COLORS.sage : COLORS.mist,
                    color: active || done ? '#ffffff' : COLORS.stone,
                  }}>{n}</div>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? COLORS.forest : COLORS.stone }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: COLORS.mist, margin: '0 12px' }} />}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div style={{ padding: '24px 28px' }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Report Title *">
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Q1 2025 Progress Report"
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Program *">
                <select
                  value={form.programId}
                  onChange={e => set('programId', Number(e.target.value) || '')}
                  style={inputStyle}
                >
                  <option value="">Select program…</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </FormField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Period Start">
                  <input type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} style={inputStyle} />
                </FormField>
                <FormField label="Period End">
                  <input type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} style={inputStyle} />
                </FormField>
              </div>
              <FormField label="Donor / Funder Name">
                <input
                  value={form.funder}
                  onChange={e => set('funder', e.target.value)}
                  placeholder="e.g. USAID"
                  style={inputStyle}
                />
              </FormField>
              <FormField label="Format">
                <div style={{ display: 'flex', gap: 8 }}>
                  {FORMAT_OPTIONS.map(f => (
                    <button
                      key={f}
                      onClick={() => set('format', f)}
                      style={{
                        padding: '7px 18px', borderRadius: 8, cursor: 'pointer',
                        fontFamily: FONTS.body, fontSize: 13, fontWeight: 600,
                        border: `2px solid ${form.format === f ? COLORS.fern : COLORS.mist}`,
                        background: form.format === f ? COLORS.foam : '#ffffff',
                        color: form.format === f ? COLORS.fern : COLORS.stone,
                      }}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </FormField>
              <FormField label="Challenges">
                <textarea
                  value={form.challenges}
                  onChange={e => set('challenges', e.target.value)}
                  placeholder="Describe challenges encountered and recommendations…"
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </FormField>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.stone, marginBottom: 16 }}>
                Choose which sections to include in the report.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ALL_SECTIONS.map(s => {
                  const checked = form.sections.includes(s)
                  return (
                    <label
                      key={s}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                        background: checked ? COLORS.foam : COLORS.snow,
                        border: `1px solid ${checked ? COLORS.mint : COLORS.mist}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSection(s)}
                        style={{ display: 'none' }}
                      />
                      {checked
                        ? <CheckSquare size={16} style={{ color: COLORS.fern, flexShrink: 0 }} />
                        : <Square size={16} style={{ color: COLORS.stone, flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: checked ? 600 : 400 }}>{s}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <div style={{
                background: COLORS.snow, borderRadius: 10, padding: 20,
                border: `1px solid ${COLORS.mist}`, marginBottom: 20,
              }}>
                {/* Preview letterhead */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: `1px solid ${COLORS.mist}`, paddingBottom: 14 }}>
                  <div>
                    <p style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, margin: 0 }}>
                      {form.title || '(No title)'}
                    </p>
                    <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 4 }}>
                      {selectedProg?.name ?? '—'} · {form.funder || selectedProg?.funder || '—'}
                    </p>
                    <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>
                      {fmtDate(form.periodStart)} – {fmtDate(form.periodEnd)}
                    </p>
                  </div>
                  <span style={{
                    fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700,
                    color: COLORS.gold, letterSpacing: 2,
                  }}>OMANYE</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.slate }}>
                  <strong>Sections:</strong> {form.sections.join(', ')}
                </div>
                <div style={{ fontSize: 12, color: COLORS.slate, marginTop: 6 }}>
                  <strong>Format:</strong> {form.format.toUpperCase()}
                </div>
              </div>
              <p style={{ fontSize: 12, color: COLORS.stone, textAlign: 'center' }}>
                Click "Generate Report" to save this report.
              </p>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 28px', borderTop: `1px solid ${COLORS.mist}`,
        }}>
          <button
            onClick={() => step > 1 ? setStep(s => (s - 1) as 1 | 2 | 3) : onClose()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8,
              background: 'none', border: `1px solid ${COLORS.mist}`,
              color: COLORS.slate, fontFamily: FONTS.body, fontSize: 13, cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8,
                background: COLORS.fern, border: 'none', color: '#ffffff',
                fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 8,
                background: COLORS.forest, border: 'none', color: '#ffffff',
                fontFamily: FONTS.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <FileText size={14} /> Generate Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Form helpers ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: FONTS.body,
  fontSize: 13, color: COLORS.charcoal, background: COLORS.snow,
  border: `1px solid ${COLORS.mist}`, outline: 'none', boxSizing: 'border-box',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DonorReportView({ reports, setReports, programs, user }: Props) {
  const { toast } = useToast()
  const { append } = useAuditLog()
  const [showWizard, setShowWizard] = useState(false)
  const [previewReport, setPreviewReport] = useState<DonorReport | null>(null)

  function handleGenerate(r: DonorReport) {
    setReports(prev => [r, ...prev])
    toast('Report generated successfully', 'success')
    append({
      actor: user.name,
      action: 'CREATE',
      resource: 'Report',
      resourceName: r.title,
      details: `Generated ${r.format.toUpperCase()} report for ${r.programName}`,
    })
  }

  function handleSubmit(id: number) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'submitted' } : r))
    const r = reports.find(x => x.id === id)
    toast('Report submitted to donor', 'success')
    append({
      actor: user.name,
      action: 'SUBMIT',
      resource: 'Report',
      resourceName: r?.title ?? 'Report',
      details: 'Report submitted to donor',
    })
  }

  function handleDelete(id: number) {
    const r = reports.find(x => x.id === id)
    setReports(prev => prev.filter(x => x.id !== id))
    toast('Report deleted', 'success')
    append({
      actor: user.name,
      action: 'DELETE',
      resource: 'Report',
      resourceName: r?.title ?? 'Report',
      details: 'Deleted donor report',
    })
  }

  function handleDownload(r: DonorReport) {
    toast(`Downloading "${r.title}"…`, 'success')
    append({
      actor: user.name,
      action: 'EXPORT',
      resource: 'Report',
      resourceName: r.title,
      details: `Downloaded as ${r.format.toUpperCase()}`,
    })
  }

  return (
    <div className="fade-up" style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, margin: 0 }}>
            Donor Reports
          </h2>
          <p style={{ fontSize: 13, color: COLORS.stone, margin: '4px 0 0' }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            background: COLORS.forest, border: 'none', color: '#ffffff',
            fontFamily: FONTS.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Report
        </button>
      </div>

      {/* Empty state */}
      {reports.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '72px 32px',
          background: COLORS.snow, borderRadius: 12,
          border: `2px dashed ${COLORS.mist}`,
        }}>
          <FileText size={40} style={{ color: COLORS.mist, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: COLORS.stone, marginBottom: 20, fontFamily: FONTS.heading }}>
            No reports generated yet
          </p>
          <button
            onClick={() => setShowWizard(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: COLORS.fern, border: 'none', color: '#ffffff',
              fontFamily: FONTS.body, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Generate Your First Report
          </button>
        </div>
      )}

      {/* Report cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reports.map(r => {
          const sm = STATUS_META[r.status]
          return (
            <div key={r.id} style={{
              background: '#ffffff', borderRadius: 12, boxShadow: SHADOW.card,
              border: `1px solid ${COLORS.mist}`, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <FileText size={22} style={{ color: COLORS.fern, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: COLORS.forest, margin: 0 }}>{r.title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: COLORS.moss, color: '#ffffff', fontWeight: 600,
                  }}>{r.programName}</span>
                  <span style={{ fontSize: 12, color: COLORS.gold, fontWeight: 600 }}>{r.funder}</span>
                  <span style={{ fontSize: 11, color: COLORS.stone }}>
                    {fmtDate(r.period.start)} – {fmtDate(r.period.end)}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: COLORS.mist, color: COLORS.slate,
                  }}>{r.format.toUpperCase()}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: sm.bg, color: sm.color, fontWeight: 600,
                  }}>{sm.label}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <ActionBtn icon={<Eye size={13} />} label="Preview" color={COLORS.fern} onClick={() => setPreviewReport(r)} />
                <ActionBtn icon={<Download size={13} />} label="Download" color={COLORS.slate} onClick={() => handleDownload(r)} />
                {r.status !== 'submitted' && (
                  <ActionBtn icon={<Send size={13} />} label="Submit" color={COLORS.amber} onClick={() => handleSubmit(r.id)} />
                )}
                <ActionBtn icon={<Trash2 size={13} />} label="Delete" color={COLORS.crimson} onClick={() => handleDelete(r.id)} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showWizard && (
        <WizardModal
          programs={programs}
          user={user}
          onClose={() => setShowWizard(false)}
          onGenerate={handleGenerate}
        />
      )}
      {previewReport && (
        <PreviewModal
          report={previewReport}
          programs={programs}
          onClose={() => setPreviewReport(null)}
        />
      )}
    </div>
  )
}

function ActionBtn({
  icon, label, color, onClick,
}: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
        border: `1px solid ${hov ? color : COLORS.mist}`,
        background: hov ? color : '#ffffff',
        color: hov ? '#ffffff' : color,
        fontFamily: FONTS.body, fontSize: 12, fontWeight: 600,
        transition: 'all 0.15s',
      }}
    >
      {icon} {label}
    </button>
  )
}
