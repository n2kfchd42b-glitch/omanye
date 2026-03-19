import { requireOrgAuth } from '@/lib/auth/server'
import AppShell from '@/components/AppShell'
import type { UserRole } from '@/lib/types'

interface Props {
  params:   { slug: string }
  children: React.ReactNode
}

function mapRole(role: string): UserRole {
  switch (role) {
    case 'NGO_ADMIN':  return 'Admin'
    case 'NGO_STAFF':  return 'Field Staff'
    case 'NGO_VIEWER': return 'Viewer'
    default:           return 'Viewer'
  }
}

export default async function OrgLayout({ params, children }: Props) {
  const { user, org } = await requireOrgAuth(params.slug)

  const appUser = {
    name:  user.profile.full_name ?? org.name,
    email: user.email,
    org:   org.name,
    role:  mapRole(user.profile.role) as UserRole,
  }

  return (
    <AppShell user={appUser} orgSlug={org.slug}>
      {children}
    </AppShell>
  )
}
