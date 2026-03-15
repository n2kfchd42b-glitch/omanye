'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  Indicator,
  IndicatorUpdate,
  ProgramUpdate,
  CreateIndicatorPayload,
  SubmitIndicatorUpdatePayload,
  CreateProgramUpdatePayload,
} from '@/lib/programs'

// ── helpers ───────────────────────────────────────────────────────────────────

type ActionResult<T = void> = { data: T; error: null } | { data: null; error: string }

async function requireEditor() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, supabase, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) {
    return { user, profile: null, supabase, error: 'Insufficient permissions' }
  }
  return { user, profile, supabase, error: null }
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, supabase, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return { user, profile: null, supabase, error: 'NGO_ADMIN only' }
  }
  return { user, profile, supabase, error: null }
}

// ── createIndicator ───────────────────────────────────────────────────────────

export async function createIndicator(
  payload: CreateIndicatorPayload,
): Promise<ActionResult<Indicator>> {
  const { user, profile, supabase, error } = await requireEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('indicators')
    .insert({
      program_id:         payload.program_id,
      organization_id:    profile.organization_id,
      name:               payload.name,
      description:        payload.description       ?? null,
      category:           payload.category          ?? null,
      unit:               payload.unit              ?? null,
      target_value:       payload.target_value      ?? null,
      baseline_value:     payload.baseline_value    ?? null,
      frequency:          payload.frequency         ?? 'MONTHLY',
      data_source:        payload.data_source       ?? null,
      is_key_indicator:   payload.is_key_indicator  ?? false,
      visible_to_donors:  payload.visible_to_donors ?? false,
      sort_order:         payload.sort_order        ?? 0,
      created_by:         user!.id,
    })
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to create indicator' }

  revalidatePath('/org')
  return { data: data as Indicator, error: null }
}

// ── listIndicators ────────────────────────────────────────────────────────────

export async function listIndicators(programId: string): Promise<ActionResult<Indicator[]>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error: dbError } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (dbError) return { data: null, error: dbError.message }
  return { data: (data ?? []) as Indicator[], error: null }
}

// ── updateIndicator ───────────────────────────────────────────────────────────

export async function updateIndicator(
  id:      string,
  payload: Partial<CreateIndicatorPayload>,
): Promise<ActionResult<Indicator>> {
  const { profile, supabase, error } = await requireEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('indicators')
    .update(payload as Record<string, unknown>)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to update indicator' }

  revalidatePath('/org')
  return { data: data as Indicator, error: null }
}

// ── deleteIndicator ───────────────────────────────────────────────────────────

export async function deleteIndicator(id: string): Promise<ActionResult> {
  const { profile, supabase, error } = await requireAdmin()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { error: dbError } = await supabase
    .from('indicators')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)

  if (dbError) return { data: null, error: dbError.message }

  revalidatePath('/org')
  return { data: undefined, error: null }
}

// ── toggleIndicatorVisibility ─────────────────────────────────────────────────

export async function toggleIndicatorVisibility(
  id:               string,
  visibleToDonors:  boolean,
): Promise<ActionResult<Indicator>> {
  const { profile, supabase, error } = await requireAdmin()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('indicators')
    .update({ visible_to_donors: visibleToDonors })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to update' }

  revalidatePath('/org')
  return { data: data as Indicator, error: null }
}

// ── toggleKeyIndicator ────────────────────────────────────────────────────────

export async function toggleKeyIndicator(
  id:             string,
  isKeyIndicator: boolean,
): Promise<ActionResult<Indicator>> {
  const { profile, supabase, error } = await requireAdmin()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('indicators')
    .update({ is_key_indicator: isKeyIndicator })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to update' }

  revalidatePath('/org')
  return { data: data as Indicator, error: null }
}

// ── submitIndicatorUpdate ─────────────────────────────────────────────────────

