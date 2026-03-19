import { requireDonorAuth } from '@/lib/auth/server'
import DonorProfileClient from './DonorProfileClient'

export default async function DonorProfilePage() {
  const { supabase, user } = await requireDonorAuth()

  // Fetch donor_profiles row
  const { data: donorProfile } = await supabase
    .from('donor_profiles')
    .select('organization_name, contact_email, website')
    .eq('id', user.id)
    .single()

  return (
    <DonorProfileClient
      fullName={user.profile.full_name ?? ''}
      email={user.email}
      organizationName={donorProfile?.organization_name ?? ''}
      contactEmail={donorProfile?.contact_email ?? user.email}
      website={donorProfile?.website ?? ''}
    />
  )
}
