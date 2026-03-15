import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NGOOnboarding } from './NGOOnboarding'
import { DonorOnboarding } from './DonorOnboarding'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Already onboarded — send to home
  if (profile.onboarding_complete) {
    if (profile.role === 'DONOR') redirect('/donor/dashboard')
    if (profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', profile.organization_id)
        .single()
      if (org?.slug) redirect(`/org/${org.slug}/dashboard`)
    }
    redirect('/login')
  }

  if (profile.role === 'DONOR') {
    return (
      <DonorOnboarding
        userId={user.id}
        initialName={profile.full_name ?? ''}
      />
    )
  }

  // NGO user — fetch org details
  let orgData: { id: string; slug: string; name: string } | null = null
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id, slug, name')
      .eq('id', profile.organization_id)
      .single()
    orgData = org ?? null
  }

  return (
    <NGOOnboarding
      userId={user.id}
      orgId={orgData?.id ?? ''}
      orgSlug={orgData?.slug ?? ''}
      orgName={orgData?.name ?? ''}
      initialName={profile.full_name ?? ''}
    />
  )
}
