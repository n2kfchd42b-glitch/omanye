// POST /api/funders/save — save a funder opportunity for the current org
// Body: { opportunity_id: string }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, conflict, internalError } from '@/lib/api/errors'

export async function POST(req: NextRequest) {
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

  let body: { opportunity_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const { opportunity_id } = body
  if (typeof opportunity_id !== 'string' || !opportunity_id) {
    return internalError('opportunity_id is required')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('funder_saved_opportunities')
    .insert({
      organization_id: profile.organization_id,
      opportunity_id,
      saved_by: user.id,
      status: 'saved',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return conflict('Opportunity already saved')
    return internalError(error.message)
  }

  return NextResponse.json({ data }, { status: 201 })
}
