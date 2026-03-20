// POST /api/team/invite — create invitation + send email (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inviteTeamMemberSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, internalError, validationError, conflict, limitExceeded } from '@/lib/api/errors'
import { logAction } from '@/lib/audit/logger'
import { checkLimit } from '@/lib/billing/limits'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') return forbidden()

  const orgId = profile.organization_id
  if (!orgId) return forbidden('No organization associated with this account')

  const parsed = inviteTeamMemberSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)
  const body = parsed.data

  // ── Plan limit check ────────────────────────────────────────────────────────
  const limitCheck = await checkLimit(orgId, 'team_members')
  if (!limitCheck.allowed) {
    return limitExceeded(
      `You've reached your team member limit (${limitCheck.current}/${limitCheck.limit}). Upgrade to add more members.`
    )
  }

  // Check if user with this email is already a member
  try {
    const { adminClient } = await import('@/lib/supabase/admin')
    const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
    const existing = users.find((u: { email?: string; id: string }) => u.email === body.email)
    if (existing) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', existing.id)
        .single()
      if (existingProfile?.organization_id === orgId) {
        return conflict('This user is already a member of your organization')
      }
    }
  } catch { /* skip if admin not available */ }

  // Revoke any existing PENDING invitation for this email in this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  await db
    .from('team_invitations')
    .update({ status: 'REVOKED' })
    .eq('organization_id', orgId)
    .eq('email', body.email)
    .eq('status', 'PENDING')

  // Create new invitation
  const { data: invitation, error: invError } = await db
    .from('team_invitations')
    .insert({
      organization_id: orgId,
      invited_by:      user.id,
      email:           body.email,
      full_name:       body.full_name || null,
      role:            body.role,
      message:         body.message || null,
    })
    .select()
    .single()

  if (invError) return internalError(invError.message)

  // Fetch org info for the email
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', orgId)
    .single()

  // Fire-and-forget: invoke edge function to send email
  try {
    await supabase.functions.invoke('send-team-invitation', {
      body: {
        invitation_id: invitation.id as string,
        token:         invitation.token as string,
        email:         body.email,
        full_name:     body.full_name || null,
        role:          body.role,
        message:       body.message || null,
        org_name:      (org as Record<string, unknown> | null)?.name as string ?? '',
        inviter_name:  profile.full_name ?? '',
        expires_at:    invitation.expires_at as string,
      },
    })
  } catch { /* email failure should not block invitation creation */ }

  void logAction({
    organizationId: orgId,
    actorId:        user.id,
    actorName:      profile.full_name ?? 'Unknown',
    actorRole:      profile.role,
    action:         'team.member_invited',
    entityType:     'team_invitation',
    entityId:       (invitation as Record<string, unknown>).id as string,
    entityName:     body.full_name || body.email,
    metadata:       { email: body.email, role: body.role },
  })

  return NextResponse.json({ data: invitation }, { status: 201 })
}
