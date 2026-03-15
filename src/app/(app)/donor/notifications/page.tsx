import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationsClient from './NotificationsClient'
import { listNotifications } from '@/app/actions/notifications'

export default async function DonorNotificationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') redirect('/login')

  const notificationsResult = await listNotifications()

  return (
    <NotificationsClient
      notifications={notificationsResult.data ?? []}
    />
  )
}
