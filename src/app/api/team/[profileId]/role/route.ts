// PATCH /api/team/:profileId/role — change member role (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OmanyeRole } from '@/lib/supabase/database.types'
import { logAction } from '@/lib/audit/logger'

interface Params { params: { profileId: string } }

const VALID_ROLES: OmanyeRole[] = ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']

export async function PATCH(req: NextRequest, { params }: Params) {
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

  const body = await req.json() as { role: OmanyeRole }
  if (!VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Verify target is in same org
  const { data: target } = await supabase
    .from('profiles')
    .select('id, full_name, role, organization_id')
    .eq('id', params.profileId)
    .eq('organization_id', orgId)
    .single()

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Cannot demote yourself if you're the only admin
  if (params.profileId === user.id && body.role !== 'NGO_ADMIN') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'NGO_ADMIN')

    if ((count ?? 0) <= 1) {
      return NextResponse.json({
        error: 'Cannot demote yourself — you are the only admin',
      }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: body.role })
    .eq('id', params.profileId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAction({
    organizationId: orgId,
    actorId:        user.id,
    actorName:      (myProfile as Record<string, unknown>).full_name as string ?? 'Unknown',
    actorRole:      myProfile.role,
    action:         'team.role_changed',
    entityType:     'profile',
    entityId:       params.profileId,
    entityName:     (target as Record<string, unknown>).full_name as string ?? params.profileId,
    changes:        { role: { from: target.role, to: body.role } },
  })

  return NextResponse.json({ data })
}
