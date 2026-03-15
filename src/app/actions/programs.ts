'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { filterProgram } from '@/lib/donorFilter'
import type { Program, CreateProgramPayload, UpdateProgramPayload, DonorProgramView } from '@/lib/programs'
import type { ProgramVisibility } from '@/lib/supabase/database.types'

// ── helpers ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> = { data: T; error: null } | { data: null; error: string }

async function requireNGOEditor() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, supabase, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { user, profile: null, supabase, error: 'Profile not found' }
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) {
    return { user, profile, supabase, error: 'Insufficient permissions' }
  }
  return { user, profile, supabase, error: null }
}

// ── createProgram ─────────────────────────────────────────────────────────────

export async function createProgram(
  payload: CreateProgramPayload,
): Promise<ActionResult<Program>> {
  const { user, profile, supabase, error } = await requireNGOEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('programs')
    .insert({
      organization_id: profile.organization_id,
      name:            payload.name,
      status:          payload.status          ?? 'PLANNING',
      description:     payload.description     ?? null,
      objective:       payload.objective       ?? null,
      start_date:      payload.start_date      ?? null,
      end_date:        payload.end_date        ?? null,
      location_country: payload.location_country ?? null,
      location_region: payload.location_region ?? null,
      primary_funder:  payload.primary_funder  ?? null,
      total_budget:    payload.total_budget    ?? null,
      currency:        payload.currency        ?? 'USD',
      logframe_url:    payload.logframe_url    ?? null,
      tags:            payload.tags            ?? [],
      visibility:      payload.visibility      ?? 'PRIVATE',
    })
    .select()
    .single()

  if (dbError || !data) {
    return { data: null, error: dbError?.message ?? 'Failed to create program' }
  }

  revalidatePath(`/org`)
  return { data: data as Program, error: null }
}

// ── listPrograms ──────────────────────────────────────────────────────────────

export async function listPrograms(): Promise<ActionResult<Program[]>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error: dbError } = await supabase
    .from('programs')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (dbError) return { data: null, error: dbError.message }
  return { data: (data ?? []) as Program[], error: null }
}

// ── getProgram ────────────────────────────────────────────────────────────────

export async function getProgram(id: string): Promise<ActionResult<Program>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error: dbError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Program not found' }
  return { data: data as Program, error: null }
}

// ── updateProgram ─────────────────────────────────────────────────────────────

export async function updateProgram(
  id:      string,
  payload: UpdateProgramPayload,
): Promise<ActionResult<Program>> {
  const { profile, supabase, error } = await requireNGOEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('programs')
    .update(payload as Record<string, unknown>)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to update program' }

  revalidatePath(`/org`)
  return { data: data as Program, error: null }
}

// ── deleteProgram (soft delete) ───────────────────────────────────────────────

export async function deleteProgram(id: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return { data: null, error: 'Only NGO_ADMIN can delete programs' }
  }

  const { error: dbError } = await supabase
    .from('programs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (dbError) return { data: null, error: dbError.message }

  revalidatePath(`/org`)
  return { data: undefined, error: null }
}

// ── updateProgramVisibility ───────────────────────────────────────────────────

export async function updateProgramVisibility(
  id:         string,
  visibility: ProgramVisibility,
): Promise<ActionResult<Program>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return { data: null, error: 'Only NGO_ADMIN can change visibility' }
  }

  const { data, error: dbError } = await supabase
    .from('programs')
    .update({ visibility })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to update visibility' }

  revalidatePath(`/org`)
  return { data: data as Program, error: null }
}

// ── Donor: listDonorPrograms ──────────────────────────────────────────────────

export async function listDonorPrograms(): Promise<ActionResult<DonorProgramView[]>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') {
    return { data: null, error: 'Donor access only' }
  }

  // Get all active grants for this donor
  const { data: grants, error: grantsError } = await supabase
    .from('donor_program_access')
    .select('program_id, access_level')
    .eq('donor_id', user.id)
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

  if (grantsError) return { data: null, error: grantsError.message }
  if (!grants?.length) return { data: [], error: null }

  const programIds = grants.map(g => g.program_id)
  const grantMap = Object.fromEntries(grants.map(g => [g.program_id, g.access_level]))

  // Fetch programs (RLS filters PRIVATE visibility)
  const { data: programs, error: progError } = await supabase
    .from('programs')
    .select('*')
    .in('id', programIds)
    .is('deleted_at', null)
    .neq('visibility', 'PRIVATE')

  if (progError) return { data: null, error: progError.message }

  // Fetch indicators visible to donors for these programs
  const { data: indicators } = await supabase
    .from('indicators')
    .select('*')
    .in('program_id', programIds)
    .eq('visible_to_donors', true)

  const indicatorsByProgram: Record<string, typeof indicators> = {}
  for (const ind of indicators ?? []) {
    if (!indicatorsByProgram[ind.program_id]) indicatorsByProgram[ind.program_id] = []
    indicatorsByProgram[ind.program_id]!.push(ind)
  }

  // Server-side filter based on access level
  const views: DonorProgramView[] = (programs ?? []).map(p => {
    const accessLevel = grantMap[p.id] ?? 'SUMMARY_ONLY'
    return filterProgram(
      p as unknown as import('@/lib/programs').Program,
      accessLevel,
      (indicatorsByProgram[p.id] ?? []) as unknown as import('@/lib/programs').Indicator[],
    )
  })

  return { data: views, error: null }
}

// ── Donor: getDonorProgram ────────────────────────────────────────────────────

export async function getDonorProgram(programId: string): Promise<ActionResult<DonorProgramView>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') {
    return { data: null, error: 'Donor access only' }
  }

  // Verify grant
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level')
    .eq('donor_id', user.id)
    .eq('program_id', programId)
    .eq('active', true)
    .single()

  if (!grant) return { data: null, error: 'No access to this program' }

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .is('deleted_at', null)
    .neq('visibility', 'PRIVATE')
    .single()

  if (!program) return { data: null, error: 'Program not found or not accessible' }

  const { data: indicators } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', programId)
    .eq('visible_to_donors', true)

  const view = filterProgram(
    program as unknown as import('@/lib/programs').Program,
    grant.access_level,
    (indicators ?? []) as unknown as import('@/lib/programs').Indicator[],
  )

  return { data: view, error: null }
}

// ── submitAccessRequest ───────────────────────────────────────────────────────

export async function submitAccessRequest(payload: {
  program_id:             string
  organization_id:        string
  requested_access_level: import('@/lib/supabase/database.types').AccessLevel
  message?:               string
}): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') {
    return { data: null, error: 'Donor access only' }
  }

  const { error: dbError } = await supabase
    .from('donor_access_requests')
    .insert({
      donor_id:               user.id,
      program_id:             payload.program_id,
      organization_id:        payload.organization_id,
      requested_access_level: payload.requested_access_level,
      message:                payload.message ?? null,
    })

  if (dbError) return { data: null, error: dbError.message }
  return { data: undefined, error: null }
}

// ── getPendingAccessRequest ───────────────────────────────────────────────────

export async function getPendingAccessRequest(programId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('donor_access_requests')
    .select('id, status, requested_access_level, created_at')
    .eq('donor_id', user.id)
    .eq('program_id', programId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
