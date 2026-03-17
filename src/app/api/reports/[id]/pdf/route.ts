// GET /api/reports/:id/pdf
// Generates and streams a PDF for the report.
// Auth: NGO team member OR donor with can_download_reports=true

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { PdfTemplate } from '@/lib/reports/PdfTemplate'
import type { Report } from '@/types/reports'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Get user profile to determine role
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string; organization_id: string | null } | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch report + joins
  const { data: reportRaw } = await db
    .from('reports')
    .select('*, programs(name, organization_id), organizations(name, slug)')
    .eq('id', params.id)
    .single()

  if (!reportRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = reportRaw as Record<string, unknown>
  const programData      = r.programs as { name: string; organization_id: string } | null
  const orgData          = r.organizations as { name: string; slug: string } | null

  const report: Report = {
    ...(r as unknown as Report),
    program_name:      programData?.name ?? undefined,
    organization_name: orgData?.name ?? undefined,
  }

  let donorName: string | null = null
  let authorized = false

  if (profile?.role && ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    // NGO member — must belong to the same org
    if (programData?.organization_id && programData.organization_id === profile.organization_id) {
      authorized = true
    }
  } else {
    // Donor — check can_download_reports
    const { data: grantRaw } = await supabase
      .from('donor_program_access')
      .select('can_download_reports')
      .eq('donor_id', user.id)
      .eq('program_id', report.program_id)
      .eq('active', true)
      .single()

    const grant = grantRaw as { can_download_reports: boolean } | null
    if (grant?.can_download_reports) {
      authorized = true
      // Get donor name for cover page
      const { data: donorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      donorName = (donorProfile as { full_name: string } | null)?.full_name ?? null
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Generate PDF — dynamic import because @react-pdf/renderer is ESM-only
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const element = React.createElement(PdfTemplate, {
    report,
    orgName:   orgData?.name ?? 'OMANYE',
    donorName: donorName ?? undefined,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(element as any)

  // Build filename
  const safeName = (report.program_name ?? 'program').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const period   = report.reporting_period_end
    ? report.reporting_period_end.slice(0, 7)
    : new Date().toISOString().slice(0, 7)
  const filename = `${safeName}-report-${period}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(buffer.length),
    },
  })
}
