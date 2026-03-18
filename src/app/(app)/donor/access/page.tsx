import { requireDonorAuth } from '@/lib/auth/server'
import DonorAccessClient from './DonorAccessClient'
import type { AccessLevel } from '@/lib/supabase/database.types'

export default async function DonorAccessPage() {
  const { supabase, user } = await requireDonorAuth()

  // Fetch active grants
  const { data: rawGrants } = await supabase
    .from('donor_program_access')
    .select('id, program_id, organization_id, access_level, can_download_reports, active, granted_at, expires_at')
    .eq('donor_id', user.id)
    .eq('active', true)
    .order('granted_at', { ascending: false })

  // Enrich with program + org names
  const programIds = (rawGrants ?? []).map(g => g.program_id)
  let programMap: Record<string, { name: string; orgName: string }> = {}
  if (programIds.length > 0) {
    const { data: programs } = await supabase.from('programs').select('id, name, organization_id').in('id', programIds)
    const orgIds = Array.from(new Set((programs ?? []).map(p => p.organization_id)))
    const { data: orgs } = orgIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] }
    const orgById = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
    for (const p of programs ?? []) {
      programMap[p.id] = { name: p.name, orgName: orgById[p.organization_id]?.name ?? '' }
    }
  }

  const grants = (rawGrants ?? []).map(g => ({
    ...g,
    program_name: programMap[g.program_id]?.name ?? null,
    org_name: programMap[g.program_id]?.orgName ?? null,
  }))

  // Fetch pending requests
  const { data: requests } = await supabase
    .from('donor_access_requests')
    .select('id, program_id, requested_access_level, status, message, response_message, created_at')
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <DonorAccessClient
      grants={grants as any}
      requests={(requests ?? []) as any}
    />
  )
}
