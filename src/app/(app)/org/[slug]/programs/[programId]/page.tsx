import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgramDetailClient from './ProgramDetailClient'
import type { Program, Indicator, ProgramUpdate } from '@/lib/programs'

interface Props {
  params: { slug: string; programId: string }
}

export default async function ProgramDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name, avatar_url')
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

  // Fetch program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.programId)
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .single()

  if (!program) redirect(`/org/${params.slug}/programs`)

  // Fetch indicators
  const { data: indicators } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', params.programId)
    .order('sort_order', { ascending: true })

  // Fetch program updates
  const { data: updates } = await supabase
    .from('program_updates')
    .select('*')
    .eq('program_id', params.programId)
    .order('published_at', { ascending: false })

  return (
    <ProgramDetailClient
      program={program as Program}
      indicators={(indicators ?? []) as Indicator[]}
      updates={(updates ?? []) as ProgramUpdate[]}
      userRole={profile.role}
      orgSlug={params.slug}
      currentUserId={user.id}
    />
  )
}
