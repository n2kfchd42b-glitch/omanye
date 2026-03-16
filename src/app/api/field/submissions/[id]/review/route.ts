// PATCH /api/field/submissions/:id/review — mark reviewed (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'

interface RouteParams { params: { id: string } }

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string } | null
  if (!profile || profile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_submissions')
    .update({ status: 'REVIEWED', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const d = data as Record<string, unknown>
  void logActionForUser(user.id, {
    action:     'field.submission_reviewed',
    entityType: 'field_submission',
    entityId:   params.id,
    entityName: d.location_name as string ?? 'Field Submission',
    metadata:   { program_id: d.program_id as string },
  })

  return NextResponse.json({ data })
}
