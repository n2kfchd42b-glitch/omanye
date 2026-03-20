// POST /api/field/submissions  — submit data (NGO_STAFF+)
// GET  /api/field/submissions  — list submissions (?program_id=)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fieldSubmissionSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, internalError, validationError } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'

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
  if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) return forbidden()

  const programId = req.nextUrl.searchParams.get('program_id')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  let query = db
    .from('field_submissions')
    .select(`
      *,
      submitter:profiles!submitted_by(full_name),
      reviewer:profiles!reviewed_by(full_name),
      form:field_collection_forms!form_id(id, name)
    `)
    .eq('organization_id', profile.organization_id)
    .order('submission_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query
  if (error) return internalError(error.message)

  const submissions = (data ?? []).map((sub: Record<string, unknown>) => ({
    ...sub,
    submitter_name: (sub.submitter as { full_name: string } | null)?.full_name ?? null,
    reviewer_name:  (sub.reviewer  as { full_name: string } | null)?.full_name ?? null,
    form_id:        (sub.form      as { id: string; name: string } | null)?.id   ?? null,
    form_name:      (sub.form      as { id: string; name: string } | null)?.name ?? null,
    submitter: undefined,
    reviewer:  undefined,
    form:      undefined,
  }))

  return NextResponse.json({ data: submissions })
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

  const parsed = fieldSubmissionSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)
  const body = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_submissions')
    .insert({
      program_id:      body.program_id,
      organization_id: profile.organization_id,
      submitted_by:    user.id,
      form_id:         body.form_id ?? null,
      submission_date: body.submission_date,
      location_name:   body.location_name ?? '',
      location_lat:    body.location_lat  ?? null,
      location_lng:    body.location_lng  ?? null,
      data:            body.data,
      notes:           body.notes         ?? '',
      attachments:     body.attachments   ?? [],
      status:          body.status        ?? 'SUBMITTED',
    })
    .select()
    .single()

  if (error) return internalError(error.message)

  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'field.submission_created',
    entityType:     'field_submission',
    entityId:       (data as Record<string, unknown>).id as string,
    entityName:     body.location_name ?? 'Field Submission',
    metadata:       { program_id: body.program_id },
  })

  return NextResponse.json({ data }, { status: 201 })
}
