import { redirect } from 'next/navigation'
import { requireOrgAuth } from '@/lib/auth/server'
import DonorDetailClient from './DonorDetailClient'
import type { DonorRelationship, DonorProgramAccessExtended } from '@/lib/donors'

interface Props {
  params: { slug: string; donorId: string }
}

export default async function DonorDetailPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  // Fetch DPA rows for this donor
  const { data: dpaRows } = await supabase
    .from('donor_program_access')
    .select('id, donor_id, program_id, organization_id, granted_by, access_level, can_download_reports, active, granted_at, expires_at, nickname, internal_notes, last_viewed_at, view_count')
    .eq('organization_id', org.id)
    .eq('donor_id', params.donorId)
    .order('granted_at', { ascending: false })

  if (!dpaRows || dpaRows.length === 0) redirect(`/org/${params.slug}/donors`)

  const [profileResult, donorProfileResult, programsResult, granterResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url, created_at').eq('id', params.donorId).single(),
    supabase.from('donor_profiles').select('id, organization_name, contact_email').eq('id', params.donorId).maybeSingle(),
    supabase.from('programs').select('id, name, status').in('id', (dpaRows as Record<string, unknown>[]).map(r => r.program_id as string)),
    supabase.from('profiles').select('id, full_name').in('id', (dpaRows as Record<string, unknown>[]).map(r => r.granted_by as string)),
  ])

  const programMap = Object.fromEntries((programsResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
  const granterMap = Object.fromEntries((granterResult.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
  const internalNotesMap: Record<string, string | null> = {}

  const access: DonorProgramAccessExtended[] = (dpaRows as Record<string, unknown>[]).map(row => {
    const program = programMap[row.program_id as string] as Record<string, unknown> | undefined
    const granter = granterMap[row.granted_by as string] as Record<string, unknown> | undefined
    internalNotesMap[row.program_id as string] = row.internal_notes as string | null
    return {
      id:                   row.id as string,
      donor_id:             params.donorId,
      program_id:           row.program_id as string,
      organization_id:      row.organization_id as string,
      granted_by:           row.granted_by as string,
      access_level:         row.access_level as import('@/lib/donors').AccessLevel,
      can_download_reports: row.can_download_reports as boolean,
      active:               row.active as boolean,
      granted_at:           row.granted_at as string,
      expires_at:           row.expires_at as string | null,
      nickname:             row.nickname as string | null,
      internal_notes:       row.internal_notes as string | null,
      last_viewed_at:       row.last_viewed_at as string | null,
      view_count:           row.view_count as number,
      program_name:         (program?.name as string) ?? null,
      program_status:       (program?.status as string) ?? null,
      granter_name:         (granter?.full_name as string) ?? null,
    }
  })

  const profile   = profileResult.data as Record<string, unknown> | null
  const donorProf = donorProfileResult.data as Record<string, unknown> | null

  const donor: DonorRelationship & { internal_notes_per_program: Record<string, string | null> } = {
    donor_id:          params.donorId,
    full_name:         (profile?.full_name as string | null) ?? null,
    avatar_url:        (profile?.avatar_url as string | null) ?? null,
    email:             (donorProf?.contact_email as string) ?? '',
    organization_name: (donorProf?.organization_name as string | null) ?? null,
    joined_at:         (profile?.created_at as string) ?? '',
    access,
    internal_notes_per_program: internalNotesMap,
  }

  // Programs for dropdowns
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, status')
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <DonorDetailClient
      orgSlug={params.slug}
      organizationId={org.id}
      userRole={user.profile.role}
      donor={donor}
      programs={(programs ?? []) as { id: string; name: string; status: string }[]}
      currentUserId={user.id}
    />
  )
}
