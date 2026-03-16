'use server'

// ── OMANYE Donor Management — Server Actions ───────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'
import { sendNotification as sendNGONotification, getOrgAdmins } from '@/lib/notifications/sender'
import type {
  DonorInvitation,
  DonorRelationship,
  DonorProgramAccessExtended,
  DonorActivitySummary,
  InviteDonorPayload,
  UpdateDonorAccessPayload,
  GrantProgramAccessPayload,
  ApproveAccessRequestPayload,
  DenyAccessRequestPayload,
} from '@/lib/donors'
import type { DonorAccessRequest } from '@/lib/auth/types'
import type { AccessLevel } from '@/lib/supabase/database.types'

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// ── Helper: send notification ──────────────────────────────────────────────────

async function sendNotification(supabase: ReturnType<typeof createClient>, opts: {
  donor_id:        string
  organization_id: string
  program_id?:     string
  type:            import('@/lib/donors').DonorNotificationType
  title:           string
  body:            string
  link?:           string
}) {
  await supabase.from('donor_notifications').insert({
    donor_id:        opts.donor_id,
    organization_id: opts.organization_id,
    program_id:      opts.program_id ?? null,
    type:            opts.type,
    title:           opts.title,
    body:            opts.body,
    link:            opts.link ?? null,
  })
  // Fire-and-forget — errors silently ignored
}

// ── Invitation Actions ────────────────────────────────────────────────────────

