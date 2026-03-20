import { requireOrgAuth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import FundersClient from './FundersClient'

interface Props { params: { slug: string } }

export default async function FundersPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  // Only NGO_ADMIN and NGO_STAFF may access this page
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(user.profile.role)) {
    redirect(`/org/${params.slug}/dashboard`)
  }

  // Fetch the org's profile tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: orgData } = await db
    .from('organizations')
    .select('focus_areas, eligible_geographies, program_types, annual_budget_range')
    .eq('id', org.id)
    .single()

  const ngoProfile = {
    focus_areas:          (orgData?.focus_areas          ?? []) as string[],
    eligible_geographies: (orgData?.eligible_geographies ?? []) as string[],
    program_types:        (orgData?.program_types        ?? []) as string[],
    annual_budget_range:  (orgData?.annual_budget_range  ?? null) as string | null,
  }

  // Fetch saved opportunity IDs for this org so the client knows which are saved
  const { data: savedRows } = await db
    .from('funder_saved_opportunities')
    .select('id, opportunity_id, status, notes, saved_at, funder_opportunities(*)')
    .eq('organization_id', org.id)
    .order('saved_at', { ascending: false })

  return (
    <FundersClient
      orgSlug={params.slug}
      orgId={org.id}
      ngoProfile={ngoProfile}
      initialSaved={(savedRows ?? []) as SavedRow[]}
    />
  )
}

export interface SavedRow {
  id:             string
  opportunity_id: string
  status:         'saved' | 'applied' | 'declined'
  notes:          string | null
  saved_at:       string
  funder_opportunities: FunderOpportunity
}

export interface FunderOpportunity {
  id:                   string
  funder_name:          string
  opportunity_title:    string
  description:          string
  focus_areas:          string[]
  eligible_geographies: string[]
  eligible_org_types:   string[]
  funding_range_min:    number | null
  funding_range_max:    number | null
  application_deadline: string | null
  external_link:        string | null
  status:               string
}