export async function submitIndicatorUpdate(
  indicatorId: string,
  payload:     SubmitIndicatorUpdatePayload,
): Promise<ActionResult<IndicatorUpdate>> {
  const { user, profile, supabase, error } = await requireEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  // Get current indicator to capture previous value and program_id
  const { data: indicator, error: indError } = await supabase
    .from('indicators')
    .select('id, program_id, organization_id, current_value')
    .eq('id', indicatorId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (indError || !indicator) {
    return { data: null, error: indError?.message ?? 'Indicator not found' }
  }

  // Insert the update record (append-only)
  const { data: updateRecord, error: updateError } = await supabase
    .from('indicator_updates')
    .insert({
      indicator_id:           indicatorId,
      program_id:             indicator.program_id,
      organization_id:        profile.organization_id,
      previous_value:         indicator.current_value,
      new_value:              payload.new_value,
      reporting_period_start: payload.reporting_period_start ?? null,
      reporting_period_end:   payload.reporting_period_end   ?? null,
      notes:                  payload.notes                  ?? null,
      source:                 payload.source                 ?? null,
      submitted_by:           user!.id,
    })
    .select()
    .single()

  if (updateError || !updateRecord) {
    return { data: null, error: updateError?.message ?? 'Failed to submit update' }
  }

  // Update current_value on the indicator itself
  await supabase
    .from('indicators')
    .update({ current_value: payload.new_value })
    .eq('id', indicatorId)

  revalidatePath('/org')
  return { data: updateRecord as IndicatorUpdate, error: null }
}

// ── getIndicatorUpdates ───────────────────────────────────────────────────────

export async function getIndicatorUpdates(
  indicatorId: string,
): Promise<ActionResult<IndicatorUpdate[]>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error: dbError } = await supabase
    .from('indicator_updates')
    .select('*')
    .eq('indicator_id', indicatorId)
    .order('submitted_at', { ascending: false })

  if (dbError) return { data: null, error: dbError.message }
  return { data: (data ?? []) as IndicatorUpdate[], error: null }
}

// ── Program Updates ───────────────────────────────────────────────────────────

export async function createProgramUpdate(
  programId: string,
  payload:   CreateProgramUpdatePayload,
): Promise<ActionResult<ProgramUpdate>> {
  const { user, profile, supabase, error } = await requireEditor()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { data, error: dbError } = await supabase
    .from('program_updates')
    .insert({
      program_id:        programId,
      organization_id:   profile.organization_id,
      title:             payload.title,
      body:              payload.body              ?? null,
      update_type:       payload.update_type       ?? 'PROGRESS',
      visible_to_donors: payload.visible_to_donors ?? false,
      attachments:       payload.attachments       ?? [],
      published_at:      payload.published_at      ?? new Date().toISOString(),
      created_by:        user!.id,
    })
    .select()
    .single()

  if (dbError || !data) return { data: null, error: dbError?.message ?? 'Failed to create update' }

  revalidatePath('/org')
  return { data: data as ProgramUpdate, error: null }
}

export async function listProgramUpdates(
  programId: string,
): Promise<ActionResult<ProgramUpdate[]>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error: dbError } = await supabase
    .from('program_updates')
    .select('*')
    .eq('program_id', programId)
    .order('published_at', { ascending: false })

  if (dbError) return { data: null, error: dbError.message }
  return { data: (data ?? []) as ProgramUpdate[], error: null }
}

export async function toggleUpdateDonorVisibility(
  updateId:         string,
  visibleToDonors:  boolean,
): Promise<ActionResult> {
  const { profile, supabase, error } = await requireAdmin()
  if (error || !profile?.organization_id) {
    return { data: null, error: error ?? 'No organization' }
  }

  const { error: dbError } = await supabase
    .from('program_updates')
    .update({ visible_to_donors: visibleToDonors })
    .eq('id', updateId)
    .eq('organization_id', profile.organization_id)

  if (dbError) return { data: null, error: dbError.message }

  revalidatePath('/org')
  return { data: undefined, error: null }
}

// ── getDonorProgramIndicators ─────────────────────────────────────────────────

export async function getDonorProgramIndicators(programId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Verify donor has access with INDICATORS+ level
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level')
    .eq('donor_id', user.id)
    .eq('program_id', programId)
    .eq('active', true)
    .single()

  if (!grant || grant.access_level === 'SUMMARY_ONLY') {
    return { data: [], error: null }
  }

  // RLS also enforces this, but we layer it here for defense in depth
  const { data, error: dbError } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', programId)
    .eq('visible_to_donors', true)
    .order('sort_order', { ascending: true })

  if (dbError) return { data: null, error: dbError.message }
  return { data: data ?? [], error: null }
}
