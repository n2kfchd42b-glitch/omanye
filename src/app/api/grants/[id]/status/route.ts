// PATCH /api/grants/[id]/status — update grant status
// Body: { status: 'draft' | 'submitted' | 'awarded' | 'rejected' }
// NGO_ADMIN only. Logs to audit trail.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError, notFound } from '@/lib/api/errors'
import type { GrantStatus } from '@/lib/grant-types'

const VALID_STATUSES: GrantStatus[] = ['draft', 'submitted', 'awarded', 'rejected']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (profile.role !== 'NGO_ADMIN') return forbidden()

  let body: { status?: string }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  if (!body.status || !VALID_STATUSES.includes(body.status as GrantStatus)) {
    return internalError(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const { data: grant } = await db
    .from('grants')
    .select('id, organization_id, opportunity_title, status')
    .eq('id', params.id)
    .single()

  if (!grant) return notFound('Grant')
  if (grant.organization_id !== profile.organization_id) return forbidden()

  const { error } = await db
    .from('grants')
    .update({ status: body.status })
    .eq('id', grant.id)

  if (error) return internalError(error.message)

  // Audit log (best-effort — log errors but don't block the response)
  await db.from('audit_logs').insert({
    organization_id: profile.organization_id,
    actor_id:        user.id,
    actor_name:      profile.full_name ?? user.email,
    action:          'UPDATE',
    resource_type:   'Grant',
    resource_id:     grant.id,
    resource_name:   grant.opportunity_title,
    details:         `Status changed from ${grant.status} to ${body.status}`,
  }).catch((e: unknown) => {
    console.error('[audit] grant status log failed:', e)
  })

  return NextResponse.json({ success: true })
}
