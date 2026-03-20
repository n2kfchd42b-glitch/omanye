import { requireOrgAuth } from '@/lib/auth/server'
import { redirect }       from 'next/navigation'
import ImpactClient        from './ImpactClient'

interface Props { params: { slug: string } }

export default async function ImpactPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(user.profile.role)) {
    redirect(`/org/${params.slug}/dashboard`)
  }

  // Fetch last 5 estimates for this org
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: recentEstimates } = await db
    .from('impact_estimates')
    .select('id, program_type, geography_region, total_budget, currency, duration_months, target_beneficiary_count, notes, results, confidence_level, created_at')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <ImpactClient
      orgSlug={params.slug}
      orgId={org.id}
      orgName={org.name}
      userId={user.id}
      initialEstimates={(recentEstimates ?? []) as unknown[]}
    />
  )
}
