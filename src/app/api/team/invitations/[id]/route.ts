// GET    /api/team/invitations/:id — validate token (public)
// DELETE /api/team/invitations/:id — revoke invitation (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  // This endpoint is public — no auth required (used for invitation acceptance page)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: invitation, error } = await db
    .from('team_invitations')
    .select('*, organization:organization_id(name, logo_url, slug), inviter:invited_by(full_name)')
    .eq('token', params.id)
    .single()

  if (error || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  const inv     = invitation as Record<string, unknown>
  const org     = inv.organization as Record<string, unknown> | null
  const inviter = inv.inviter      as Record<string, unknown> | null

  // Check if expired
  const now = new Date()
  const exp = new Date(inv.expires_at as string)
  if (now > exp && inv.status === 'PENDING') {
    // Auto-expire
    await db
      .from('team_invitations')
      .update({ status: 'EXPIRED' })
      .eq('id', inv.id)
    return NextResponse.json({
      data: { ...inv, status: 'EXPIRED', org_name: org?.name, inviter_name: inviter?.full_name },
    })
  }

  return NextResponse.json({
    data: {
      ...inv,
      org_name:     org?.name      ?? null,
      org_logo_url: org?.logo_url  ?? null,
      org_slug:     org?.slug      ?? null,
      inviter_name: inviter?.full_name ?? null,
      organization: undefined,
      inviter:      undefined,
    },
  })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — NGO_ADMIN only' }, { status: 403 })
  }
  const orgId = profile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: invitation } = await db
    .from('team_invitations')
    .select('id, status, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

  const inv = invitation as Record<string, unknown>
  if (inv.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only PENDING invitations can be revoked' }, { status: 400 })
  }

  const { error } = await db
    .from('team_invitations')
    .update({ status: 'REVOKED' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
