// GET    /api/team/:profileId — single member detail
// DELETE /api/team/:profileId — remove from org (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit/logger'

interface Params { params: { profileId: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!myProfile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(myProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = myProfile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  const { data: member, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, organization_id, job_title, created_at')
    .eq('id', params.profileId)
    .eq('organization_id', orgId)
    .single()

  if (error || !member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch assignments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: assignments } = await db
    .from('program_assignments')
    .select('id, program_id, profile_id, organization_id, assigned_by, assigned_at, programs(name, status)')
    .eq('profile_id', params.profileId)
    .eq('organization_id', orgId)

  const enrichedAssignments = (assignments ?? []).map((a: Record<string, unknown>) => {
    const prog = a.programs as Record<string, unknown> | null
    return {
      id:             a.id,
      program_id:     a.program_id,
      profile_id:     a.profile_id,
      organization_id: a.organization_id,
      assigned_by:    a.assigned_by,
      assigned_at:    a.assigned_at,
      program_name:   prog?.name   ?? null,
      program_status: prog?.status ?? null,
    }
  })

  let email = ''
  try {
    const { adminClient } = await import('@/lib/supabase/admin')
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(params.profileId)
    email = authUser?.email ?? ''
  } catch { /* ignore */ }

  return NextResponse.json({ data: { ...member, email, assignments: enrichedAssignments } })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!myProfile || myProfile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — NGO_ADMIN only' }, { status: 403 })
  }
  const orgId = myProfile.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 400 })

  // Cannot remove yourself
  if (params.profileId === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself from the organization' }, { status: 400 })
  }

  // Check the target is in the same org
  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, role, organization_id')
    .eq('id', params.profileId)
    .eq('organization_id', orgId)
    .single()

  if (!target) return NextResponse.json({ error: 'Member not found in this organization' }, { status: 404 })

  // Remove from org (set organization_id = null)
  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: null })
    .eq('id', params.profileId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAction({
    organizationId: orgId,
    actorId:        user.id,
    actorName:      (myProfile as Record<string, unknown>).full_name as string ?? 'Unknown',
    actorRole:      myProfile.role,
    action:         'team.member_removed',
    entityType:     'profile',
    entityId:       params.profileId,
    entityName:     (target as Record<string, unknown>).full_name as string ?? params.profileId,
    metadata:       { removed_role: (target as Record<string, unknown>).role as string },
  })

  // Also remove all program assignments in this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  await db
    .from('program_assignments')
    .delete()
    .eq('profile_id', params.profileId)
    .eq('organization_id', orgId)

  return NextResponse.json({ success: true })
}
