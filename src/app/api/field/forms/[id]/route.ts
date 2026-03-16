// PATCH  /api/field/forms/:id  — update form (NGO_ADMIN)
// DELETE /api/field/forms/:id  — deactivate form (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateFormPayload } from '@/types/field'

interface RouteParams { params: { id: string } }

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

  const body: UpdateFormPayload = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.name        !== undefined) updates.name        = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.fields      !== undefined) updates.fields      = body.fields
  if (body.active      !== undefined) updates.active      = body.active

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_collection_forms')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

  // Deactivate, don't hard-delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { error } = await db
    .from('field_collection_forms')
    .update({ active: false })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
