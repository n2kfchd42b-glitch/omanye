import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DonorProgramsClient from './DonorProgramsClient'
import { filterProgram } from '@/lib/donorFilter'
import type { Program, Indicator } from '@/lib/programs'

export default async function DonorProgramsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') redirect('/login')

  // Get all active grants
  const { data: grants } = await supabase
    .from('donor_program_access')
    .select('program_id, access_level, organization_id, can_download_reports, granted_at, expires_at')
    .eq('donor_id', user.id)
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('granted_at', { ascending: false })

  const grantList = grants ?? []
  const programIds = grantList.map((g: { program_id: string; access_level: string; organization_id: string; can_download_reports: boolean; granted_at: string; expires_at: string | null }) => g.program_id)
  const grantMap = Object.fromEntries(grantList.map((g: { program_id: string; access_level: string; organization_id: string; can_download_reports: boolean; granted_at: string; expires_at: string | null }) => [g.program_id, g]))

  let programs: Program[] = []
  let orgMap: Record<string, { name: string; slug: string }> = {}

  if (programIds.length > 0) {
    const { data: programsData } = await supabase
      .from('programs')
      .select('*')
      .in('id', programIds)
      .is('deleted_at', null)
      .neq('visibility', 'PRIVATE')

    programs = (programsData ?? []) as Program[]

    const orgIds = Array.from(new Set(programs.map(p => p.organization_id)))
    if (orgIds.length > 0) {
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds)
      orgMap = Object.fromEntries((orgsData ?? []).map((o: { id: string; name: string; slug: string }) => [o.id, { name: o.name, slug: o.slug }]))
    }
  }

  // Fetch donor-visible indicators for all accessible programs
  let indicatorsByProgram: Record<string, Indicator[]> = {}
  if (programIds.length > 0) {
    const { data: inds } = await supabase
      .from('indicators')
      .select('*')
      .in('program_id', programIds)
      .eq('visible_to_donors', true)
    for (const ind of inds ?? []) {
      if (!indicatorsByProgram[ind.program_id]) indicatorsByProgram[ind.program_id] = []
      indicatorsByProgram[ind.program_id]!.push(ind as Indicator)
    }
  }

  // Get pending access requests
  const { data: pendingRequests } = await supabase
    .from('donor_access_requests')
    .select('program_id, requested_access_level, status, created_at')
    .eq('donor_id', user.id)
    .eq('status', 'PENDING')

  const pendingByProgram = Object.fromEntries(
    (pendingRequests ?? []).map((r: { program_id: string; requested_access_level: string; status: string; created_at: string }) => [r.program_id, r])
  )

  // Apply server-side donor filter
  const programViews = programs.map(p => {
    const grant = grantMap[p.id]
    const view = filterProgram(
      p,
      (grant?.access_level ?? 'SUMMARY_ONLY') as import('@/lib/supabase/database.types').AccessLevel,
      indicatorsByProgram[p.id] ?? [],
    )
    return {
      ...view,
      organization: orgMap[p.organization_id] ?? null,
      organization_id: p.organization_id,
      can_download_reports: grant?.can_download_reports ?? false,
      expires_at: grant?.expires_at ?? null,
      pending_request: (pendingByProgram[p.id] ?? null) as { requested_access_level: import('@/lib/supabase/database.types').AccessLevel; created_at: string } | null,
    }
  })

  return (
    <DonorProgramsClient
      programs={programViews}
      donorName={profile.full_name ?? 'Donor'}
    />
  )
}
