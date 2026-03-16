// POST /api/team/assignments — assign member to program (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
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

  const body: { program_id: string; profile_id: string } = await req.json()
  if (!body.program_id || !body.profile_id) {
    return NextResponse.json({ error: 'program_id and profile_id are required' }, { status: 400 })
  }

  // Verify program belongs to org
  const { data: program } = await supabase
    .from('programs')
    .select('id, organization_id')
    .eq('id', body.program_id)
    .eq('organization_id', orgId)
    .single()
  if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  // Verify target profile is in org
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', body.profile_id)
    .eq('organization_id', orgId)
    .single()
  if (!targetProfile) return NextResponse.json({ error: 'Profile not found in org' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('program_assignments')
    .upsert({
      program_id:      body.program_id,
      profile_id:      body.profile_id,
      organization_id: orgId,
      assigned_by:     user.id,
    }, { onConflict: 'program_id,profile_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
