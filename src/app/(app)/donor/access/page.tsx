import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DonorAccessClient from './DonorAccessClient'
import type { DonorAccessRequest } from '@/lib/auth/types'

export default async function DonorAccessPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') redirect('/login')

  // Parallel: active grants + access requests
  const [grantsResult, requestsResult] = await Promise.all([
    supabase
      .from('donor_program_access')
      .select('id, program_id, organization_id, access_level, can_download_reports, granted_at, expires_at, active, last_viewed_at, view_count')
      .eq('donor_id', user.id)
      .order('granted_at', { ascending: false }),

    supabase
      .from('donor_access_requests')
      .select('*')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const grants     = grantsResult.data ?? []
  const requests   = requestsResult.data ?? []

  // Fetch program + org details
  const programIds = Array.from(new Set([
    ...grants.map(g => g.program_id),
    ...requests.map(r => r.program_id),
  ]))

  const orgIds = Array.from(new Set([
    ...grants.map(g => g.organization_id),
    ...requests.map(r => r.organization_id),
  ]))

  const [programsRes, orgsRes] = await Promise.all([
    programIds.length > 0
      ? supabase.from('programs').select('id, name, status').in('id', programIds)
      : { data: [] },
    orgIds.length > 0
      ? supabase.from('organizations').select('id, name, slug').in('id', orgIds)
      : { data: [] },
  ])

  const programMap = Object.fromEntries((programsRes.data ?? []).map(p => [p.id, p]))
  const orgMap     = Object.fromEntries((orgsRes.data    ?? []).map(o => [o.id, o]))

  const enrichedGrants = grants.map(g => ({
    ...g,
    program_name: programMap[g.program_id]?.name ?? null,
    org_name:     orgMap[g.organization_id]?.name ?? null,
    org_slug:     orgMap[g.organization_id]?.slug ?? null,
  }))

  const enrichedRequests = (requests as unknown as (DonorAccessRequest & { program_id: string; organization_id: string })[]).map(r => ({
    ...r,
    program_name: programMap[r.program_id]?.name ?? null,
    org_name:     orgMap[r.organization_id]?.name ?? null,
  })) as (DonorAccessRequest & { program_name: string | null; org_name: string | null })[]

  return (
    <DonorAccessClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      grants={enrichedGrants as any}
      requests={enrichedRequests}
    />
  )
}
