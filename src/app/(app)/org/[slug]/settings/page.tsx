import { requireOrgAuth } from '@/lib/auth/server'
import { adminClient } from '@/lib/supabase/admin'
import OrgSettingsClient from './OrgSettingsClient'

interface Props { params: { slug: string } }

export default async function OrgSettingsPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  // Only admins can access settings
  if (user.profile.role !== 'NGO_ADMIN') {
    const { redirect } = await import('next/navigation')
    redirect(`/org/${params.slug}/dashboard`)
  }

  const { data: fullOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', org.id)
    .single()

  if (!fullOrg) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }

  // Fetch member + program counts for billing tab
  const [memberCountResult, programCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']),
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .is('deleted_at', null),
  ])

  // Fetch all team members for transfer ownership
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('organization_id', org.id)
    .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])

  return (
    <OrgSettingsClient
      org={fullOrg as Parameters<typeof OrgSettingsClient>[0]['org']}
      userRole={user.profile.role as 'NGO_ADMIN' | 'NGO_STAFF' | 'NGO_VIEWER'}
      currentUserId={user.id}
      orgSlug={params.slug}
      memberCount={memberCountResult.count ?? 0}
      programCount={programCountResult.count ?? 0}
      teamMembers={(teamMembers ?? []) as { id: string; full_name: string | null; role: string }[]}
    />
  )
}
