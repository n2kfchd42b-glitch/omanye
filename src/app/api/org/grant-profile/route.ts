// PATCH /api/org/grant-profile — update NGO grant writing profile
// Body: { mission_statement, founding_year, beneficiary_types, past_program_summaries, key_achievements, typical_budget_range }
// Only NGO_ADMIN role may call this endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'

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
    mission_statement,
    founding_year,
    beneficiary_types,
    past_program_summaries,
    key_achievements,
    typical_budget_range,
  } = body as Record<string, unknown>

  // Validate founding_year
  if (founding_year !== undefined && founding_year !== null) {
    const yr = Number(founding_year)
    if (isNaN(yr) || yr < 1900 || yr > new Date().getFullYear()) {
      return internalError(`founding_year must be between 1900 and ${new Date().getFullYear()}`)
    }
  }

  // Validate beneficiary_types
  if (beneficiary_types !== undefined && !Array.isArray(beneficiary_types)) {
    return internalError('beneficiary_types must be an array')
  }

  const updates: Record<string, unknown> = {}
  if (mission_statement !== undefined)      updates.mission_statement      = mission_statement || null
  if (founding_year !== undefined)          updates.founding_year          = founding_year ? Number(founding_year) : null
  if (beneficiary_types !== undefined)      updates.beneficiary_types      = beneficiary_types
  if (past_program_summaries !== undefined) updates.past_program_summaries = past_program_summaries || null
  if (key_achievements !== undefined)       updates.key_achievements       = key_achievements || null
  if (typical_budget_range !== undefined)   updates.typical_budget_range   = typical_budget_range || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return internalError(error.message)

  return NextResponse.json({ success: true })
}
