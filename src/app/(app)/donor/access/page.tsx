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
  const programIds = [...new Set([
    ...grants.map((g: Record<string, unknown>) => g.program_id as string),
    ...requests.map((r: Record<string, unknown>) => r.program_id as string),
  ])]

  const orgIds = [...new Set([
    ...grants.map((g: Record<string, unknown>) => g.organization_id as string),
    ...requests.map((r: Record<string, unknown>) => r.organization_id as string),
  ])]

  const [programsRes, orgsRes] = await Promise.all([
    programIds.length > 0
      ? supabase.from('programs').select('id, name, status').in('id', programIds)
      : { data: [] },
    orgIds.length > 0
      ? supabase.from('organizations').select('id, name, slug').in('id', orgIds)
      : { data: [] },
  ])

  const programMap = Object.fromEntries((programsRes.data ?? []).map((p: Record<string, unknown>) => [p.id, p]))
  const orgMap     = Object.fromEntries((orgsRes.data    ?? []).map((o: Record<string, unknown>) => [o.id, o]))

  const enrichedGrants = (grants as Record<string, unknown>[]).map(g => ({
    ...g,
    program_name: (programMap[g.program_id as string] as Record<string, unknown> | undefined)?.name ?? null,
    org_name:     (orgMap[g.organization_id as string] as Record<string, unknown> | undefined)?.name ?? null,
    org_slug:     (orgMap[g.organization_id as string] as Record<string, unknown> | undefined)?.slug ?? null,
  }))

  const enrichedRequests = (requests as Record<string, unknown>[]).map(r => ({
    ...r,
    program_name: (programMap[r.program_id as string] as Record<string, unknown> | undefined)?.name ?? null,
    org_name:     (orgMap[r.organization_id as string] as Record<string, unknown> | undefined)?.name ?? null,
  })) as (DonorAccessRequest & { program_name: string | null; org_name: string | null })[]

  return (
    <DonorAccessClient
      grants={enrichedGrants as (Record<string, unknown> & { program_name: string | null; org_name: string | null; org_slug: string | null })[]}
      requests={enrichedRequests}
    />
  )
}
