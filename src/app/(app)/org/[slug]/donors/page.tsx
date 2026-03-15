import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DonorsClient from './DonorsClient'
import type { DonorRelationship, DonorInvitation } from '@/lib/donors'
import type { DonorAccessRequest } from '@/lib/auth/types'

interface Props {
  params: { slug: string }
}

export default async function DonorsPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    redirect('/login')
  }
  if (!profile.organization_id) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .eq('id', profile.organization_id)
    .single()

  if (!org || org.slug !== params.slug) {
    redirect(org ? `/org/${org.slug}/donors` : '/login')
  }

  // Expire stale invitations
  await supabase.rpc('expire_pending_invitations').catch(() => {})

  // Fetch all data in parallel
  const [dpaResult, invResult, requestResult, programsResult] = await Promise.all([
    // All active DPA rows
    supabase
      .from('donor_program_access')
      .select('id, donor_id, program_id, organization_id, granted_by, access_level, can_download_reports, active, granted_at, expires_at, nickname, last_viewed_at, view_count')
      .eq('organization_id', profile.organization_id)
      .eq('active', true)
      .order('granted_at', { ascending: false }),

    // All invitations
    supabase
      .from('donor_invitations')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),

    // All access requests
    supabase
      .from('donor_access_requests')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),

    // Programs for dropdowns
    supabase
      .from('programs')
      .select('id, name, status')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  const dpaRows = dpaResult.data ?? []
  const donorIds = Array.from(new Set(dpaRows.map((r: Record<string, unknown>) => r.donor_id as string)))

  // Fetch donor details if any
  let donorRelationships: DonorRelationship[] = []
  if (donorIds.length > 0) {
    const [profilesResult, donorProfilesResult, programsForDPAResult] = await Promise.all([
      supabase.from('profiles').select('id, full_name, avatar_url, created_at').in('id', donorIds),
      supabase.from('donor_profiles').select('id, organization_name, contact_email').in('id', donorIds),
      supabase.from('programs').select('id, name, status').in('id', dpaRows.map((r: Record<string, unknown>) => r.program_id as string)),
    ])

    const profileMap     = Object.fromEntries((profilesResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
    const donorProfMap   = Object.fromEntries((donorProfilesResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
    const programForDPAMap = Object.fromEntries((programsForDPAResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))

    const donorMap: Record<string, DonorRelationship> = {}
    for (const row of dpaRows as Record<string, unknown>[]) {
      const donorId  = row.donor_id as string
      const prof     = profileMap[donorId]     as Record<string, unknown> | undefined
      const donorP   = donorProfMap[donorId]   as Record<string, unknown> | undefined
      const prog     = programForDPAMap[row.program_id as string] as Record<string, unknown> | undefined

      if (!donorMap[donorId]) {
        donorMap[donorId] = {
          donor_id:          donorId,
          full_name:         (prof?.full_name as string | null) ?? null,
          avatar_url:        (prof?.avatar_url as string | null) ?? null,
          email:             (donorP?.contact_email as string) ?? '',
          organization_name: (donorP?.organization_name as string | null) ?? null,
          joined_at:         (prof?.created_at as string) ?? '',
          access:            [],
        }
      }
      donorMap[donorId].access.push({
        id:                   row.id as string,
        donor_id:             donorId,
        program_id:           row.program_id as string,
        organization_id:      row.organization_id as string,
        granted_by:           row.granted_by as string,
        access_level:         row.access_level as import('@/lib/donors').AccessLevel,
        can_download_reports: row.can_download_reports as boolean,
        active:               true,
        granted_at:           row.granted_at as string,
        expires_at:           row.expires_at as string | null,
        nickname:             row.nickname as string | null,
        internal_notes:       null,
        last_viewed_at:       row.last_viewed_at as string | null,
        view_count:           row.view_count as number,
        program_name:         (prog?.name as string) ?? null,
        program_status:       (prog?.status as string) ?? null,
      })
    }
    donorRelationships = Object.values(donorMap)
  }

  // Enrich invitations with program names
  const programNames: Record<string, string> = {}
  const progResult = programsResult.data ?? []
  for (const p of progResult as Record<string, unknown>[]) programNames[p.id as string] = p.name as string

  const invitations = (invResult.data ?? []).map((inv: Record<string, unknown>) => ({
    ...inv,
    program_name: programNames[inv.program_id as string] ?? null,
  })) as DonorInvitation[]

  // Enrich access requests with donor + program names
  const allDonorIds = Array.from(new Set((requestResult.data ?? []).map((r: Record<string, unknown>) => r.donor_id as string)))
  let reqDonorNames: Record<string, string | null> = {}
  let reqDonorOrgs:  Record<string, string | null> = {}
  if (allDonorIds.length > 0) {
    const [reqProfiles, reqDonorProfiles] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', allDonorIds),
      supabase.from('donor_profiles').select('id, organization_name').in('id', allDonorIds),
    ])
    reqDonorNames = Object.fromEntries((reqProfiles.data ?? []).map((p: Record<string, unknown>) => [p.id, p.full_name ?? null]))
    reqDonorOrgs  = Object.fromEntries((reqDonorProfiles.data ?? []).map((p: Record<string, unknown>) => [p.id, (p.organization_name as string | null) ?? null]))
  }

  const accessRequests = (requestResult.data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    donor_name:   reqDonorNames[r.donor_id as string] ?? null,
    donor_org:    reqDonorOrgs[r.donor_id as string]  ?? null,
    program_name: programNames[r.program_id as string] ?? null,
  })) as (DonorAccessRequest & { donor_name: string | null; donor_org: string | null; program_name: string | null })[]

  const pendingRequestCount = accessRequests.filter(r => r.status === 'PENDING').length

  return (
    <DonorsClient
      orgSlug={params.slug}
      organizationId={profile.organization_id}
      userRole={profile.role}
      donors={donorRelationships}
      invitations={invitations}
      accessRequests={accessRequests}
      programs={(programsResult.data ?? []) as { id: string; name: string; status: string }[]}
      pendingRequestCount={pendingRequestCount}
      currentUserId={user.id}
    />
  )
}
