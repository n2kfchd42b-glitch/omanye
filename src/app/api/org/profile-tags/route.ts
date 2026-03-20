// PATCH /api/org/profile-tags — update NGO profile tags for funder matching
// Body: { focus_areas, eligible_geographies, program_types, annual_budget_range }
// Only NGO_ADMIN role may call this endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'

const VALID_BUDGET_RANGES = ['under_100k', '100k_500k', '500k_1m', '1m_5m', 'above_5m'] as const

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (profile.role !== 'NGO_ADMIN') return forbidden()
  if (!profile.organization_id) return forbidden('No organization found')

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const {
    focus_areas,
    eligible_geographies,
    program_types,
    annual_budget_range,
  } = body as Record<string, unknown>

  // Validate arrays
  if (focus_areas !== undefined && !Array.isArray(focus_areas)) {
    return internalError('focus_areas must be an array')
  }
  if (eligible_geographies !== undefined && !Array.isArray(eligible_geographies)) {
    return internalError('eligible_geographies must be an array')
  }
  if (program_types !== undefined && !Array.isArray(program_types)) {
    return internalError('program_types must be an array')
  }
  if (
    annual_budget_range !== undefined &&
    annual_budget_range !== null &&
    !VALID_BUDGET_RANGES.includes(annual_budget_range as typeof VALID_BUDGET_RANGES[number])
  ) {
    return internalError(`annual_budget_range must be one of: ${VALID_BUDGET_RANGES.join(', ')}`)
  }

  const updates: Record<string, unknown> = {}
  if (focus_areas !== undefined)          updates.focus_areas          = focus_areas
  if (eligible_geographies !== undefined) updates.eligible_geographies = eligible_geographies
  if (program_types !== undefined)        updates.program_types        = program_types
  if (annual_budget_range !== undefined)  updates.annual_budget_range  = annual_budget_range

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return internalError(error.message)

  return NextResponse.json({ success: true })
}
