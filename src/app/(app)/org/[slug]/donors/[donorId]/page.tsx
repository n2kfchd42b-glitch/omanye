import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDonor } from '@/app/actions/donors'
import DonorDetailClient from './DonorDetailClient'

interface Props {
  params: { slug: string; donorId: string }
}

export default async function DonorDetailPage({ params }: Props) {
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

  // Fetch donor detail + available programs in parallel
  const [donorResult, programsResult] = await Promise.all([
    getDonor(profile.organization_id, params.donorId),
    supabase
      .from('programs')
      .select('id, name, status')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  if (!donorResult.data) {
    redirect(`/org/${params.slug}/donors`)
  }

  return (
    <DonorDetailClient
      orgSlug={params.slug}
      organizationId={profile.organization_id}
      userRole={profile.role}
      donor={donorResult.data}
      programs={(programsResult.data ?? []) as { id: string; name: string; status: string }[]}
      currentUserId={user.id}
    />
  )
}
