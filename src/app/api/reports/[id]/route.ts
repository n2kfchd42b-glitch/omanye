// GET    /api/reports/:id  — get single report
// PATCH  /api/reports/:id  — update report metadata
// DELETE /api/reports/:id  — delete DRAFT only

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateReportPayload } from '@/types/reports'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('reports')
    .select('*, programs(name), profiles(full_name), organizations(name)')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const r = data as Record<string, unknown>
  const report = {
    ...r,
    program_name:      (r.programs      as { name: string } | null)?.name ?? null,
    creator_name:      (r.profiles      as { full_name: string } | null)?.full_name ?? null,
    organization_name: (r.organizations as { name: string } | null)?.name ?? null,
    programs:      undefined,
    profiles:      undefined,
    organizations: undefined,
  }

  return NextResponse.json({ data: report })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body: UpdateReportPayload = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.title                  !== undefined) updates.title                   = body.title
  if (body.report_type            !== undefined) updates.report_type             = body.report_type
  if (body.reporting_period_start !== undefined) updates.reporting_period_start  = body.reporting_period_start
  if (body.reporting_period_end   !== undefined) updates.reporting_period_end    = body.reporting_period_end
  if (body.sections               !== undefined) updates.sections                = body.sections
  if (body.challenges             !== undefined) updates.challenges              = body.challenges

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db.from('reports').update(updates).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { error } = await db.from('reports').delete().eq('id', params.id).eq('status', 'DRAFT')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
