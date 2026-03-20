import { requireOrgAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import MatchesClient from './MatchesClient'
import type { SavedRow, FunderOpportunity } from '../funders/page'

interface Props { params: { slug: string } }

export default async function MatchesPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(user.profile.role)) {
    redirect(`/org/${params.slug}/dashboard`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch org data — profile tags + grant profile fields for completeness
  const { data: orgData } = await db
    .from('organizations')
    .select(`
      id, slug, name,
      focus_areas, eligible_geographies, program_types, annual_budget_range,
      mission_statement, founding_year, beneficiary_types,
      past_program_summaries, key_achievements
    `)
    .eq('id', org.id)
    .single()

  const ngoProfile = {
    focus_areas:          (orgData?.focus_areas          ?? []) as string[],
    eligible_geographies: (orgData?.eligible_geographies ?? []) as string[],
    program_types:        (orgData?.program_types        ?? []) as string[],
    annual_budget_range:  (orgData?.annual_budget_range  ?? null) as string | null,
  }

  // Fetch saved opportunities
  const { data: savedRows } = await db
    .from('funder_saved_opportunities')
    .select('id, opportunity_id, status, notes, saved_at, funder_opportunities(*)')
    .eq('organization_id', org.id)
    .order('saved_at', { ascending: false })

  return (
    <MatchesClient
      orgSlug={params.slug}
      orgId={org.id}
      ngoProfile={ngoProfile}
      initialSaved={(savedRows ?? []) as SavedRow[]}
      orgData={orgData ?? {}}
    />
  )
}

export type { FunderOpportunity }
