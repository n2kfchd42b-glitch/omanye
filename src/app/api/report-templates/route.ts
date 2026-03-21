// GET  /api/report-templates  — list templates for the authed org
//   ?donor_id=<uuid>   filter by donor (use "org" to get org-level defaults)
//   ?report_type=X     filter by report type
//
// POST /api/report-templates  — create a template

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'
import type { CreateTemplatePayload } from '@/types/report-templates'
import { defaultSections } from '@/types/report-templates'

async function resolveAdmin(req: NextRequest) {
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

  return { ok: true as const, orgId: profile.organization_id, userId: user.id }
}

async function resolveMember() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: unauthorized() }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { ok: false as const, response: unauthorized() }

  return { ok: true as const, orgId: profile.organization_id }
}

export async function GET(req: NextRequest) {
  const auth = await resolveMember()
  if (!auth.ok) return auth.response

  const { orgId } = auth
  const sp         = req.nextUrl.searchParams
  const donorParam = sp.get('donor_id')
  const rtParam    = sp.get('report_type')

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any  = supabase

  let query = db
    .from('report_templates')
    .select('*, profiles!report_templates_donor_id_fkey(full_name)')
    .eq('organization_id', orgId)
    .order('is_default', { ascending: false })
    .order('template_name', { ascending: true })

  if (donorParam === 'org') {
    query = query.is('donor_id', null)
  } else if (donorParam) {
    query = query.eq('donor_id', donorParam)
  }

  if (rtParam) {
    query = query.eq('report_type', rtParam)
  }

  const { data, error } = await query
  if (error) return internalError(error.message)

  const templates = (data ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    donor_name: (t.profiles as { full_name: string } | null)?.full_name ?? null,
    profiles:   undefined,
  }))

  return NextResponse.json({ data: templates })
}

export async function POST(req: NextRequest) {
  const auth = await resolveAdmin(req)
  if (!auth.ok) return auth.response

  const { orgId, userId } = auth
  const body: CreateTemplatePayload = await req.json()

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any  = supabase

  const { data, error } = await db
    .from('report_templates')
    .insert({
      organization_id: orgId,
      donor_id:        body.donor_id ?? null,
      template_name:   body.template_name,
      report_type:     body.report_type,
      sections:        body.sections ?? defaultSections(),
      branding:        body.branding  ?? {},
      is_default:      false,
      created_by:      userId,
    })
    .select()
    .single()

  if (error) return internalError(error.message)

  return NextResponse.json({ data }, { status: 201 })
}
