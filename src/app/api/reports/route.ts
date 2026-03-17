// POST /api/reports  — create report (DRAFT)
// GET  /api/reports?program_id=  — list reports for program

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateReportPayload } from '@/types/reports'
import { logActionForUser } from '@/lib/audit/logger'
import { checkLimit } from '@/lib/billing/limits'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const programId = req.nextUrl.searchParams.get('program_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  let query = db.from('reports')
    .select('*, programs(name), profiles(full_name)')
    .order('created_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body: CreateReportPayload = await req.json()

  const { data: program } = await supabase
    .from('programs')
    .select('organization_id')
    .eq('id', body.program_id)
    .single()

  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  const prog = program as unknown as { organization_id: string }

  // ── Plan limit check ───────────────────────────────────────────────────────
  const limitCheck = await checkLimit(prog.organization_id, 'reports_per_month')
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error:           'LIMIT_EXCEEDED',
        message:         `You've reached your monthly report limit (${limitCheck.current}/${limitCheck.limit}). Upgrade to generate more reports.`,
        limitType:       'reports_per_month',
        current:         limitCheck.current,
        limit:           limitCheck.limit,
        upgradeRequired: limitCheck.upgradeRequired,
      },
      { status: 402 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db.from('reports')
    .insert({
      program_id:             body.program_id,
      organization_id:        prog.organization_id,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logActionForUser(user.id, {
    organizationId: prog.organization_id,
    action:         'report.created',
    entityType:     'report',
    entityId:       (data as Record<string, unknown>).id as string,
    entityName:     body.title,
    metadata:       { program_id: body.program_id },
  })

  return NextResponse.json({ data }, { status: 201 })
}
