import { requireDonorAuth } from '@/lib/auth/server'
import NotificationsClient from './NotificationsClient'

export default async function DonorNotificationsPage() {
  const { supabase, user } = await requireDonorAuth()

  // Fetch notifications for this donor
  const { data: notifications } = await supabase
    .from('donor_notifications')
    .select('*')
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <NotificationsClient
      notifications={(notifications ?? []) as any}
    />
  )
}
