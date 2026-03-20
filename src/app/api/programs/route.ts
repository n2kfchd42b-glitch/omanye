// GET  /api/programs?org_slug=   — list programs for org
// POST /api/programs             — create program (NGO_ADMIN | NGO_STAFF only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { programSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, internalError, limitExceeded, validationError } from '@/lib/api/errors'
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

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

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

  // ── Plan limit check ───────────────────────────────────────────────────────
  const limitCheck = await checkLimit(profile.organization_id, 'programs')
  if (!limitCheck.allowed) {
    return limitExceeded(
      `Program limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade to add more programs.`
    )
  }

  const parsed = programSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)
  const body = parsed.data

  const { data, error } = await supabase
    .from('programs')
    .insert({
      organization_id:  profile.organization_id,
      name:             body.name,
      status:           body.status           ?? 'PLANNING',
      description:      body.description      ?? null,
      objective:        body.objective        ?? null,
      start_date:       body.start_date       ?? null,
      end_date:         body.end_date         ?? null,
      total_budget:     body.total_budget     ?? null,
      currency:         body.currency         ?? 'USD',
      tags:             body.tags             ?? [],
      visibility:       body.visibility       ?? 'PRIVATE',
      location:         body.location         ?? null,
      location_country: body.location_country ?? null,
      location_region:  body.location_region  ?? null,
      primary_funder:   body.primary_funder   ?? null,
      logframe_url:     body.logframe_url     ?? null,
      created_by:       user.id,
    })
    .select()
    .single()

  if (error || !data) return internalError(error?.message ?? 'Insert failed')

  const prog = data as { id: string; name: string }
  void logAction({
    organizationId: profile.organization_id,
    actorId:        user.id,
    actorName:      (profile as Record<string, unknown>).full_name as string ?? 'Unknown',
    actorRole:      profile.role,
    action:         'program.created',
    entityType:     'program',
    entityId:       prog.id,
    entityName:     prog.name,
  })

  return NextResponse.json({ data }, { status: 201 })
}
