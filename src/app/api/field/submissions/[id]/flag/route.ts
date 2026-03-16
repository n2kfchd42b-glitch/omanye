// PATCH /api/field/submissions/:id/flag — flag for follow-up (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'
import { sendNotification, getOrgAdmins } from '@/lib/notifications/sender'

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
    .update({ status: 'FLAGGED' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const d = data as Record<string, unknown>
  const orgId = d.organization_id as string
  const programId = d.program_id as string

  void logActionForUser(user.id, {
    organizationId: orgId,
    action:         'field.submission_flagged',
    entityType:     'field_submission',
    entityId:       params.id,
    entityName:     d.location_name as string ?? 'Field Submission',
    metadata:       { program_id: programId },
  })

  // Notify NGO_ADMINs + the submitter
  void (async () => {
    const admins = await getOrgAdmins(orgId)
    const submittedBy = d.submitted_by as string
    const allRecipients = Array.from(new Set([...admins.map(a => a.id), submittedBy]))

    // Fetch program name
    const { adminClient } = await import('@/lib/supabase/admin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: prog } = await (adminClient as any).from('programs').select('name').eq('id', programId).single()
    const progName = (prog as { name: string } | null)?.name ?? 'program'

    await Promise.all(allRecipients.map(rid => sendNotification({
      organizationId: orgId,
      recipientId:    rid,
      type:           'FIELD_SUBMISSION_FLAGGED',
      title:          `Field submission flagged for ${progName}`,
      body:           `A field submission was flagged for follow-up.`,
      link:           `/org/field`,
      priority:       'MEDIUM',
    })))
  })()

  return NextResponse.json({ data })
}
