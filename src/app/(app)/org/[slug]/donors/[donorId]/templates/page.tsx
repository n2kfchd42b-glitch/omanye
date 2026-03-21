import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TemplateBuilderClient from './TemplateBuilderClient'

interface Props {
  params: { slug: string; donorId: string }
}

export default async function DonorTemplatesPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const { data: profile } = await db
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/sign-in')
  if (profile.role !== 'NGO_ADMIN') redirect(`/org/${params.slug}/donors`)

  // Verify donor has access to this org via donor_program_access
  const { data: dpaCheck } = await db
    .from('donor_program_access')
    .select('donor_id')
    .eq('donor_id', params.donorId)
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .maybeSingle()

  if (!dpaCheck) notFound()

  // Fetch donor profile details
  const [profileRes, donorProfileRes] = await Promise.all([
    db.from('profiles').select('id, full_name').eq('id', params.donorId).single(),
    db.from('donor_profiles').select('id, organization_name, contact_email').eq('id', params.donorId).maybeSingle(),
  ])

  if (!profileRes.data) notFound()

  const donor = {
    id:                profileRes.data.id as string,
    full_name:         profileRes.data.full_name as string | null,
    email:             (donorProfileRes.data?.contact_email as string | null) ?? '',
    organization_name: (donorProfileRes.data?.organization_name as string | null) ?? null,
  }

  // Fetch existing templates for this donor + org-level defaults
  const { data: templates } = await db
    .from('report_templates')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .or(`donor_id.eq.${params.donorId},donor_id.is.null`)
    .order('is_default', { ascending: false })
    .order('report_type', { ascending: true })

  return (
    <TemplateBuilderClient
      orgSlug={params.slug}
      organizationId={profile.organization_id}
      donor={donor as { id: string; full_name: string | null; email: string; organization_name: string | null }}
      existingTemplates={templates ?? []}
    />
  )
}
