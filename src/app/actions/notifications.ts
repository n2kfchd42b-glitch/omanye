'use server'

// ── OMANYE Donor Notifications — Server Actions ────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import type { DonorNotification } from '@/lib/donors'

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

export async function listNotifications(): Promise<ActionResult<DonorNotification[]>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  const { data, error } = await supabase
    .from('donor_notifications')
    .select(`
      *,
      program:programs(name),
      organization:organizations(name)
    `)
    .eq('donor_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    program_name: (row.program as { name: string } | null)?.name ?? null,
    org_name:     (row.organization as { name: string } | null)?.name ?? null,
  }))

  return { data: rows as DonorNotification[], error: null }
}

export async function getUnreadCount(): Promise<ActionResult<number>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: 0, error: null }

  const { count, error } = await supabase
    .from('donor_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('donor_id', user.id)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  const { error } = await supabase
    .from('donor_notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('donor_id', user.id)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

export async function markAllNotificationsRead(): Promise<ActionResult<true>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  const { error } = await supabase
    .from('donor_notifications')
    .update({ read: true })
    .eq('donor_id', user.id)
    .eq('read', false)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}
