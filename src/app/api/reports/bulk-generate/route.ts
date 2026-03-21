// POST /api/reports/bulk-generate
//
// Creates and generates one report per active donor with access to the given program.
// Uses the donor's template (with org-default fallback) for each report.
//
// Body:
//   program_id:             string (uuid)
//   report_type:            ReportType
//   reporting_period_start: string | null
//   reporting_period_end:   string | null
//   challenges:             string | null
//
// Returns: { created: number, failed: number, report_ids: string[] }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportContent } from '@/lib/reports/generator'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'
import { checkLimit } from '@/lib/billing/limits'
import type { ReportSection, ReportType } from '@/types/reports'
import type { TemplateSectionConfig } from '@/lib/reports/generator'
import { autoTitleForBulk } from '@/lib/reports/utils'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (profile.role !== 'NGO_ADMIN') return forbidden()

  const body = await req.json() as {
    program_id:             string
    report_type:            ReportType
    reporting_period_start: string | null
    reporting_period_end:   string | null
    challenges:             string | null
    sections:               ReportSection[]
  }

  if (!body.program_id) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Verify program belongs to org
  const { data: program } = await db
    .from('programs')
    .select('id, name')
    .eq('id', body.program_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound('Program')

  // Fetch all donors with active access to this program + their profile details
  const { data: accessRows } = await db
    .from('donor_program_access')
    .select('donor_id, access_level, profiles!donor_program_access_donor_id_fkey(id, full_name)')
    .eq('program_id', body.program_id)
    .eq('active', true)

  const donors = (accessRows ?? []).map((r: Record<string, unknown>) => ({
    donor_id:     r.donor_id as string,
    access_level: r.access_level as string,
    donors: r.profiles
      ? { id: (r.profiles as Record<string, unknown>).id as string, full_name: (r.profiles as Record<string, unknown>).full_name as string | null, email: '' }
      : null,
  })) as Array<{
    donor_id: string
    access_level: string
    donors: { id: string; full_name: string | null; email: string } | null
  }>

  if (donors.length === 0) {
    return NextResponse.json({ created: 0, failed: 0, report_ids: [], message: 'No active donors for this program' })
  }

  // Plan limit check (count against total reports)
  const limitCheck = await checkLimit(profile.organization_id, 'reports_per_month')
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: `Monthly report limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade your plan.`
    }, { status: 429 })
  }

  // Fetch org-level default templates for this report_type (one per type, keyed by donor)
  const { data: orgTemplate } = await db
    .from('report_templates')
    .select('sections')
    .eq('organization_id', profile.organization_id)
    .is('donor_id', null)
    .eq('report_type', body.report_type)
    .eq('is_default', true)
    .maybeSingle()

  const reportIds: string[] = []
  let created = 0
  let failed  = 0

  // Process donors sequentially to avoid hitting DB connection limits
  for (const row of donors) {
    const donor = row.donors
    if (!donor) continue

    try {
      // Fetch donor-specific template, fall back to org default
      const { data: donorTpl } = await db
        .from('report_templates')
        .select('sections')
        .eq('organization_id', profile.organization_id)
        .eq('donor_id', donor.id)
        .eq('report_type', body.report_type)
        .maybeSingle()

      const templateSections: TemplateSectionConfig[] | undefined =
        donorTpl?.sections ?? orgTemplate?.sections ?? undefined

      const reportTitle = autoTitleForBulk(program.name, body.report_type, donor.full_name ?? donor.email)

      // Create draft
      const { data: newReport, error: createErr } = await db
        .from('reports')
        .insert({
          program_id:             body.program_id,
          organization_id:        profile.organization_id,
          title:                  reportTitle,
          report_type:            body.report_type,
          reporting_period_start: body.reporting_period_start ?? null,
          reporting_period_end:   body.reporting_period_end   ?? null,
          sections:               body.sections ?? [],
          challenges:             body.challenges ?? null,
          donor_id:               donor.id,
          status:                 'DRAFT',
          created_by:             user.id,
        })
        .select('id')
        .single()

      if (createErr || !newReport) { failed++; continue }

      // Generate content
      const content = await generateReportContent(
        body.program_id,
        body.sections ?? [],
        body.reporting_period_start ?? null,
        body.reporting_period_end   ?? null,
        body.challenges             ?? null,
        templateSections,
      )

      await db
        .from('reports')
        .update({ content, status: 'GENERATED', generated_at: new Date().toISOString() })
        .eq('id', newReport.id)

      reportIds.push(newReport.id)
      created++
    } catch {
      failed++
    }
  }

  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'report.generated',
    entityType:     'report',
    entityId:       body.program_id,
    entityName:     program.name,
    metadata:       { report_type: body.report_type, created, failed },
  })

  return NextResponse.json({ created, failed, report_ids: reportIds })
}
