// GET /api/team/invitations — list all invitations for the org (NGO_ADMIN)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const orgId = profile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // Expire stale invitations first
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = supabase
    await db
      .from('team_invitations')
      .update({ status: 'EXPIRED' })
      .eq('organization_id', orgId)
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString())
  } catch { /* ignore */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: invitations, error } = await db
    .from('team_invitations')
    .select('*, inviter:invited_by(full_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (invitations ?? []).map((inv: Record<string, unknown>) => {
    const inviter = inv.inviter as Record<string, unknown> | null
    return {
      ...inv,
      inviter_name: inviter?.full_name ?? null,
      inviter:      undefined,
    }
  })

  return NextResponse.json({ data: result })
}
