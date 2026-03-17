// GET /api/donor/programs/:programId — get a single program (donor-filtered)
// Enforces: active grant, not expired, access_level applied, no internal_notes.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import { filterProgram } from '@/lib/donorFilter'
import type { Program, Indicator } from '@/lib/programs'

interface RouteParams { params: { programId: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') return forbidden()

  // Verify active access grant (Rule 4: active = true required)
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level, can_download_reports, expires_at, internal_notes')
    .eq('donor_id', user.id)
    .eq('program_id', params.programId)
    .eq('active', true)
    .single()

  if (!grant) return notFound()

  // Check not expired
  if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
    return notFound()
  }

  // Fetch program (must not be PRIVATE)
  const { data: program, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.programId)
    .neq('visibility', 'PRIVATE')
    .is('deleted_at', null)
    .single()

  if (error || !program) return notFound()

  // Fetch visible indicators
  const { data: indicators } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', params.programId)
    .eq('visible_to_donors', true)
    .order('sort_order', { ascending: true })

  // Apply donor filter — strips fields based on access_level (Rule 3)
  // internal_notes is never included in filterProgram output (Rule 2)
  const filtered = filterProgram(
    program as Program,
    grant.access_level,
    (indicators ?? []) as Indicator[],
  )

  return NextResponse.json({
    data: {
      ...filtered,
      can_download_reports: grant.can_download_reports,
      expires_at:           grant.expires_at,
      // internal_notes is explicitly NOT returned (Rule 2)
    },
  })
}
