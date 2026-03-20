// POST /api/grants/[id]/versions — save a new version of a grant
// Body: { content, generation_inputs }
// Creates a new version row, increments current_version on the grant.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError, notFound } from '@/lib/api/errors'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  let body: { content?: unknown; generation_inputs?: unknown }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Verify grant ownership
  const { data: grant } = await db
    .from('grants')
    .select('id, organization_id, current_version')
    .eq('id', params.id)
    .single()

  if (!grant) return notFound('Grant')
  if (grant.organization_id !== profile.organization_id) return forbidden()

  const newVersion = (grant.current_version ?? 1) + 1

  const { error: vErr } = await db.from('grant_versions').insert({
    grant_id:          grant.id,
    version_number:    newVersion,
    content:           body.content ?? {},
    generation_inputs: body.generation_inputs ?? {},
    generated_by:      user.id,
  })
  if (vErr) return internalError(vErr.message)

  const { error: gErr } = await db
    .from('grants')
    .update({ current_version: newVersion })
    .eq('id', grant.id)
  if (gErr) return internalError(gErr.message)

  // Return updated grant with versions
  const { data: updated } = await db
    .from('grants')
    .select('*, grant_versions(id, version_number, content, generation_inputs, created_at, generated_by)')
    .eq('id', grant.id)
    .single()

  return NextResponse.json({ grant: updated })
}
