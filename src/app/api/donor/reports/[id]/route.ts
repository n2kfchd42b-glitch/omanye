// GET /api/donor/reports/:id — report content filtered by donor access level

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SECTIONS_BY_ACCESS } from '@/types/reports'
import type { GeneratedReportContent, ReportSection } from '@/types/reports'
import type { AccessLevel } from '@/lib/supabase/database.types'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // RLS enforces visible_to_donors + active access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: reportRaw, error } = await db
    .from('reports')
    .select('*, programs(name, organization_id), organizations(name)')
    .eq('id', params.id)
    .single()

  if (error || !reportRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const report = reportRaw as Record<string, unknown>

  const { data: grantRaw } = await supabase
    .from('donor_program_access')
    .select('access_level, can_download_reports')
    .eq('donor_id', user.id)
    .eq('program_id', report.program_id as string)
    .eq('active', true)
    .single()

  if (!grantRaw) return NextResponse.json({ error: 'No access' }, { status: 403 })
  const grant = grantRaw as { access_level: string; can_download_reports: boolean }

  const accessLevel  = grant.access_level as AccessLevel
  const allowedSections = SECTIONS_BY_ACCESS[accessLevel]
  const reportSections  = (report.sections as ReportSection[]) ?? []
  const fullContent     = report.content as GeneratedReportContent

  const filteredContent: GeneratedReportContent = {}
  for (const section of reportSections) {
    if (!allowedSections.includes(section)) continue
    if (section === 'EXECUTIVE_SUMMARY'  && fullContent.executiveSummary)  filteredContent.executiveSummary  = fullContent.executiveSummary
    if (section === 'PROGRAM_OVERVIEW'   && fullContent.programOverview)    filteredContent.programOverview   = fullContent.programOverview
    if (section === 'KEY_INDICATORS'     && fullContent.keyIndicators)      filteredContent.keyIndicators     = fullContent.keyIndicators
    if (section === 'BUDGET_SUMMARY'     && fullContent.budgetSummary)      filteredContent.budgetSummary     = fullContent.budgetSummary
    if (section === 'FIELD_DATA_SUMMARY' && fullContent.fieldDataSummary)   filteredContent.fieldDataSummary  = fullContent.fieldDataSummary
    if (section === 'CHALLENGES'         && fullContent.challenges !== undefined) filteredContent.challenges  = fullContent.challenges
    if (section === 'APPENDIX'           && fullContent.appendix)           filteredContent.appendix          = fullContent.appendix
  }

  const result = {
    ...report,
    content:           filteredContent,
    program_name:      (report.programs      as { name: string } | null)?.name ?? null,
    organization_name: (report.organizations as { name: string } | null)?.name ?? null,
    can_download:      grant.can_download_reports,
    access_level:      accessLevel,
    sections:          reportSections.filter((s) => allowedSections.includes(s)),
    programs:          undefined,
    organizations:     undefined,
  }

  return NextResponse.json({ data: result })
}
