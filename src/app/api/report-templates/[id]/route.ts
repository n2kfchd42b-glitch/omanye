// PATCH  /api/report-templates/:id  — update template (admin only)
// DELETE /api/report-templates/:id  — delete template (admin only, non-default only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import type { UpdateTemplatePayload } from '@/types/report-templates'

interface RouteParams { params: { id: string } }

async function resolveAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: unauthorized() }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { ok: false as const, response: unauthorized() }
  if (profile.role !== 'NGO_ADMIN') return { ok: false as const, response: forbidden() }

  return { ok: true as const, orgId: profile.organization_id }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await resolveAdmin()
  if (!auth.ok) return auth.response

  const { orgId } = auth
  const body: UpdateTemplatePayload = await req.json()

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any  = supabase

  // Verify ownership
  const { data: existing } = await db
    .from('report_templates')
    .select('id, organization_id')
    .eq('id', params.id)
    .single()

  if (!existing || existing.organization_id !== orgId) return notFound('Template')

  const patch: Record<string, unknown> = {}
  if (body.template_name !== undefined) patch.template_name = body.template_name
  if (body.sections       !== undefined) patch.sections      = body.sections
  if (body.branding        !== undefined) patch.branding       = body.branding

  const { data, error } = await db
    .from('report_templates')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return internalError(error.message)

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await resolveAdmin()
  if (!auth.ok) return auth.response

  const { orgId } = auth
  const supabase  = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any   = supabase

  const { data: existing } = await db
    .from('report_templates')
    .select('id, organization_id, is_default')
    .eq('id', params.id)
    .single()

  if (!existing || existing.organization_id !== orgId) return notFound('Template')

  if (existing.is_default) {
    return NextResponse.json({ error: 'Cannot delete a default template' }, { status: 400 })
  }

  const { error } = await db
    .from('report_templates')
    .delete()
    .eq('id', params.id)

  if (error) return internalError(error.message)

  return new NextResponse(null, { status: 204 })
}
