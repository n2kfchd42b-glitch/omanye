// GET  /api/indicators?program_id=  — list indicators for a program
// POST /api/indicators              — create indicator (NGO_ADMIN | NGO_STAFF)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import { logAction } from '@/lib/audit/logger'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const programId = req.nextUrl.searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()

  // Verify program belongs to org
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('id', programId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound()

  const { data, error } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (error) return internalError(error.message)

  return NextResponse.json({ data: data ?? [] })
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

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  const body = await req.json()

  // Verify program belongs to org
  const { data: program } = await supabase
    .from('programs')
    .select('id, name')
    .eq('id', body.program_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound()

  const { data, error } = await supabase
    .from('indicators')
    .insert({
      program_id:       body.program_id,
      organization_id:  profile.organization_id,
      name:             body.name,
      target_value:     body.target_value     ?? null,
      unit:             body.unit             ?? null,
      baseline_value:   body.baseline_value   ?? null,
      current_value:    0,
      frequency:        body.frequency        ?? 'MONTHLY',
      visible_to_donors: body.visible_to_donors ?? false,
      description:      body.description      ?? null,
      sort_order:       body.sort_order       ?? 0,
      created_by:       user.id,
    })
    .select()
    .single()

  if (error || !data) return internalError(error?.message ?? 'Insert failed')

  const ind = data as { id: string; name: string }
  void logAction({
    organizationId: profile.organization_id,
    actorId:        user.id,
    actorName:      (profile as Record<string, unknown>).full_name as string ?? 'Unknown',
    actorRole:      profile.role,
    action:         'indicator.created',
    entityType:     'indicator',
    entityId:       ind.id,
    entityName:     ind.name,
  })

  return NextResponse.json({ data }, { status: 201 })
}
