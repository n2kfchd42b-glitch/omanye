'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Lock, FileBarChart, Calendar, Loader2, Download, ExternalLink, Building2,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { formatDate } from '@/lib/utils'
import { GenericBadge } from '@/components/atoms/Badge'
import { REPORT_TYPE_LABELS, REPORT_TYPE_COLORS } from '@/types/reports'
import type { ReportType } from '@/types/reports'

interface DonorReportSummary {
  id:                     string
  title:                  string
  report_type:            ReportType
  reporting_period_start: string | null
  reporting_period_end:   string | null
  status:                 string
  submitted_at:           string | null
  created_at:             string
  program_id:             string
  organization_id:        string
  program_name:           string | null
  organization_name:      string | null
  can_download:           boolean
  access_level:           string
}

export default function DonorReportsPage() {
  const router    = useRouter()
  const [reports,    setReports]    = useState<DonorReportSummary[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState(false)

  function loadReports() {
    setLoading(true)
    setFetchError(false)
    fetch('/api/donor/reports')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then(json => { setReports(json.data ?? []); setLoading(false) })
      .catch(() => { setFetchError(true); setLoading(false) })
  }

  useEffect(() => { loadReports() }, [])

  return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
            Reports
          </h1>
          <p style={{ fontSize: 13, color: COLORS.stone }}>
            Reports shared with you by your program partners
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : fetchError ? (
          <div style={{
            background: COLORS.forest, borderRadius: 16,
            padding: '48px 32px', textAlign: 'center', maxWidth: 480, margin: '0 auto',
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              Could not load reports
            </p>
            <p style={{ fontSize: 13, color: COLORS.mint, lineHeight: 1.7, opacity: 0.8, marginBottom: 20 }}>
              There was a problem fetching your reports. Please try again.
            </p>
            <button
              onClick={loadReports}
              style={{
                padding: '9px 22px', fontSize: 13, borderRadius: 8, fontWeight: 600,
                background: COLORS.gold, color: COLORS.forest, border: 'none', cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        ) : reports.length === 0 ? (
          /* Empty state */
          <div style={{
            background: COLORS.forest, borderRadius: 16,
            padding: '48px 32px', textAlign: 'center', maxWidth: 480, margin: '0 auto',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(212,175,92,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Lock size={24} style={{ color: COLORS.mint }} />
            </div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              No reports have been shared with you yet
            </h2>
            <p style={{ fontSize: 13, color: COLORS.mint, lineHeight: 1.7, opacity: 0.8 }}>
              Reports will appear here when program teams share them with you.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reports.map(report => {
              const typeStyle  = REPORT_TYPE_COLORS[report.report_type] ?? { bg: COLORS.foam, text: COLORS.forest }
              const periodLabel = [
                report.reporting_period_start ? formatDate(report.reporting_period_start) : null,
                report.reporting_period_end   ? formatDate(report.reporting_period_end)   : null,
              ].filter(Boolean).join(' – ')

              return (
                <div key={report.id} className="card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: typeStyle.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileBarChart size={20} style={{ color: typeStyle.text }} />
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.forest, marginBottom: 4, lineHeight: 1.4 }}>
                        {report.title}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        {report.organization_name && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: COLORS.slate }}>
                            <Building2 size={11} /> {report.organization_name}
                          </span>
                        )}
                        {report.program_name && (
                          <GenericBadge label={report.program_name} bg={COLORS.foam} text={COLORS.forest} />
                        )}
                        <GenericBadge
                          label={REPORT_TYPE_LABELS[report.report_type]}
                          bg={typeStyle.bg} text={typeStyle.text}
                        />
                        {periodLabel && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.stone }}>
                            <Calendar size={10} /> {periodLabel}
                          </span>
                        )}
                      </div>
                      {report.submitted_at && (
                        <p style={{ fontSize: 11, color: COLORS.stone }}>
                          Shared {formatDate(report.submitted_at)}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                      <button
                        onClick={() => router.push(`/donor/reports/${report.id}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: COLORS.forest, color: '#fff', cursor: 'pointer', border: 'none',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        <ExternalLink size={12} /> View Report
                      </button>

                      <button
                        disabled={!report.can_download}
                        title={
                          report.can_download
                            ? 'Download PDF (coming soon)'
                            : 'Contact the program team to request download access'
                        }
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: report.can_download ? COLORS.gold : COLORS.mist,
                          color: report.can_download ? COLORS.forest : COLORS.stone,
                          cursor: report.can_download ? 'pointer' : 'not-allowed',
                          border: 'none', opacity: report.can_download ? 1 : 0.65,
                        }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
  )
}
