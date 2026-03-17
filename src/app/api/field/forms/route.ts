// POST /api/field/forms    — create form (NGO_ADMIN)
// GET  /api/field/forms    — list forms for program (?program_id=)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateFormPayload } from '@/types/field'
import { checkLimit } from '@/lib/billing/limits'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Require NGO role and org scoping
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string; organization_id: string } | null
  if (!profile?.organization_id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // NGO_ADMIN only
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string; organization_id: string } | null
  if (!profile || profile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: CreateFormPayload = await req.json()
  if (!body.program_id || !body.name?.trim()) {
    return NextResponse.json({ error: 'program_id and name are required' }, { status: 400 })
  }

  // ── Plan limit check ───────────────────────────────────────────────────────
  const limitCheck = await checkLimit(profile.organization_id, 'field_forms')
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error:           'LIMIT_EXCEEDED',
        message:         `You've reached your field forms limit (${limitCheck.current}/${limitCheck.limit}). Upgrade to add more forms.`,
        limitType:       'field_forms',
        current:         limitCheck.current,
        limit:           limitCheck.limit,
        upgradeRequired: limitCheck.upgradeRequired,
      },
      { status: 402 }
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
      created_by:      user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
