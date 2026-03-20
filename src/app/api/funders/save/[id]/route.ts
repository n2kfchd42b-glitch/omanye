// PATCH /api/funders/save/[id] — update status or notes on a saved opportunity
// DELETE /api/funders/save/[id] — remove a saved opportunity

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'

type Params = { params: { id: string } }

async function getRecord(supabase: ReturnType<typeof createClient>, id: string, orgId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('funder_saved_opportunities')
    .select('id, organization_id')
    .eq('id', id)
    .single()
  if (error || !data) return null
  if (data.organization_id !== orgId) return null
  return data
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()
  if (!profile.organization_id) return forbidden('No organization found')

  const record = await getRecord(supabase, params.id, profile.organization_id)
  if (!record) return notFound('Saved opportunity')

  let body: { status?: unknown; notes?: unknown }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const VALID_STATUSES = ['saved', 'applied', 'declined']
  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as string)) return internalError('Invalid status')
    updates.status = body.status
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ data: record })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('funder_saved_opportunities')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return internalError(error.message)

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()
  if (!profile.organization_id) return forbidden('No organization found')

  const record = await getRecord(supabase, params.id, profile.organization_id)
  if (!record) return notFound('Saved opportunity')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { error } = await db
    .from('funder_saved_opportunities')
    .delete()
    .eq('id', params.id)

  if (error) return internalError(error.message)

  return new NextResponse(null, { status: 204 })
}