export async function inviteDonor(
  organizationId: string,
  payload:        InviteDonorPayload,
): Promise<ActionResult<DonorInvitation>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  // Check if email already has an OMANYE account
  // If they do — grant access directly and notify rather than invite
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'DONOR')
    .maybeSingle()

  // Get program details for email
  const { data: program } = await supabase
    .from('programs')
    .select('name, description')
    .eq('id', payload.program_id)
    .single()

  // Create invitation record
  const expiresAt = payload.expires_at ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await supabase
    .from('donor_invitations')
    .insert({
      organization_id:      organizationId,
      program_id:           payload.program_id,
      invited_by:           user.id,
      email:                payload.email.toLowerCase().trim(),
      donor_name:           payload.donor_name ?? null,
      organization_name:    payload.organization_name ?? null,
      access_level:         payload.access_level,
      can_download_reports: payload.can_download_reports ?? false,
      message:              payload.message ?? null,
      status:               'PENDING',
      expires_at:           expiresAt,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  void logActionForUser(user.id, {
    organizationId,
    action:     'donor.invited',
    entityType: 'donor_invitation',
    entityId:   (invitation as Record<string, unknown>).id as string,
    entityName: payload.donor_name ?? payload.email,
    metadata:   { program_id: payload.program_id, access_level: payload.access_level },
  })

  // Trigger edge function for invitation email (fire-and-forget)
  supabase.functions.invoke('send-donor-invitation', {
    body: {
      invitation_id: invitation.id,
      token:         invitation.token,
      email:         payload.email,
      donor_name:    payload.donor_name,
      program_name:  program?.name,
      access_level:  payload.access_level,
      message:       payload.message,
    },
  }).catch(() => {/* email failure should not block the action */})

  return { data: invitation as DonorInvitation, error: null }
}

export async function listInvitations(
  organizationId: string,
  programId?:     string,
): Promise<ActionResult<DonorInvitation[]>> {
  const supabase = createClient()

  // Expire stale invitations
  try { await supabase.rpc('expire_pending_invitations') } catch { /* ignore */ }

  let query = supabase
    .from('donor_invitations')
    .select(`
      *,
      program:programs(name),
      inviter:profiles!donor_invitations_invited_by_fkey(full_name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (programId) query = query.eq('program_id', programId)

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    program_name:  (row.program as { name: string } | null)?.name ?? null,
    inviter_name:  (row.inviter as { full_name: string } | null)?.full_name ?? null,
  }))

  return { data: rows as DonorInvitation[], error: null }
}

export async function revokeInvitation(
  invitationId: string,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('donor_invitations')
    .update({ status: 'REVOKED' })
    .eq('id', invitationId)
    .eq('status', 'PENDING')

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

// ── Public: Validate invite token ─────────────────────────────────────────────

export async function validateInviteToken(
  token: string,
): Promise<ActionResult<DonorInvitation & { program_name: string | null; org_name: string | null }>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('donor_invitations')
    .select(`
      *,
      program:programs(name, description),
      organization:organizations(name, logo_url)
    `)
    .eq('token', token)
    .single()

  if (error || !data) return { data: null, error: 'Invitation not found' }

  // Check expiry
  if (data.status === 'REVOKED')  return { data: null, error: 'INVITATION_REVOKED' }
  if (data.status === 'ACCEPTED') return { data: null, error: 'ALREADY_ACCEPTED' }
  if (data.status === 'EXPIRED' || new Date(data.expires_at) < new Date()) {
    return { data: null, error: 'INVITATION_EXPIRED' }
  }

  return {
    data: {
      ...data,
      program_name: (data.program as unknown as { name: string } | null)?.name ?? null,
      org_name:     (data.organization as unknown as { name: string } | null)?.name ?? null,
    } as DonorInvitation & { program_name: string | null; org_name: string | null },
    error: null,
  }
}

// ── Accept Invitation ─────────────────────────────────────────────────────────

export async function acceptInvitation(
  token: string,
): Promise<ActionResult<{ program_id: string; organization_id: string }>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Must be logged in to accept invitation' }

  const { data: result, error } = await supabase.rpc('accept_invitation', {
    p_token:    token,
    p_donor_id: user.id,
  })

  if (error) return { data: null, error: error.message }

  const res = result as { error?: string; success?: boolean; program_id?: string; organization_id?: string; access_level?: string }

  if (res.error) {
    const errorMessages: Record<string, string> = {
      INVITATION_NOT_FOUND: 'Invitation not found',
      ALREADY_ACCEPTED:     'This invitation has already been accepted',
      INVITATION_REVOKED:   'This invitation has been revoked',
      INVITATION_EXPIRED:   'This invitation has expired',
    }
    return { data: null, error: errorMessages[res.error] ?? res.error }
  }

  // Send notification to donor
  if (res.program_id && res.organization_id) {
    await sendNotification(supabase, {
      donor_id:        user.id,
      organization_id: res.organization_id,
      program_id:      res.program_id,
      type:            'ACCESS_GRANTED',
      title:           'Program access granted',
      body:            `You now have access to a program. Access level: ${res.access_level ?? 'SUMMARY_ONLY'}.`,
      link:            `/donor/programs/${res.program_id}`,
    })
  }

  return {
    data: { program_id: res.program_id!, organization_id: res.organization_id! },
    error: null,
  }
}

// ── Donor List (NGO view) ─────────────────────────────────────────────────────

export async function listDonors(
  organizationId: string,
): Promise<ActionResult<DonorRelationship[]>> {
  const supabase = createClient()

  // Get all active DPA rows for this org with donor profile info
  const { data: dpaRows, error } = await supabase
    .from('donor_program_access')
    .select(`
      id, donor_id, program_id, organization_id, granted_by, access_level,
      can_download_reports, active, granted_at, expires_at,
      nickname, last_viewed_at, view_count
    `)
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('granted_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  if (!dpaRows || dpaRows.length === 0) return { data: [], error: null }

  // Get unique donor IDs
  const donorIds = Array.from(new Set(dpaRows.map((r: Record<string, unknown>) => r.donor_id as string)))

  // Fetch donor profiles in parallel
  const [profilesResult, donorProfilesResult, programsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')
      .in('id', donorIds),
    supabase
      .from('donor_profiles')
      .select('id, organization_name, contact_email')
      .in('id', donorIds),
    supabase
      .from('programs')
      .select('id, name, status')
      .in('id', dpaRows.map((r: Record<string, unknown>) => r.program_id as string)),
  ])

  const profileMap = Object.fromEntries(
    (profilesResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p])
  )
  const donorProfileMap = Object.fromEntries(
    (donorProfilesResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p])
  )
  const programMap = Object.fromEntries(
    (programsResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p])
  )

  // Also get emails from auth.users — use profiles.contact_email fallback
  // Group DPA rows by donor
  const donorMap: Record<string, DonorRelationship> = {}

  for (const row of dpaRows as Record<string, unknown>[]) {
    const donorId = row.donor_id as string
    const profile    = profileMap[donorId] as Record<string, unknown> | undefined
    const donorProf  = donorProfileMap[donorId] as Record<string, unknown> | undefined
    const program    = programMap[row.program_id as string] as Record<string, unknown> | undefined

    if (!donorMap[donorId]) {
      donorMap[donorId] = {
        donor_id:          donorId,
        full_name:         (profile?.full_name as string | null) ?? null,
        avatar_url:        (profile?.avatar_url as string | null) ?? null,
        email:             (donorProf?.contact_email as string) ?? '',
        organization_name: (donorProf?.organization_name as string | null) ?? null,
        joined_at:         (profile?.created_at as string) ?? '',
        access:            [],
      }
    }

    donorMap[donorId].access.push({
      id:                   row.id as string,
      donor_id:             donorId,
      program_id:           row.program_id as string,
      organization_id:      row.organization_id as string,
      granted_by:           row.granted_by as string,
      access_level:         row.access_level as import('@/lib/donors').AccessLevel,
      can_download_reports: row.can_download_reports as boolean,
      active:               true,
      granted_at:           row.granted_at as string,
      expires_at:           row.expires_at as string | null,
      nickname:             row.nickname as string | null,
      internal_notes:       null,  // never include here
      last_viewed_at:       row.last_viewed_at as string | null,
      view_count:           row.view_count as number,
      program_name:         (program?.name as string) ?? null,
      program_status:       (program?.status as string) ?? null,
    })
  }

  return { data: Object.values(donorMap), error: null }
}

export async function getDonor(
  organizationId: string,
  donorId:        string,
): Promise<ActionResult<DonorRelationship & { internal_notes_per_program: Record<string, string | null> }>> {
  const supabase = createClient()

  const { data: dpaRows, error } = await supabase
    .from('donor_program_access')
    .select(`
      id, donor_id, program_id, organization_id, granted_by, access_level,
      can_download_reports, active, granted_at, expires_at,
      nickname, internal_notes, last_viewed_at, view_count
    `)
    .eq('organization_id', organizationId)
    .eq('donor_id', donorId)
    .order('granted_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  if (!dpaRows || dpaRows.length === 0) return { data: null, error: 'Donor not found' }

  const [profileResult, donorProfileResult, programsResult, granterResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url, created_at').eq('id', donorId).single(),
    supabase.from('donor_profiles').select('id, organization_name, contact_email').eq('id', donorId).maybeSingle(),
    supabase.from('programs').select('id, name, status').in('id', dpaRows.map((r: Record<string, unknown>) => r.program_id as string)),
    supabase.from('profiles').select('id, full_name').in('id', dpaRows.map((r: Record<string, unknown>) => r.granted_by as string)),
  ])

  const programMap = Object.fromEntries(
    (programsResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p])
  )
  const granterMap = Object.fromEntries(
    (granterResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p])
  )

  const internalNotesMap: Record<string, string | null> = {}
  const access: DonorProgramAccessExtended[] = (dpaRows as Record<string, unknown>[]).map(row => {
    const program = programMap[row.program_id as string] as Record<string, unknown> | undefined
    const granter = granterMap[row.granted_by as string] as Record<string, unknown> | undefined
    internalNotesMap[row.program_id as string] = row.internal_notes as string | null
    return {
      id:                   row.id as string,
      donor_id:             donorId,
      program_id:           row.program_id as string,
      organization_id:      row.organization_id as string,
      granted_by:           row.granted_by as string,
      access_level:         row.access_level as import('@/lib/donors').AccessLevel,
      can_download_reports: row.can_download_reports as boolean,
      active:               row.active as boolean,
      granted_at:           row.granted_at as string,
      expires_at:           row.expires_at as string | null,
      nickname:             row.nickname as string | null,
      internal_notes:       row.internal_notes as string | null,
      last_viewed_at:       row.last_viewed_at as string | null,
      view_count:           row.view_count as number,
      program_name:         (program?.name as string) ?? null,
      program_status:       (program?.status as string) ?? null,
      granter_name:         (granter?.full_name as string) ?? null,
    }
  })

  const profile    = profileResult.data as Record<string, unknown> | null
  const donorProf  = donorProfileResult.data as Record<string, unknown> | null

  return {
    data: {
      donor_id:          donorId,
      full_name:         (profile?.full_name as string | null) ?? null,
      avatar_url:        (profile?.avatar_url as string | null) ?? null,
      email:             (donorProf?.contact_email as string) ?? '',
      organization_name: (donorProf?.organization_name as string | null) ?? null,
      joined_at:         (profile?.created_at as string) ?? '',
      access,
      internal_notes_per_program: internalNotesMap,
    },
    error: null,
  }
}

// ── Access Management ─────────────────────────────────────────────────────────

export async function updateDonorAccess(
  organizationId: string,
  donorId:        string,
  programId:      string,
  payload:        UpdateDonorAccessPayload,
): Promise<ActionResult<DonorProgramAccessExtended>> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {}
  if (payload.access_level         !== undefined) updateData.access_level         = payload.access_level
  if (payload.can_download_reports !== undefined) updateData.can_download_reports = payload.can_download_reports
  if (payload.nickname             !== undefined) updateData.nickname             = payload.nickname
  if (payload.expires_at           !== undefined) updateData.expires_at           = payload.expires_at

  const { data, error } = await supabase
    .from('donor_program_access')
    .update(updateData)
    .eq('donor_id', donorId)
    .eq('program_id', programId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser) {
    void logActionForUser(currentUser.id, {
      organizationId,
      action:     'donor.access_updated',
      entityType: 'donor_program_access',
      entityName: donorId,
      metadata:   { donor_id: donorId, program_id: programId, ...payload },
    })
  }

  // Send notification if access level changed
  if (payload.access_level !== undefined) {
    await sendNotification(supabase, {
      donor_id:        donorId,
      organization_id: organizationId,
      program_id:      programId,
      type:            'ACCESS_UPDATED',
      title:           'Your access level has been updated',
      body:            `Your access level has been changed to: ${payload.access_level}.`,
      link:            `/donor/programs/${programId}`,
    })
  }

  // internal_notes must never leak to donor; strip it from returned value
  const row = data as Record<string, unknown>
  return {
    data: { ...row, internal_notes: null } as DonorProgramAccessExtended,
    error: null,
  }
}

export async function revokeDonorAccess(
  organizationId: string,
  donorId:        string,
  programId:      string,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('donor_program_access')
    .update({ active: false })
    .eq('donor_id', donorId)
    .eq('program_id', programId)
    .eq('organization_id', organizationId)

  if (error) return { data: null, error: error.message }

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (currentUser) {
    void logActionForUser(currentUser.id, {
      organizationId,
      action:     'donor.access_revoked',
      entityType: 'donor_program_access',
      entityName: donorId,
      metadata:   { donor_id: donorId, program_id: programId },
    })
  }

  // Send notification
  await sendNotification(supabase, {
    donor_id:        donorId,
    organization_id: organizationId,
    program_id:      programId,
    type:            'ACCESS_REVOKED',
    title:           'Your program access has been revoked',
    body:            'Your access to this program has been removed by the organization.',
    link:            '/donor/access',
  })

  return { data: true, error: null }
}

export async function updateDonorNotes(
  organizationId: string,
  donorId:        string,
  programId:      string,
  notes:          string,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { error } = await supabase
    .from('donor_program_access')
    .update({ internal_notes: notes })
    .eq('donor_id', donorId)
    .eq('program_id', programId)
    .eq('organization_id', organizationId)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

export async function grantProgramAccess(
  organizationId: string,
  payload:        GrantProgramAccessPayload,
): Promise<ActionResult<DonorProgramAccessExtended>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  const { data, error } = await supabase
    .from('donor_program_access')
    .upsert({
      donor_id:             payload.donor_id,
      program_id:           payload.program_id,
      organization_id:      organizationId,
      granted_by:           user.id,
      access_level:         payload.access_level,
      can_download_reports: payload.can_download_reports ?? false,
      nickname:             payload.nickname ?? null,
      expires_at:           payload.expires_at ?? null,
      active:               true,
      granted_at:           new Date().toISOString(),
    }, { onConflict: 'donor_id,program_id' })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Send notification
  await sendNotification(supabase, {
    donor_id:        payload.donor_id,
    organization_id: organizationId,
    program_id:      payload.program_id,
    type:            'ACCESS_GRANTED',
    title:           'Program access granted',
    body:            payload.message ?? `You have been granted access to a program. Level: ${payload.access_level}.`,
    link:            `/donor/programs/${payload.program_id}`,
  })

  const row = data as Record<string, unknown>
  return {
    data: { ...row, internal_notes: null } as DonorProgramAccessExtended,
    error: null,
  }
}

export async function getDonorActivity(
  organizationId: string,
  donorId:        string,
): Promise<ActionResult<DonorActivitySummary[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('donor_program_access')
    .select(`
      donor_id, program_id, last_viewed_at, view_count,
      program:programs(name)
    `)
    .eq('organization_id', organizationId)
    .eq('donor_id', donorId)
    .order('last_viewed_at', { ascending: false, nullsFirst: false })

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    donor_id:       donorId,
    program_id:     row.program_id as string,
    program_name:   (row.program as { name: string } | null)?.name ?? '',
    last_viewed_at: row.last_viewed_at as string | null,
    view_count:     row.view_count as number,
  }))

  return { data: rows as DonorActivitySummary[], error: null }
}

// ── Track Donor View (fire-and-forget) ────────────────────────────────────────
// Called from donor portal pages — updates last_viewed_at and view_count

export async function trackDonorView(programId: string): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current view_count
    const { data: row } = await supabase
      .from('donor_program_access')
      .select('view_count')
      .eq('donor_id', user.id)
      .eq('program_id', programId)
      .eq('active', true)
      .maybeSingle()

    if (!row) return

    await supabase
      .from('donor_program_access')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count:     ((row as Record<string, unknown>).view_count as number) + 1,
      })
      .eq('donor_id', user.id)
      .eq('program_id', programId)
  } catch {
    // Fire-and-forget — errors silently ignored
  }
}

// ── Access Requests (NGO view) ────────────────────────────────────────────────

export async function listAccessRequests(
  organizationId: string,
  status?:        'PENDING' | 'APPROVED' | 'DENIED',
): Promise<ActionResult<(DonorAccessRequest & { donor_name: string | null; donor_org: string | null; program_name: string | null })[]>> {
  const supabase = createClient()

  let query = supabase
    .from('donor_access_requests')
    .select(`
      *,
      donor:profiles!donor_access_requests_donor_id_fkey(full_name),
      donor_profile:donor_profiles!donor_access_requests_donor_id_fkey(organization_name),
      program:programs(name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    donor_name:   (row.donor as { full_name: string } | null)?.full_name ?? null,
    donor_org:    (row.donor_profile as { organization_name: string } | null)?.organization_name ?? null,
    program_name: (row.program as { name: string } | null)?.name ?? null,
  }))

  return { data: rows as (DonorAccessRequest & { donor_name: string | null; donor_org: string | null; program_name: string | null })[], error: null }
}

