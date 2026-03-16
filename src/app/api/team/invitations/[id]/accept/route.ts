// POST /api/team/invitations/:token/accept
// Accepts a team invitation: links the authenticated user's profile to the org.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch invitation by token
  const { data: invitation, error: invErr } = await db
    .from('team_invitations')
    .select('*')
    .eq('token', params.id)
    .single()

  if (invErr || !invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }

  const inv = invitation as Record<string, unknown>

  // Check status
  if (inv.status !== 'PENDING') {
    return NextResponse.json({ error: `Invitation is ${inv.status}` }, { status: 400 })
  }

  // Check expiry
  if (new Date() > new Date(inv.expires_at as string)) {
    await db.from('team_invitations').update({ status: 'EXPIRED' }).eq('id', inv.id)
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
  }

  // Verify email matches (if body contains email, or use auth user email)
  let body: { email?: string } = {}
  try { body = await req.json() } catch { /* ignore */ }

  const authEmail = user.email ?? ''
  const invEmail  = inv.email as string
  if (body.email && body.email !== invEmail) {
    return NextResponse.json({ error: 'Email mismatch' }, { status: 400 })
  }

  // Get or create profile for this user
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', user.id)
    .single()

  if (existingProfile?.organization_id && existingProfile.organization_id !== inv.organization_id) {
    return NextResponse.json({
      error: 'You are already a member of a different organization',
    }, { status: 409 })
  }

  // Update profile: set org + role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileDb: any = supabase
  const { error: profileErr } = await profileDb
    .from('profiles')
    .upsert({
      id:              user.id,
      organization_id: inv.organization_id as string,
      role:            inv.role as string,
      full_name:       existingProfile
        ? undefined
        : (inv.full_name as string | null) ?? authEmail.split('@')[0],
    }, { onConflict: 'id' })

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  // Mark invitation as accepted
  const now = new Date().toISOString()
  await db
    .from('team_invitations')
    .update({ status: 'ACCEPTED', accepted_at: now })
    .eq('id', inv.id)

  // Fetch org slug for redirect
  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', inv.organization_id as string)
    .single()

  return NextResponse.json({
    success:  true,
    org_slug: (org as Record<string, unknown> | null)?.slug ?? null,
  })
}
