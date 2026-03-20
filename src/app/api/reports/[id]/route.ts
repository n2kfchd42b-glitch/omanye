// GET    /api/reports/:id  — get single report (org-scoped)
// PATCH  /api/reports/:id  — update report metadata (NGO_ADMIN | NGO_STAFF)
// DELETE /api/reports/:id  — delete DRAFT only (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateReportPayload } from '@/types/reports'
import { unauthorized, forbidden, notFound, internalError, conflict } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'

interface RouteParams { params: { id: string } }

async function requireNGOProfile(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { user, profile: null }
  return { user, profile: profile as { role: string; organization_id: string } }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { user, profile } = await requireNGOProfile(supabase)
  if (!user) return unauthorized()
  if (!profile) return unauthorized()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('reports')
    .select('*, programs(name, organization_id), profiles(full_name), organizations(name)')
    .eq('id', params.id)
    .single()

  if (error || !data) return notFound()

  const r = data as Record<string, unknown>

  // ── Org scoping: ensure report belongs to caller's org ────────────────────
  const prog = r.programs as { name: string; organization_id: string } | null
  if (prog?.organization_id !== profile.organization_id) return notFound()

  const report = {
    ...r,
    program_name:      prog?.name ?? null,
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
  const { user, profile } = await requireNGOProfile(supabase)
  if (!user) return unauthorized()
  if (!profile) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  // Verify report belongs to org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: existing } = await db
    .from('reports')
    .select('id, programs(organization_id)')
    .eq('id', params.id)
    .single()

  if (!existing) return notFound()
  const prog = (existing as Record<string, unknown>).programs as { organization_id: string } | null
  if (prog?.organization_id !== profile.organization_id) return notFound()

  const body: UpdateReportPayload = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.title                  !== undefined) updates.title                   = body.title
  if (body.report_type            !== undefined) updates.report_type             = body.report_type
  if (body.reporting_period_start !== undefined) updates.reporting_period_start  = body.reporting_period_start
  if (body.reporting_period_end   !== undefined) updates.reporting_period_end    = body.reporting_period_end
  if (body.sections               !== undefined) updates.sections                = body.sections
  if (body.challenges             !== undefined) updates.challenges              = body.challenges

  const { data, error } = await db.from('reports').update(updates).eq('id', params.id).select().single()

  if (error) return internalError(error.message)
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { user, profile } = await requireNGOProfile(supabase)
  if (!user) return unauthorized()
  if (!profile) return unauthorized()
  if (profile.role !== 'NGO_ADMIN') return forbidden()

  // Verify report belongs to org and is a DRAFT
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: existing } = await db
    .from('reports')
    .select('id, title, status, program_id, programs(organization_id)')
    .eq('id', params.id)
    .single()

  if (!existing) return notFound()
  const r = existing as Record<string, unknown>
  const prog = r.programs as { organization_id: string } | null
  if (prog?.organization_id !== profile.organization_id) return notFound()
  if (r.status !== 'DRAFT') return conflict('Only DRAFT reports can be deleted')

  const { error } = await db.from('reports').delete().eq('id', params.id)

  if (error) return internalError(error.message)

  void logActionForUser(user!.id, {
    organizationId: profile.organization_id,
    action:         'report.deleted',
    entityType:     'report',
    entityId:       params.id,
    entityName:     r.title as string,
    metadata:       { program_id: r.program_id as string },
  })

  return NextResponse.json({ data: null })
}