export async function approveAccessRequest(
  requestId:      string,
  organizationId: string,
  payload?:       ApproveAccessRequestPayload,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  // Fetch the request
  const { data: req, error: fetchError } = await supabase
    .from('donor_access_requests')
    .select('*')
    .eq('id', requestId)
    .eq('organization_id', organizationId)
    .eq('status', 'PENDING')
    .single()

  if (fetchError || !req) return { data: null, error: 'Request not found' }

  const accessLevel = payload?.access_level ?? (req as Record<string, unknown>).requested_access_level as string

  // Update request status
  const { error: updateError } = await supabase
    .from('donor_access_requests')
    .update({
      status:      'APPROVED',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (updateError) return { data: null, error: updateError.message }

  void logActionForUser(user.id, {
    organizationId,
    action:     'donor.request_approved',
    entityType: 'donor_access_request',
    entityId:   requestId,
    entityName: (req as Record<string, unknown>).donor_id as string,
    metadata:   { program_id: (req as Record<string, unknown>).program_id as string, access_level: accessLevel },
  })

  // Upsert donor_program_access
  await supabase
    .from('donor_program_access')
    .upsert({
      donor_id:        (req as Record<string, unknown>).donor_id as string,
      program_id:      (req as Record<string, unknown>).program_id as string,
      organization_id: organizationId,
      granted_by:      user.id,
      access_level:    accessLevel as AccessLevel,
      active:          true,
      granted_at:      new Date().toISOString(),
    }, { onConflict: 'donor_id,program_id' })

  // Notify donor
  await sendNotification(supabase, {
    donor_id:        (req as Record<string, unknown>).donor_id as string,
    organization_id: organizationId,
    program_id:      (req as Record<string, unknown>).program_id as string,
    type:            'REQUEST_APPROVED',
    title:           'Access request approved',
    body:            `Your request for ${accessLevel.replace(/_/g, ' ')} access has been approved.`,
    link:            `/donor/programs/${(req as Record<string, unknown>).program_id as string}`,
  })

  return { data: true, error: null }
}

export async function denyAccessRequest(
  requestId:      string,
  organizationId: string,
  payload:        DenyAccessRequestPayload,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  const { data: req, error: fetchError } = await supabase
    .from('donor_access_requests')
    .select('donor_id, program_id')
    .eq('id', requestId)
    .eq('organization_id', organizationId)
    .eq('status', 'PENDING')
    .single()

  if (fetchError || !req) return { data: null, error: 'Request not found' }

  const { error } = await supabase
    .from('donor_access_requests')
    .update({
      status:           'DENIED',
      reviewed_by:      user.id,
      reviewed_at:      new Date().toISOString(),
      response_message: payload.response_message,
    })
    .eq('id', requestId)

  if (error) return { data: null, error: error.message }

  void logActionForUser(user.id, {
    organizationId,
    action:     'donor.request_denied',
    entityType: 'donor_access_request',
    entityId:   requestId,
    entityName: (req as Record<string, unknown>).donor_id as string,
    metadata:   { program_id: (req as Record<string, unknown>).program_id as string },
  })

  // Notify donor
  await sendNotification(supabase, {
    donor_id:        (req as Record<string, unknown>).donor_id as string,
    organization_id: organizationId,
    program_id:      (req as Record<string, unknown>).program_id as string,
    type:            'REQUEST_DENIED',
    title:           'Access request not approved',
    body:            payload.response_message,
    link:            '/donor/access',
  })

  return { data: true, error: null }
}
