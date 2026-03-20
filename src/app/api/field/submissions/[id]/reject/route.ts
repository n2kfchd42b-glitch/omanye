// PATCH /api/field/submissions/:id/reject
// Rejects a flagged submission from the moderation queue.
// Body: { rejection_reason: string }
// Keeps status as FLAGGED, records the rejection_reason, marks reviewed.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'

interface RouteParams { params: { id: string } }

const bodySchema = z.object({
  rejection_reason: z.string().min(3).max(500),
})

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'rejection_reason is required (3–500 chars)' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_submissions')
    .update({
      status:           'FLAGGED',          // Remains flagged — caller can delete if needed
      reviewed_by:      user.id,
      reviewed_at:      new Date().toISOString(),
      rejection_reason: parsed.data.rejection_reason,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const d = data as Record<string, unknown>
  void logActionForUser(user.id, {
    action:     'field.submission_flagged',
    entityType: 'field_submission',
    entityId:   params.id,
    entityName: (d.location_name as string) ?? 'Field Submission',
    metadata:   {
      program_id:       d.program_id as string,
      rejection_reason: parsed.data.rejection_reason,
      via:              'moderation_queue',
    },
  })

  return NextResponse.json({ data })
}
