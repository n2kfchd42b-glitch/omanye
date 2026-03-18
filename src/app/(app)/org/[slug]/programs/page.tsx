import { redirect } from 'next/navigation'
import { requireOrgAuth } from '@/lib/auth/server'
import ProgramsClient from './ProgramsClient'
import type { Program } from '@/lib/programs'

interface Props {
  params: { slug: string }
}

export default async function ProgramsPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('organization_id', org.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <ProgramsClient
      programs={(programs ?? []) as Program[]}
      userRole={user.profile.role}
      orgSlug={params.slug}
    />
  )
}
