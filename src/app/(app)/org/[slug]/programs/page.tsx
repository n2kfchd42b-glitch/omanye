import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgramsClient from './ProgramsClient'
import type { Program } from '@/lib/programs'

interface Props {
  params: { slug: string }
}

export default async function ProgramsPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    redirect('/login')
  }

  if (!profile.organization_id) redirect('/onboarding')

  // Validate org slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .eq('id', profile.organization_id)
    .single()

  if (!org || org.slug !== params.slug) {
    redirect(org ? `/org/${org.slug}/programs` : '/login')
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <ProgramsClient
      programs={(programs ?? []) as Program[]}
      userRole={profile.role}
      orgSlug={params.slug}
    />
  )
}
