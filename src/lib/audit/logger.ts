// ── Audit Logger ──────────────────────────────────────────────────────────────
// Server-side only. Uses service role to bypass RLS.
// Fire-and-forget — never throws, never blocks response.

import { adminClient } from '@/lib/supabase/admin'
import type { AuditLogEntry } from '@/types/audit'

export async function logAction(entry: AuditLogEntry): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = adminClient
    const { error } = await db.from('audit_log').insert({
      organization_id: entry.organizationId,
      actor_id:        entry.actorId,
      actor_name:      entry.actorName,
      actor_role:      entry.actorRole,
      action:          entry.action,
      entity_type:     entry.entityType  ?? null,
      entity_id:       entry.entityId    ?? null,
      entity_name:     entry.entityName  ?? null,
      changes:         entry.changes     ?? null,
      metadata:        entry.metadata    ?? null,
      ip_address:      entry.ipAddress   ?? null,
    })
    if (error) {
      console.error('[audit] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[audit] unexpected error:', err)
  }
}

// ── Convenience: fetch actor profile then log ─────────────────────────────────

export async function logActionForUser(
  userId: string,
  rest: Omit<AuditLogEntry, 'actorId' | 'actorName' | 'actorRole' | 'organizationId'> & {
    organizationId?: string
  },
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = adminClient
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, role, organization_id')
      .eq('id', userId)
      .single()

    if (!profile) return

    await logAction({
      ...rest,
      actorId:        userId,
      actorName:      profile.full_name ?? 'Unknown',
      actorRole:      profile.role      ?? 'unknown',
      organizationId: rest.organizationId ?? profile.organization_id,
    })
  } catch (err) {
    console.error('[audit] logActionForUser error:', err)
  }
}
