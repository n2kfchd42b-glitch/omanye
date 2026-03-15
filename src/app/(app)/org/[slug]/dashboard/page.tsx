import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OmanyeWorkspace from './OmanyeWorkspace'
import type { UserRole } from '@/lib/types'

interface Props {
  params: { slug: string }
}

export default async function OrgDashboardPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    redirect('/login')
  }

  // Fetch org to validate slug and get org name
  let orgName = ''
  let orgSlug = params.slug
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug, name')
      .eq('id', profile.organization_id)
      .single()

    if (org) {
      orgName = org.name
      orgSlug = org.slug
      // Ensure the slug in the URL matches the user's actual org
      if (org.slug !== params.slug) {
        redirect(`/org/${org.slug}/dashboard`)
      }
    }
  }

  return (
    <OmanyeWorkspace
      initialUser={{
        name:  profile.full_name  ?? user.email ?? 'User',
        email: user.email         ?? '',
        org:   orgName,
        role:  mapRole(profile.role) as UserRole,
      }}
      orgSlug={orgSlug}
    />
  )
}

function mapRole(role: string): UserRole {
  switch (role) {
    case 'NGO_ADMIN':  return 'Admin'
    case 'NGO_STAFF':  return 'Field Staff'
    case 'NGO_VIEWER': return 'Viewer'
    default:           return 'Viewer'
  }
}
