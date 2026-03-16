// GET /api/team — list all team members with roles + program assignments

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

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!profile.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const orgId = profile.organization_id

  // Fetch all NGO members in this org
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, organization_id, job_title, created_at')
    .eq('organization_id', orgId)
    .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])
    .order('created_at', { ascending: true })

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

  // Fetch emails from auth.users via admin — use service role via direct query
  // We query auth users via the profile IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const memberIds = (members ?? []).map((m: Record<string, unknown>) => m.id as string)

  // Fetch program assignments for all members
  const { data: assignments } = await db
    .from('program_assignments')
    .select('id, program_id, profile_id, organization_id, assigned_by, assigned_at, programs(name, status)')
    .eq('organization_id', orgId)

  const assignmentsByProfile: Record<string, unknown[]> = {}
  for (const a of (assignments ?? []) as Record<string, unknown>[]) {
    const pid = a.profile_id as string
    if (!assignmentsByProfile[pid]) assignmentsByProfile[pid] = []
    const prog = a.programs as Record<string, unknown> | null
    assignmentsByProfile[pid].push({
      id:             a.id,
      program_id:     a.program_id,
      profile_id:     a.profile_id,
      organization_id: a.organization_id,
      assigned_by:    a.assigned_by,
      assigned_at:    a.assigned_at,
      program_name:   prog?.name   ?? null,
      program_status: prog?.status ?? null,
    })
  }

  // Fetch emails via admin client (service role)
  let emailMap: Record<string, string> = {}
  if (memberIds.length > 0) {
    try {
      const { adminClient } = await import('@/lib/supabase/admin')
      const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      for (const u of users) {
        if (memberIds.includes(u.id)) {
          emailMap[u.id] = u.email ?? ''
        }
      }
    } catch {
      // If admin client unavailable, proceed without emails
    }
  }

  const result = (members ?? []).map((m: Record<string, unknown>) => ({
    ...m,
    email:       emailMap[m.id as string] ?? '',
    assignments: assignmentsByProfile[m.id as string] ?? [],
  }))

  return NextResponse.json({ data: result })
}
