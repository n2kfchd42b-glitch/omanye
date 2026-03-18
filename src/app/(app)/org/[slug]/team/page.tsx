import { requireOrgAuth } from '@/lib/auth/server'
import { adminClient } from '@/lib/supabase/admin'
import TeamClient from './TeamClient'
import type { TeamMemberDB, TeamInvitation } from '@/types/team'

interface Props { params: { slug: string } }

export default async function TeamPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  // Fetch team members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, organization_id, job_title, created_at')
    .eq('organization_id', org.id)
    .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])
    .order('created_at', { ascending: true })

  // Fetch program assignments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: assignments } = await db
    .from('program_assignments')
    .select('id, program_id, profile_id, organization_id, assigned_by, assigned_at, programs(name, status)')
    .eq('organization_id', org.id)

  const assignmentsByProfile: Record<string, unknown[]> = {}
  for (const a of (assignments ?? []) as Record<string, unknown>[]) {
    const pid = a.profile_id as string
    if (!assignmentsByProfile[pid]) assignmentsByProfile[pid] = []
    const prog = a.programs as Record<string, unknown> | null
    assignmentsByProfile[pid].push({
      id:              a.id,
      program_id:      a.program_id,
      profile_id:      a.profile_id,
      organization_id: a.organization_id,
      assigned_by:     a.assigned_by,
      assigned_at:     a.assigned_at,
      program_name:    prog?.name   ?? null,
      program_status:  prog?.status ?? null,
    })
  }

  // Fetch emails via admin (requires service role)
  let emailMap: Record<string, string> = {}
  const memberIds = (members ?? []).map((m: Record<string, unknown>) => m.id as string)
  if (memberIds.length > 0) {
    try {
      const { data: { users } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
      for (const u of users) {
        if (memberIds.includes(u.id)) emailMap[u.id] = u.email ?? ''
      }
    } catch { /* admin unavailable */ }
  }

  const teamMembers: TeamMemberDB[] = (members ?? []).map((m: Record<string, unknown>) => ({
    id:              m.id as string,
    full_name:       m.full_name as string | null,
    avatar_url:      m.avatar_url as string | null,
    role:            m.role as TeamMemberDB['role'],
    organization_id: m.organization_id as string | null,
    job_title:       m.job_title as string | null,
    created_at:      m.created_at as string,
    email:           emailMap[m.id as string] ?? '',
    assignments:     assignmentsByProfile[m.id as string] as TeamMemberDB['assignments'] ?? [],
  }))

  // Expire stale invitations
  try {
    await db
      .from('team_invitations')
      .update({ status: 'EXPIRED' })
      .eq('organization_id', org.id)
      .eq('status', 'PENDING')
      .lt('expires_at', new Date().toISOString())
  } catch { /* ignore */ }

  // Fetch invitations
  const { data: invitationsRaw } = await db
    .from('team_invitations')
    .select('*, inviter:invited_by(full_name)')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })

  const invitations: TeamInvitation[] = (invitationsRaw ?? []).map((inv: Record<string, unknown>) => {
    const inviter = inv.inviter as Record<string, unknown> | null
    return {
      id:              inv.id as string,
      organization_id: inv.organization_id as string,
      invited_by:      inv.invited_by as string,
      email:           inv.email as string,
      full_name:       inv.full_name as string | null,
      role:            inv.role as TeamInvitation['role'],
      token:           inv.token as string,
      message:         inv.message as string | null,
      status:          inv.status as TeamInvitation['status'],
      expires_at:      inv.expires_at as string,
      accepted_at:     inv.accepted_at as string | null,
      created_at:      inv.created_at as string,
      inviter_name:    inviter?.full_name as string | null ?? null,
    }
  })

  // Fetch programs for dropdowns/assignment modal
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, status')
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <TeamClient
      orgSlug={params.slug}
      organizationId={org.id}
      userRole={user.profile.role}
      currentUserId={user.id}
      members={teamMembers}
      invitations={invitations}
      programs={(programs ?? []) as { id: string; name: string; status: string }[]}
    />
  )
}
