// POST /api/reports/:id/generate
// Fetches live program data and generates report content.
// Applies donor template (if set) with fallback: donor template → org default → hardcoded defaults.
// Access tier ceiling (SECTIONS_BY_ACCESS) is enforced AFTER template section filtering.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportContent } from '@/lib/reports/generator'
import type { ReportSection } from '@/types/reports'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'
import type { TemplateSectionConfig } from '@/lib/reports/generator'

interface RouteParams { params: { id: string } }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: report, error: fetchErr } = await db
    .from('reports')
    .select('*, programs(organization_id)')
    .eq('id', params.id)
    .single()

  if (fetchErr || !report) return notFound('Report')

  const r    = report as Record<string, unknown>
  const prog = r.programs as { organization_id: string } | null
  if (prog?.organization_id !== profile.organization_id) return notFound('Report')

  // ── Resolve template via fallback chain ─────────────────────────────────────
  //   1. donor-specific template (if report has donor_id + matching report_type)
  //   2. org-level default template (donor_id IS NULL)
  //   3. no template — use hardcoded sections as-is

  const donorId    = r.donor_id    as string | null
  const templateId = r.template_id as string | null
  const overrides  = r.overrides   as Record<string, unknown> | null

  let templateSections: TemplateSectionConfig[] | undefined

  // If report has an explicit template_id, use it directly
  if (templateId) {
    const { data: tpl } = await db
      .from('report_templates')
      .select('sections')
      .eq('id', templateId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (tpl?.sections) templateSections = tpl.sections as TemplateSectionConfig[]
  } else if (donorId) {
    // Fallback chain: donor-specific → org default
    const { data: donorTpl } = await db
      .from('report_templates')
      .select('sections')
      .eq('organization_id', profile.organization_id)
      .eq('donor_id', donorId)
      .eq('report_type', r.report_type as string)
      .maybeSingle()

    if (donorTpl?.sections) {
      templateSections = donorTpl.sections as TemplateSectionConfig[]
    } else {
      // Try org-level default
      const { data: orgTpl } = await db
        .from('report_templates')
        .select('sections')
        .eq('organization_id', profile.organization_id)
        .is('donor_id', null)
        .eq('report_type', r.report_type as string)
        .eq('is_default', true)
        .maybeSingle()

      if (orgTpl?.sections) templateSections = orgTpl.sections as TemplateSectionConfig[]
    }
  }

  // Apply one-time overrides (stored in report.overrides) on top of template
  if (overrides?.sections && Array.isArray(overrides.sections)) {
    const overrideSections = overrides.sections as TemplateSectionConfig[]
    if (templateSections) {
      const overrideMap = new Map(overrideSections.map(s => [s.section_key, s]))
      templateSections = templateSections.map(ts => {
        const ovr = overrideMap.get(ts.section_key)
        return ovr ? { ...ts, ...ovr } : ts
      })
    } else {
      templateSections = overrideSections
    }
  }

  const content = await generateReportContent(
    r.program_id as string,
    (r.sections as ReportSection[]) ?? [],
    (r.reporting_period_start as string | null) ?? null,
    (r.reporting_period_end   as string | null) ?? null,
    (r.challenges             as string | null) ?? null,
    templateSections,
  )

  const { data, error } = await db
    .from('reports')
    .update({ content, status: 'GENERATED', generated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return internalError(error.message)

  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'report.generated',
    entityType:     'report',
    entityId:       params.id,
    entityName:     r.title as string,
    metadata:       { program_id: r.program_id as string },
  })

  return NextResponse.json({ data })
}
