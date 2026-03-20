// POST /api/reports/:id/archive — move a GENERATED or SUBMITTED report to ARCHIVED (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError, conflict } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'

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
  if (profile.role !== 'NGO_ADMIN') return forbidden()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: existing } = await db
    .from('reports')
    .select('id, title, status, program_id, programs(organization_id)')
    .eq('id', params.id)
    .single()

  if (!existing) return notFound('Report')

  const r = existing as Record<string, unknown>
  const prog = r.programs as { organization_id: string } | null
  if (prog?.organization_id !== profile.organization_id) return notFound('Report')

  // Only GENERATED or SUBMITTED reports can be archived
  if (!['GENERATED', 'SUBMITTED'].includes(r.status as string)) {
    return conflict('Only GENERATED or SUBMITTED reports can be archived')
  }

  const { data, error } = await db
    .from('reports')
    .update({ status: 'ARCHIVED' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return internalError(error.message)

  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'report.archived',
    entityType:     'report',
    entityId:       params.id,
    entityName:     r.title as string,
    metadata:       { program_id: r.program_id as string, previous_status: r.status as string },
  })

  return NextResponse.json({ data })
}
