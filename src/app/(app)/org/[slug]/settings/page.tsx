import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrgSettingsClient from './OrgSettingsClient'

interface Props { params: { slug: string } }

export default async function OrgSettingsPage({ params }: Props) {
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
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  if (!org || (org as Record<string, unknown>).slug !== params.slug) {
    redirect(org ? `/org/${(org as Record<string, unknown>).slug}/settings` : '/login')
  }

  // Fetch member + program counts for billing tab
  const [memberCountResult, programCountResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']),
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null),
  ])

  // Fetch all team members for transfer ownership
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('organization_id', profile.organization_id)
    .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])
    .neq('id', user.id)

  return (
    <OrgSettingsClient
      org={org as Parameters<typeof OrgSettingsClient>[0]['org']}
      userRole={profile.role as 'NGO_ADMIN' | 'NGO_STAFF' | 'NGO_VIEWER'}
      currentUserId={user.id}
      orgSlug={params.slug}
      memberCount={memberCountResult.count ?? 0}
      programCount={programCountResult.count ?? 0}
      teamMembers={(teamMembers ?? []) as { id: string; full_name: string | null; role: string }[]}
    />
  )
}
