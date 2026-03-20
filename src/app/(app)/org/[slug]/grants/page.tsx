import { requireOrgAuth } from '@/lib/auth/server'
import { redirect }       from 'next/navigation'
import GrantsClient        from './GrantsClient'

interface Props { params: { slug: string } }

export default async function GrantsPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(user.profile.role)) {
    redirect(`/org/${params.slug}/dashboard`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch grant profile to know if it's complete
  const { data: orgData } = await db
    .from('organizations')
    .select('mission_statement, founding_year, beneficiary_types, past_program_summaries, key_achievements, typical_budget_range, name')
    .eq('id', org.id)
    .single()

  // Fetch all grants for this org
  const { data: grants } = await db
    .from('grants')
    .select('*, grant_versions(id, version_number, content, generation_inputs, created_at, generated_by)')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })

  const grantProfile = {
    mission_statement:      (orgData?.mission_statement      ?? null) as string | null,
    founding_year:          (orgData?.founding_year          ?? null) as number | null,
    beneficiary_types:      (orgData?.beneficiary_types      ?? [])   as string[],
    past_program_summaries: (orgData?.past_program_summaries ?? null) as string | null,
    key_achievements:       (orgData?.key_achievements       ?? null) as string | null,
    typical_budget_range:   (orgData?.typical_budget_range   ?? null) as string | null,
  }

  const profileComplete = [
    grantProfile.mission_statement,
    grantProfile.founding_year,
    grantProfile.beneficiary_types.length > 0,
    grantProfile.past_program_summaries,
    grantProfile.key_achievements,
  ].filter(Boolean).length >= 5

  return (
    <GrantsClient
      orgSlug={params.slug}
      orgId={org.id}
      orgName={orgData?.name ?? org.name}
      userId={user.id}
      userRole={user.profile.role as 'NGO_ADMIN' | 'NGO_STAFF'}
      grantProfile={grantProfile}
      profileComplete={profileComplete}
      initialGrants={(grants ?? []) as unknown[]}
    />
  )
}
