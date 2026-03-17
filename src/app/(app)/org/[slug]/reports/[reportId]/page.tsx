'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, Eye, EyeOff, Send, Download, Loader2, Users,
} from 'lucide-react'

// ── Download helper ────────────────────────────────────────────────────────────

async function downloadPdf(reportId: string, onStart: () => void, onDone: () => void) {
  onStart()
  try {
    const res = await fetch(`/api/reports/${reportId}/pdf`)
    if (!res.ok) throw new Error('PDF generation failed')
    const blob      = await res.blob()
    const url       = URL.createObjectURL(blob)
    const a         = document.createElement('a')
    const cd        = res.headers.get('Content-Disposition') ?? ''
    const match     = cd.match(/filename="([^"]+)"/)
    a.href          = url
    a.download      = match ? match[1] : 'report.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } finally {
    onDone()
  }
}
import { COLORS, FONTS } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'
import { ReportPreview } from '@/components/reports/ReportPreview'
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/types/reports'
import type { Report, ReportStatus } from '@/types/reports'
import type { OmanyeRole } from '@/lib/supabase/database.types'

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams<{ slug: string; reportId: string }>()
  const { success, error: toastError } = useToast()

  const [report,    setReport]    = useState<Report | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [userRole,  setUserRole]  = useState<OmanyeRole | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [donorCount, setDonorCount] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }

        const { data: profileRaw } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        const profile = profileRaw as { role: string } | null
        setUserRole((profile?.role ?? null) as OmanyeRole | null)

        const res = await fetch(`/api/reports/${params.reportId}`)
        if (res.ok) {
          const json = await res.json()
          setReport(json.data)

          // Count donors for the program
          const { count } = await supabase
            .from('donor_program_access')
            .select('id', { count: 'exact', head: true })
            .eq('program_id', json.data.program_id)
            .eq('active', true)
          setDonorCount(count ?? 0)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.reportId, router])

  const isAdmin  = userRole === 'NGO_ADMIN'

  async function handlePublish() {
    if (!report) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/reports/${report.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible_to_donors: !report.visible_to_donors }),
      })
      if (!res.ok) throw new Error()
      setReport(p => p ? { ...p, visible_to_donors: !p.visible_to_donors } : p)
      success(report.visible_to_donors ? 'Report hidden from donors' : 'Report is now visible to donors')
    } catch {
      toastError('Could not update visibility')
    } finally {
      setPublishing(false)
    }
  }

  async function handleSubmit() {
    if (!report) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${report.id}/submit`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setReport(p => p ? { ...p, status: 'SUBMITTED' as ReportStatus, visible_to_donors: true } : p)
      setShowSubmitModal(false)
      success(`Report submitted. ${json.notified} donor${json.notified !== 1 ? 's' : ''} notified.`)
    } catch {
      toastError('Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: COLORS.stone }}>Report not found.</p>
      </div>
    )
  }

  const stStyle = REPORT_STATUS_COLORS[report.status]

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px' }}>
      {/* Sticky action bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: '#1A2B4A',
        borderBottom: `1px solid ${COLORS.mist}`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        marginBottom: 24,
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        {/* Back */}
        <button
          onClick={() => router.push(`/org/${params.slug}/reports`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
            color: COLORS.slate, cursor: 'pointer', background: 'none',
            border: 'none', padding: '4px 0', marginRight: 8,
          }}
        >
          <ArrowLeft size={14} /> Back to Reports
        </button>

        {/* Status badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 10,
          background: stStyle.bg, color: stStyle.text, fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: stStyle.dot }} />
          {REPORT_STATUS_LABELS[report.status]}
        </span>

        <div style={{ flex: 1 }} />

        {/* Publish toggle (admin only) */}
        {isAdmin && report.status !== 'DRAFT' && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: report.visible_to_donors ? COLORS.foam : COLORS.forest,
              color: report.visible_to_donors ? COLORS.slate : '#fff',
              cursor: 'pointer', border: `1px solid ${report.visible_to_donors ? COLORS.mist : 'transparent'}`,
              transition: 'opacity 0.15s',
              opacity: publishing ? 0.6 : 1,
            }}
          >
            {report.visible_to_donors ? <EyeOff size={13} /> : <Eye size={13} />}
            {report.visible_to_donors ? 'Hide from Donors' : 'Publish to Donors'}
          </button>
        )}

        {/* Submit */}
        {(isAdmin) && (report.status === 'GENERATED' || report.status === 'SUBMITTED') && (
          <button
            onClick={() => setShowSubmitModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: COLORS.gold, color: COLORS.forest,
              cursor: 'pointer', border: 'none',
            }}
          >
            <Send size={13} /> Submit to Donors
          </button>
        )}

        {/* Download PDF */}
        {report.status !== 'DRAFT' && (
          <button
            onClick={() => downloadPdf(report.id, () => setDownloading(true), () => setDownloading(false))}
            disabled={downloading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: COLORS.gold, color: COLORS.forest,
              cursor: downloading ? 'wait' : 'pointer', border: 'none',
              opacity: downloading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {downloading
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Download size={13} />
            }
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        )}
      </div>

      {/* Report content */}
      <div className="fade-up">
        <ReportPreview report={report} showActions={false} />
      </div>

      {/* Submit confirm modal */}
      {showSubmitModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
          }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 440,
              background: '#1A2B4A', borderRadius: 16, padding: '24px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: COLORS.foam, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Users size={18} style={{ color: COLORS.forest }} />
              </div>
              <div>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
                  Submit to Donors
                </h3>
                <p style={{ fontSize: 13, color: COLORS.slate, lineHeight: 1.6 }}>
                  This will mark the report as <strong>Submitted</strong> and make it visible to all{' '}
                  {donorCount !== null ? <strong>{donorCount} donor{donorCount !== 1 ? 's' : ''}</strong> : 'donors'}{' '}
                  with active access to <strong>{report.program_name}</strong>.
                  They will receive a notification.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: COLORS.foam, color: COLORS.slate, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: COLORS.gold, color: COLORS.forest, cursor: 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {submitting && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
