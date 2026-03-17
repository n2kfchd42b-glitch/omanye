'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Lock, Loader2 } from 'lucide-react'

async function downloadPdf(reportId: string, onStart: () => void, onDone: () => void) {
  onStart()
  try {
    const res   = await fetch(`/api/reports/${reportId}/pdf`)
    if (!res.ok) throw new Error('PDF generation failed')
    const blob  = await res.blob()
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    const cd    = res.headers.get('Content-Disposition') ?? ''
    const match = cd.match(/filename="([^"]+)"/)
    a.href      = url
    a.download  = match ? match[1] : 'report.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } finally {
    onDone()
  }
}
import { COLORS, FONTS } from '@/lib/tokens'
import { ReportPreview } from '@/components/reports/ReportPreview'
import type { Report } from '@/types/reports'
import type { AccessLevel } from '@/lib/supabase/database.types'

interface DonorReport extends Report {
  can_download: boolean
  access_level: AccessLevel
}

export default function DonorReportViewPage() {
  const params = useParams<{ reportId: string }>()
  const [report,      setReport]      = useState<DonorReport | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/donor/reports/${params.reportId}`)
      .then(r => {
        if (!r.ok) { setError(true); setLoading(false); return null }
        return r.json()
      })
      .then(json => {
        if (json) setReport(json.data)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [params.reportId])

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Topbar */}
      <div style={{
        background: COLORS.forest, padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/donor/reports" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
          ← Reports
        </Link>
        {report && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
            <span style={{
              color: '#fff', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320,
            }}>
              {report.title}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Loader2 size={24} style={{ color: COLORS.stone, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error || !report ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Lock size={28} style={{ color: COLORS.stone, marginBottom: 12 }} />
            <p style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.forest, marginBottom: 6 }}>
              Report not available
            </p>
            <p style={{ fontSize: 13, color: COLORS.stone, marginBottom: 20 }}>
              This report may not be shared with you or no longer exists.
            </p>
            <Link
              href="/donor/reports"
              style={{
                display: 'inline-block', padding: '8px 18px', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                background: COLORS.forest, color: '#fff', textDecoration: 'none',
              }}
            >
              Back to Reports
            </Link>
          </div>
        ) : (
          <>
            {/* Access level notice if sections are filtered */}
            {report.access_level !== 'FULL' && (
              <div style={{
                background: COLORS.foam, borderRadius: 10,
                border: `1px solid ${COLORS.mist}`, padding: '12px 16px',
                marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <Lock size={14} style={{ color: COLORS.slate, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.5 }}>
                  Some sections are restricted based on your access level.{' '}
                  <Link
                    href="/donor/programs"
                    style={{ color: COLORS.forest, fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Request full report access
                  </Link>
                  {' '}from the program team.
                </p>
              </div>
            )}

            {/* Report preview — sections already filtered by API */}
            <div className="fade-up">
              <ReportPreview
                report={report}
                accessLevel={report.access_level}
                showActions={false}
              />
            </div>

            {/* Download button */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              {report.can_download ? (
                <button
                  onClick={() => downloadPdf(report.id, () => setDownloading(true), () => setDownloading(false))}
                  disabled={downloading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: COLORS.gold, color: COLORS.forest,
                    cursor: downloading ? 'wait' : 'pointer', border: 'none',
                    opacity: downloading ? 0.7 : 1,
                  }}
                >
                  {downloading
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Download size={14} />
                  }
                  {downloading ? 'Generating PDF…' : 'Download PDF'}
                </button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <button
                    disabled
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: COLORS.mist, color: COLORS.stone,
                      cursor: 'not-allowed', border: 'none', opacity: 0.7,
                      margin: '0 auto 8px',
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <p style={{ fontSize: 11, color: COLORS.stone }}>
                    Contact the program team to request download access
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
