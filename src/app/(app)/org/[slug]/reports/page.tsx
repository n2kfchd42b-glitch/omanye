'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Plus, Eye, EyeOff, FileText, Trash2, Send, Archive,
  Loader2, ExternalLink, ChevronRight, Calendar, FileBarChart,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { GenericBadge } from '@/components/atoms/Badge'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { useToast } from '@/components/Toast'
import { formatDate } from '@/lib/utils'
import {
  REPORT_TYPES, REPORT_TYPE_LABELS, REPORT_TYPE_COLORS,
  REPORT_STATUS_LABELS, REPORT_STATUS_COLORS,
  ALL_SECTIONS, SECTION_LABELS, SECTION_DESCRIPTIONS,
} from '@/types/reports'
import type { Report, ReportType, ReportStatus, ReportSection, CreateReportPayload } from '@/types/reports'
import type { OmanyeRole } from '@/lib/supabase/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Program { id: string; name: string; status: string }

type FilterTab = 'all' | ReportStatus

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',       label: 'All'       },
  { id: 'DRAFT',     label: 'Draft'     },
  { id: 'GENERATED', label: 'Generated' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'ARCHIVED',  label: 'Archived'  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoTitle(programName: string, type: ReportType): string {
  const now = new Date()
  const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return `${programName} — ${REPORT_TYPE_LABELS[type]} — ${month}`
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router  = useRouter()
  const params  = useParams<{ slug: string }>()
  const { success, error: toastError } = useToast()

  const [userRole,  setUserRole]  = useState<OmanyeRole | null>(null)
  const [orgId,     setOrgId]     = useState<string | null>(null)
  const [programs,  setPrograms]  = useState<Program[]>([])
  const [reports,   setReports]   = useState<Report[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FilterTab>('all')
  const [showModal,       setShowModal]       = useState(false)
  const [preselect,       setPreselect]       = useState<string | null>(null)
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null)
  const [archiving,       setArchiving]       = useState(false)

  // Load data
  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      const profile = profileData as { role: string; organization_id: string } | null
      if (!profile) { router.replace('/login'); return }
      setUserRole(profile.role as OmanyeRole)
      setOrgId(profile.organization_id)

      // Fetch programs and reports in parallel
      const [progsResult, reportsRes] = await Promise.all([
        supabase
          .from('programs')
          .select('id, name, status')
          .eq('organization_id', profile.organization_id)
          .is('deleted_at', null)
          .order('name'),
        fetch('/api/reports'),
      ])

      setPrograms((progsResult.data ?? []) as Program[])

      if (reportsRes.ok) {
        const json = await reportsRes.json()
        setReports(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load() }, [load])

  const canCreate = userRole === 'NGO_ADMIN' || userRole === 'NGO_STAFF'
  const isAdmin   = userRole === 'NGO_ADMIN'

  const filtered = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter)

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft report?')) return
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReports(p => p.filter(r => r.id !== id))
      success('Report deleted')
    } else {
      toastError('Could not delete report')
    }
  }

  async function handlePublish(id: string, current: boolean) {
    const res = await fetch(`/api/reports/${id}/publish`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible_to_donors: !current }),
    })
    if (res.ok) {
      setReports(p => p.map(r => r.id === id ? { ...r, visible_to_donors: !current } : r))
      success(current ? 'Report hidden from donors' : 'Report visible to donors')
    }
  }

  async function handleSubmit(id: string) {
    if (!confirm('Submit this report to all donors with active access? They will be notified.')) return
    const res = await fetch(`/api/reports/${id}/submit`, { method: 'POST' })
    if (res.ok) {
      const json = await res.json()
      setReports(p => p.map(r => r.id === id ? { ...r, status: 'SUBMITTED' as ReportStatus, visible_to_donors: true } : r))
      success(`Report submitted. ${json.notified} donor${json.notified !== 1 ? 's' : ''} notified.`)
    } else {
      toastError('Could not submit report')
    }
  }

  function handleArchive(id: string) {
    setArchiveConfirmId(id)
  }

  async function confirmArchive() {
    if (!archiveConfirmId) return
    setArchiving(true)
    const res = await fetch(`/api/reports/${archiveConfirmId}/archive`, { method: 'POST' })
    setArchiving(false)
    setArchiveConfirmId(null)
    if (res.ok) {
      setReports(p => p.map(r => r.id === archiveConfirmId ? { ...r, status: 'ARCHIVED' as ReportStatus, visible_to_donors: false } : r))
      success('Report archived')
    } else {
      toastError('Could not archive report')
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, marginBottom: 2 }}>
            Reports
          </h1>
          <p style={{ fontSize: 13, color: COLORS.stone }}>
            Generate and share structured reports with your donors
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setPreselect(null); setShowModal(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              background: COLORS.gold, color: COLORS.forest,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(212,175,92,0.3)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} /> New Report
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${COLORS.mist}`, paddingBottom: 0 }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '7px 14px',
              fontSize: 13, fontWeight: filter === tab.id ? 600 : 400,
              color: filter === tab.id ? COLORS.forest : COLORS.stone,
              borderBottom: filter === tab.id ? `2px solid ${COLORS.forest}` : '2px solid transparent',
              cursor: 'pointer', background: 'none', marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 600,
                background: filter === tab.id ? COLORS.forest : COLORS.mist,
                color: filter === tab.id ? '#fff' : COLORS.stone,
                padding: '1px 6px', borderRadius: 8,
              }}>
                {reports.filter(r => r.status === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon={<FileBarChart size={24} />}
            title="No reports yet"
            description={filter === 'all'
              ? "Create your first report to share structured program data with your donors."
              : `No ${filter.toLowerCase()} reports.`}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              isAdmin={isAdmin}
              canCreate={canCreate}
              orgSlug={params.slug}
              onDelete={handleDelete}
              onPublish={handlePublish}
              onSubmit={handleSubmit}
              onArchive={handleArchive}
              onView={() => router.push(`/org/${params.slug}/reports/${report.id}`)}
            />
          ))}
        </div>
      )}

      {/* Archive confirmation modal */}
      {archiveConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(15,30,50,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 16px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 28px 24px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Archive size={18} style={{ color: '#92400E' }} />
              </div>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest }}>
                Archive this report?
              </h2>
            </div>
            <p style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.65, marginBottom: 8 }}>
              Archived reports remain accessible and can still be viewed, but they cannot be
              edited or re-submitted. Donors will no longer see this report in their portal.
            </p>
            <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 22 }}>
              To restore a report you will need to contact your platform administrator.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setArchiveConfirmId(null)}
                disabled={archiving}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: COLORS.foam, color: COLORS.slate,
                  border: `1px solid ${COLORS.mist}`, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={archiving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#92400E', color: '#fff',
                  border: 'none', cursor: archiving ? 'wait' : 'pointer',
                  opacity: archiving ? 0.75 : 1,
                }}
              >
                {archiving
                  ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Archive size={13} />
                }
                {archiving ? 'Archiving…' : 'Archive report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New report modal */}
      {showModal && (
        <NewReportModal
          programs={programs}
          preselectedProgramId={preselect}
          orgId={orgId!}
          onClose={() => setShowModal(false)}
          onCreated={(report) => {
            setReports(p => [report, ...p])
            setShowModal(false)
            router.push(`/org/${params.slug}/reports/${report.id}`)
          }}
        />
      )}
    </div>
  )
}


// ── Report Card ───────────────────────────────────────────────────────────────

interface CardProps {
  report:    Report
  isAdmin:   boolean
  canCreate: boolean
  orgSlug:   string
  onDelete:  (id: string) => void
  onPublish: (id: string, current: boolean) => void
  onSubmit:  (id: string) => void
  onArchive: (id: string) => void
  onView:    () => void
}

function ReportCard({ report, isAdmin, canCreate, orgSlug, onDelete, onPublish, onSubmit, onArchive, onView }: CardProps) {
  const typeStyle = REPORT_TYPE_COLORS[report.report_type] ?? { bg: COLORS.foam, text: COLORS.forest }
  const stStyle   = REPORT_STATUS_COLORS[report.status]

  const periodLabel = [
    report.reporting_period_start ? formatDate(report.reporting_period_start) : null,
    report.reporting_period_end   ? formatDate(report.reporting_period_end)   : null,
  ].filter(Boolean).join(' – ')

  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,175,92,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
      onClick={onView}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: typeStyle.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FileBarChart size={18} style={{ color: typeStyle.text }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest }}>
            {report.title}
          </span>
          {report.visible_to_donors && (
            <Eye size={13} style={{ color: COLORS.sage, flexShrink: 0 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {report.program_name && (
            <GenericBadge label={report.program_name} bg={COLORS.foam} text={COLORS.forest} />
          )}
          <GenericBadge
            label={REPORT_TYPE_LABELS[report.report_type]}
            bg={typeStyle.bg} text={typeStyle.text}
          />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            background: stStyle.bg, color: stStyle.text,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: stStyle.dot }} />
            {REPORT_STATUS_LABELS[report.status]}
          </span>
          {periodLabel && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
              <Calendar size={11} /> {periodLabel}
            </span>
          )}
          <span style={{ fontSize: 11, color: COLORS.stone }}>
            {formatDate(report.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <ActionBtn icon={<ExternalLink size={13} />} label="Preview" onClick={onView} />
        {isAdmin && report.status !== 'ARCHIVED' && (
          <ActionBtn
            icon={report.visible_to_donors ? <EyeOff size={13} /> : <Eye size={13} />}
            label={report.visible_to_donors ? 'Hide' : 'Publish'}
            onClick={() => onPublish(report.id, report.visible_to_donors)}
          />
        )}
        {(isAdmin || canCreate) && report.status === 'GENERATED' && (
          <ActionBtn icon={<Send size={13} />} label="Submit" onClick={() => onSubmit(report.id)} />
        )}
        {isAdmin && (report.status === 'GENERATED' || report.status === 'SUBMITTED') && (
          <ActionBtn icon={<Archive size={13} />} label="Archive" onClick={() => onArchive(report.id)} />
        )}
        {(isAdmin) && report.status === 'DRAFT' && (
          <ActionBtn icon={<Trash2 size={13} />} label="Delete" onClick={() => onDelete(report.id)} danger />
        )}
      </div>

      <ChevronRight size={14} style={{ color: COLORS.stone, flexShrink: 0, marginTop: 2 }} />
    </div>
  )
}

function ActionBtn({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 7,
        fontSize: 11, fontWeight: 500, cursor: 'pointer',
        background: danger ? '#FEE2E2' : COLORS.foam,
        color: danger ? COLORS.crimson : COLORS.slate,
        border: 'none', whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#fecaca' : COLORS.mist)}
      onMouseLeave={e => (e.currentTarget.style.background = danger ? '#FEE2E2' : COLORS.foam)}
    >
      {icon} {label}
    </button>
  )
}

// ── New Report Modal — 3-step ─────────────────────────────────────────────────

interface ModalProps {
  programs:              Program[]
  preselectedProgramId:  string | null
  orgId:                 string
  onClose:               () => void
  onCreated:             (report: Report) => void
}

const DEFAULT_SECTIONS: ReportSection[] = [
  'EXECUTIVE_SUMMARY',
  'PROGRAM_OVERVIEW',
  'KEY_INDICATORS',
  'FIELD_DATA_SUMMARY',
  'CHALLENGES',
  'APPENDIX',
]

function NewReportModal({ programs, preselectedProgramId, onClose, onCreated }: ModalProps) {
  const { success, error: toastError } = useToast()

  const [step,          setStep]         = useState<1 | 2 | 3>(1)
  const [programId,     setProgramId]    = useState(preselectedProgramId ?? programs[0]?.id ?? '')
  const [reportType,    setReportType]   = useState<ReportType>('PROGRESS')
  const [periodStart,   setPeriodStart]  = useState('')
  const [periodEnd,     setPeriodEnd]    = useState('')
  const [title,         setTitle]        = useState('')
  const [sections,      setSections]     = useState<ReportSection[]>(DEFAULT_SECTIONS)
  const [challenges,    setChallenges]   = useState('')
  const [hasBudget,     setHasBudget]    = useState(false)
  const [loading,       setLoading]      = useState(false)
  const [generating,    setGenerating]   = useState(false)
  const [createdReport, setCreatedReport] = useState<Report | null>(null)

  const selectedProgram = programs.find(p => p.id === programId)

  // Auto-fill title
  useEffect(() => {
    if (selectedProgram) {
      setTitle(autoTitle(selectedProgram.name, reportType))
    }
  }, [selectedProgram, reportType])

  // Check if program has budget
  useEffect(() => {
    if (!programId) return
    const supabase = createClient()
    supabase
      .from('budget_categories')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', programId)
      .then(({ count }) => {
        const hasBudgetData = (count ?? 0) > 0
        setHasBudget(hasBudgetData)
        if (!hasBudgetData) {
          setSections(prev => prev.filter(s => s !== 'BUDGET_SUMMARY'))
        }
      })
  }, [programId])

  function toggleSection(s: ReportSection) {
    setSections(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  async function handleCreate() {
    if (!programId || !title.trim()) return
    setLoading(true)
    try {
      const payload: CreateReportPayload = {
        program_id:             programId,
        title:                  title.trim(),
        report_type:            reportType,
        reporting_period_start: periodStart || null,
        reporting_period_end:   periodEnd   || null,
        sections,
        challenges:             challenges || null,
      }
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create report')
      const json = await res.json()
      const report = { ...json.data, program_name: selectedProgram?.name }
      setCreatedReport(report)
      setStep(3)
    } catch {
      toastError('Could not create report')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate() {
    if (!createdReport) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/reports/${createdReport.id}/generate`, { method: 'POST' })
      if (!res.ok) throw new Error('Generation failed')
      const json = await res.json()
      success('Report generated — review before sharing with donors')
      onCreated(json.data)
    } catch {
      toastError('Could not generate report')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 640,
          background: '#1A2B4A', borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${COLORS.mist}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 600, color: COLORS.forest }}>
              New Report
            </h2>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>
              Step {step} of 3 — {step === 1 ? 'Configure' : step === 2 ? 'Select Sections' : 'Generate'}
            </p>
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 6 }}>
            {([1, 2, 3] as const).map(s => (
              <div key={s} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? COLORS.forest : COLORS.mist,
                color: step >= s ? '#fff' : COLORS.stone,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* ── Step 1: Configure ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormField label="Program" htmlFor="rp-program">
                <Select
                  id="rp-program"
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
                  options={programs.map(p => ({ value: p.id, label: p.name }))}
                />
              </FormField>

              <FormField label="Report Type" htmlFor="rp-type">
                <Select
                  id="rp-type"
                  value={reportType}
                  onChange={e => setReportType(e.target.value as ReportType)}
                  options={REPORT_TYPES.map(t => ({ value: t, label: REPORT_TYPE_LABELS[t] }))}
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Period Start" htmlFor="rp-start">
                  <Input id="rp-start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </FormField>
                <FormField label="Period End" htmlFor="rp-end">
                  <Input id="rp-end" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </FormField>
              </div>

              <FormField label="Report Title" htmlFor="rp-title">
                <Input
                  id="rp-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Report title"
                />
              </FormField>
            </div>
          )}

          {/* ── Step 2: Select Sections ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 8 }}>
                Select sections to include in the report. All are selected by default.
              </p>
              {ALL_SECTIONS.map(section => {
                if (section === 'BUDGET_SUMMARY' && !hasBudget) return null
                const checked = sections.includes(section)
                return (
                  <label
                    key={section}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: checked ? COLORS.foam : '#f9fafb',
                      border: `1px solid ${checked ? COLORS.mist : '#e5e7eb'}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSection(section)}
                      style={{ marginTop: 2, accentColor: COLORS.forest, flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, marginBottom: 2 }}>
                        {SECTION_LABELS[section]}
                      </p>
                      <p style={{ fontSize: 11, color: COLORS.stone }}>
                        {SECTION_DESCRIPTIONS[section]}
                      </p>
                    </div>
                  </label>
                )
              })}

              {/* Inline challenges textarea */}
              {sections.includes('CHALLENGES') && (
                <div style={{ marginTop: 8 }}>
                  <FormField label="Challenges & Recommendations" htmlFor="rp-challenges">
                    <Textarea
                      id="rp-challenges"
                      value={challenges}
                      onChange={e => setChallenges(e.target.value)}
                      placeholder="Describe key challenges and your recommendations..."
                      rows={4}
                    />
                  </FormField>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Preview & Generate ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 16 }}>
                Review the report structure below, then click Generate to fetch live program data and build your report.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {sections.map(section => (
                  <div key={section} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: COLORS.snow,
                    border: `1px solid ${COLORS.mist}`,
                    display: 'flex', gap: 10, alignItems: 'center',
                  }}>
                    <FileText size={14} style={{ color: COLORS.sage, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{SECTION_LABELS[section]}</p>
                      <p style={{ fontSize: 11, color: COLORS.stone }}>{SECTION_DESCRIPTIONS[section]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                background: COLORS.foam, borderRadius: 10, padding: '14px 16px',
                border: `1px solid ${COLORS.mist}`, fontSize: 13, color: COLORS.slate,
              }}>
                <strong style={{ color: COLORS.forest }}>"{title}"</strong>
                <br />
                Program: {selectedProgram?.name} · Type: {REPORT_TYPE_LABELS[reportType]}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${COLORS.mist}`,
          display: 'flex', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <button
            onClick={() => step === 1 ? onClose() : setStep(p => (p - 1) as 1 | 2 | 3)}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: COLORS.foam, color: COLORS.slate, cursor: 'pointer',
            }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 && (
            <button
              onClick={async () => {
                if (step === 2 && !createdReport) {
                  await handleCreate()
                } else {
                  setStep(p => (p + 1) as 2 | 3)
                }
              }}
              disabled={!programId || !title.trim() || loading}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: COLORS.forest, color: '#fff', cursor: 'pointer',
                opacity: (!programId || !title.trim() || loading) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {loading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
              Next
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: COLORS.gold, color: COLORS.forest, cursor: 'pointer',
                opacity: generating ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {generating
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : 'Generate Report'
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
