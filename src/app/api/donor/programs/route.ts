// GET /api/donor/programs — list programs the donor has active access to
// Returns filtered program views based on each grant's access_level.
// NEVER returns expenditures or internal_notes.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'
import { filterProgram } from '@/lib/donorFilter'
import type { Program, Indicator } from '@/lib/programs'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') return forbidden()

  // Fetch all active, non-expired access grants
  const { data: grants, error: grantsError } = await supabase
    .from('donor_program_access')
    .select('program_id, access_level, can_download_reports, expires_at, granted_at')
    .eq('donor_id', user.id)
    .eq('active', true)

  if (grantsError) return internalError(grantsError.message)
  if (!grants?.length) return NextResponse.json({ data: [] })

  // Filter out expired grants
  const now = new Date()
  const activeGrants = grants.filter(
    (g) => !g.expires_at || new Date(g.expires_at) > now
  )

  if (!activeGrants.length) return NextResponse.json({ data: [] })

  const programIds = activeGrants.map((g) => g.program_id)

  // Fetch programs (only non-PRIVATE ones)
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('*')
    .in('id', programIds)
    .neq('visibility', 'PRIVATE')
    .is('deleted_at', null)

  if (programsError) return internalError(programsError.message)

  // Fetch visible indicators for all these programs in one query
  const { data: allIndicators } = await supabase
    .from('indicators')
    .select('*')
    .in('program_id', programIds)
    .eq('visible_to_donors', true)

  const indicatorsByProgram = (allIndicators ?? []).reduce<Record<string, Indicator[]>>((acc, ind) => {
    const key = (ind as { program_id: string }).program_id
    if (!acc[key]) acc[key] = []
    acc[key].push(ind as Indicator)
    return acc
  }, {})

  const grantMap = Object.fromEntries(activeGrants.map((g) => [g.program_id, g]))

  const filtered = (programs ?? []).map((prog) => {
    const grant = grantMap[(prog as { id: string }).id]
    if (!grant) return null
    return {
      ...filterProgram(prog as Program, grant.access_level, indicatorsByProgram[(prog as { id: string }).id] ?? []),
      can_download_reports: grant.can_download_reports,
      access_level:         grant.access_level,
      expires_at:           grant.expires_at,
      granted_at:           grant.granted_at,
    }
  }).filter(Boolean)

  return NextResponse.json({ data: filtered })
}
