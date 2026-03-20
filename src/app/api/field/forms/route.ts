// POST /api/field/forms    — create form (NGO_ADMIN)
// GET  /api/field/forms    — list forms for program (?program_id=)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fieldCollectionFormSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, notFound, internalError, validationError, limitExceeded } from '@/lib/api/errors'
import { checkLimit } from '@/lib/billing/limits'
import { logAction } from '@/lib/audit/logger'

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
    .from('field_collection_forms')
    .select('*, profiles!created_by(full_name)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query
  if (error) return internalError(error.message)

  const forms = (data ?? []).map((f: Record<string, unknown>) => ({
    ...f,
    creator_name: (f.profiles as { full_name: string } | null)?.full_name ?? null,
    profiles: undefined,
  }))

  return NextResponse.json({ data: forms })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id || profile.role !== 'NGO_ADMIN') return forbidden()

  const parsed = fieldCollectionFormSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)
  const body = parsed.data

  // Verify program belongs to this org
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('id', body.program_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound('Program')

  // ── Plan limit check ────────────────────────────────────────────────────────
  const limitCheck = await checkLimit(profile.organization_id, 'field_forms')
  if (!limitCheck.allowed) {
    return limitExceeded(
      `You've reached your field forms limit (${limitCheck.current}/${limitCheck.limit}). Upgrade to add more forms.`
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_collection_forms')
    .insert({
      program_id:      body.program_id,
      organization_id: profile.organization_id,
      name:            body.name.trim(),
      description:     body.description ?? '',
      fields:          body.fields ?? [],
      active:          body.active ?? true,
      created_by:      user.id,
    })
    .select()
    .single()

  if (error) return internalError(error.message)

  void logAction({
    organizationId: profile.organization_id,
    actorId:        user.id,
    actorName:      (profile as Record<string, unknown>).full_name as string ?? 'Unknown',
    actorRole:      profile.role,
    action:         'field.form_created',
    entityType:     'field_form',
    entityId:       (data as Record<string, unknown>).id as string,
    entityName:     body.name,
    metadata:       { program_id: body.program_id },
  })

  return NextResponse.json({ data }, { status: 201 })
}
