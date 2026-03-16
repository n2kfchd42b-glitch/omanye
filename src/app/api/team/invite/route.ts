// POST /api/team/invite — create invitation + send email (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OmanyeRole } from '@/lib/supabase/database.types'
import { logAction } from '@/lib/audit/logger'

interface InviteBody {
  email:       string
  full_name:   string
  role:        OmanyeRole
  message?:    string | null
  program_ids?: string[]
}

const VALID_ROLES: OmanyeRole[] = ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — NGO_ADMIN only' }, { status: 403 })
  }
  const orgId = profile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const body: InviteBody = await req.json()

  if (!body.email || !body.role) {
    return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
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
        return NextResponse.json({ error: 'This user is already a member of your organization' }, { status: 409 })
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

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 })

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

  // If program_ids provided, create program access grants once the user accepts
  // (stored on invitation for now; assignments created at accept time)
  return NextResponse.json({ data: invitation }, { status: 201 })
}
