// ── Notification Sender ───────────────────────────────────────────────────────
// Server-side only. Uses service role to bypass RLS.
// Fire-and-forget — never throws, never blocks response.

import { adminClient } from '@/lib/supabase/admin'
import type { NotificationPayload } from '@/types/audit'

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = adminClient
    const { error } = await db.from('notifications').insert({
      organization_id: payload.organizationId,
      recipient_id:    payload.recipientId,
      type:            payload.type,
      title:           payload.title,
      body:            payload.body,
      link:            payload.link   ?? null,
      priority:        payload.priority,
      read:            false,
    })
    if (error) {
      console.error('[notifications] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[notifications] unexpected error:', err)
  }
}

// ── Helper: get all NGO_ADMINs for an org ─────────────────────────────────────

export async function getOrgAdmins(organizationId: string): Promise<{ id: string; full_name: string }[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = adminClient
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', organizationId)
      .eq('role', 'NGO_ADMIN')

    if (error) {
      console.error('[notifications] getOrgAdmins failed:', error.message)
      return []
    }
    return data ?? []
  } catch {
    return []
  }
}

// ── Helper: get all NGO team members for an org ───────────────────────────────

export async function getOrgTeam(organizationId: string): Promise<{ id: string; full_name: string }[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = adminClient
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', organizationId)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])

    if (error) {
      console.error('[notifications] getOrgTeam failed:', error.message)
      return []
    }
    return data ?? []
  } catch {
    return []
  }
}

// ── Helper: notify multiple recipients ───────────────────────────────────────

export async function notifyMany(
  recipients: { id: string }[],
  payload: Omit<NotificationPayload, 'recipientId'>,
): Promise<void> {
  await Promise.all(
    recipients.map(r => sendNotification({ ...payload, recipientId: r.id }))
  )
}
