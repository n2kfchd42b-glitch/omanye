// GET /api/funders — list funder opportunities (authenticated users)
// Supports filters: status, focus_area, geography, search, deadline_from, deadline_to
// Supports pagination: limit (max 100, default 20), offset

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const params      = req.nextUrl.searchParams
  const status      = params.get('status')      ?? 'active'
  const focusArea   = params.get('focus_area')
  const geography   = params.get('geography')
  const search      = params.get('search')
  const deadlineFrom = params.get('deadline_from')
  const deadlineTo  = params.get('deadline_to')
  const limit       = Math.min(parseInt(params.get('limit') ?? '20', 10), 100)
  const offset      = parseInt(params.get('offset') ?? '0', 10)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  let query = db
    .from('funder_opportunities')
    .select('*', { count: 'exact' })
    .order('application_deadline', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (focusArea) query = query.contains('focus_areas', [focusArea])
  if (geography) query = query.contains('eligible_geographies', [geography])
  if (search) {
    const safe = search.replace(/[%_\\]/g, '\\$&')
    query = query.or(`funder_name.ilike.%${safe}%,opportunity_title.ilike.%${safe}%,description.ilike.%${safe}%`)
  }
  if (deadlineFrom) query = query.gte('application_deadline', deadlineFrom)
  if (deadlineTo)   query = query.lte('application_deadline', deadlineTo)

  const { data, error, count } = await query

  if (error) return internalError(error.message)

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}
