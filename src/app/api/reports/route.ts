// POST /api/reports  — create report (DRAFT)
// GET  /api/reports?program_id=  — list reports for program

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createReportSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, notFound, internalError, validationError, limitExceeded } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'
import { checkLimit } from '@/lib/billing/limits'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()

  const programId = req.nextUrl.searchParams.get('program_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  let query = db.from('reports')
    .select('*, programs(name), profiles(full_name)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query
  if (error) return internalError(error.message)

  const reports = ((data as Record<string, unknown>[]) ?? []).map((r) => ({
    ...r,
    program_name: (r.programs as { name: string } | null)?.name ?? null,
    creator_name: (r.profiles as { full_name: string } | null)?.full_name ?? null,
    programs:     undefined,
    profiles:     undefined,
  }))

  return NextResponse.json({ data: reports })
}

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
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  const parsed = createReportSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)
  const body = parsed.data

  // Verify program belongs to this org
  const { data: program } = await supabase
    .from('programs')
    .select('organization_id')
    .eq('id', body.program_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound('Program')

  // ── Plan limit check ────────────────────────────────────────────────────────
  const limitCheck = await checkLimit(profile.organization_id, 'reports_per_month')
  if (!limitCheck.allowed) {
    return limitExceeded(
      `You've reached your monthly report limit (${limitCheck.current}/${limitCheck.limit}). Upgrade to generate more reports.`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db.from('reports')
    .insert({
      program_id:             body.program_id,
      organization_id:        profile.organization_id,
      title:                  body.title,
      report_type:            body.report_type,
      reporting_period_start: body.reporting_period_start ?? null,
      reporting_period_end:   body.reporting_period_end   ?? null,
      sections:               body.sections,
      challenges:             body.challenges ?? null,
      created_by:             user.id,
      status:                 'DRAFT',
    })
    .select()
    .single()

  if (error) return internalError(error.message)

  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'report.created',
    entityType:     'report',
    entityId:       (data as Record<string, unknown>).id as string,
    entityName:     body.title,
    metadata:       { program_id: body.program_id },
  })

  return NextResponse.json({ data }, { status: 201 })
}
