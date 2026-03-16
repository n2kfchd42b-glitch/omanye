// DELETE /api/team/assignments/:id — unassign member from program (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: { id: string } }

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
  const { data: assignment } = await db
    .from('program_assignments')
    .select('id, organization_id')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()

  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  const { error } = await db
    .from('program_assignments')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
