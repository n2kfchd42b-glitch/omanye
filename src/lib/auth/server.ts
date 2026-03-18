import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { OmanyeRole } from '@/lib/supabase/database.types'

export interface AuthUser {
  id: string
  email: string
  profile: {
    role: OmanyeRole
    organization_id: string | null
    full_name: string | null
    onboarding_complete: boolean
  }
}

/**
 * Require an authenticated user with a profile.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<{ supabase: ReturnType<typeof createClient>; user: AuthUser }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return {
    supabase,
    user: {
      id: user.id,
      email: user.email ?? '',
      profile: {
        role: profile.role,
        organization_id: profile.organization_id,
        full_name: profile.full_name,
        onboarding_complete: profile.onboarding_complete,
      },
    },
  }
}

/**
 * Require an authenticated NGO user who belongs to the given org slug.
 * Returns the org details and validated user.
 */
export async function requireOrgAuth(slug: string) {
  const { supabase, user } = await requireAuth()

  if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(user.profile.role)) {
    redirect('/donor/dashboard')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .eq('slug', slug)
    .single()

  if (!org) {
    redirect('/login')
  }

  // Verify user belongs to this organization
  if (user.profile.organization_id !== org.id) {
    redirect('/login')
  }

  return { supabase, user, org }
}

/**
 * Require an authenticated donor user.
 */
export async function requireDonorAuth() {
  const { supabase, user } = await requireAuth()

  if (user.profile.role !== 'DONOR') {
    // NGO user trying to access donor routes — redirect to their org
    if (user.profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', user.profile.organization_id)
        .single()
      if (org?.slug) redirect(`/org/${org.slug}/dashboard`)
    }
    redirect('/login')
  }

  return { supabase, user }
}
