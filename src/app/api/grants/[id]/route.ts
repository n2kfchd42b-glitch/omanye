// DELETE /api/grants/[id] — delete a draft grant (NGO_ADMIN only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError, notFound } from '@/lib/api/errors'

export async function DELETE(
  _req: NextRequest,
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
  if (profile.role !== 'NGO_ADMIN') return forbidden()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const { data: grant } = await db
    .from('grants')
    .select('id, organization_id, status')
    .eq('id', params.id)
    .single()

  if (!grant) return notFound('Grant')
  if (grant.organization_id !== profile.organization_id) return forbidden()
  if (grant.status !== 'draft') return forbidden('Only draft grants can be deleted')

  const { error } = await db.from('grants').delete().eq('id', grant.id)
  if (error) return internalError(error.message)

  return NextResponse.json({ success: true })
}
