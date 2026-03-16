// GET /api/field/submissions/:id — single submission

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('field_submissions')
    .select(`
      *,
      submitter:profiles!submitted_by(full_name),
      reviewer:profiles!reviewed_by(full_name),
      form:field_collection_forms!form_id(id, name, fields)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sub = data as Record<string, unknown>
  return NextResponse.json({
    data: {
      ...sub,
      submitter_name: (sub.submitter as { full_name: string } | null)?.full_name ?? null,
      reviewer_name:  (sub.reviewer  as { full_name: string } | null)?.full_name ?? null,
      form_id:        (sub.form      as { id: string } | null)?.id   ?? null,
      form_name:      (sub.form      as { name: string } | null)?.name ?? null,
      form_fields:    (sub.form      as { fields: unknown } | null)?.fields ?? [],
      submitter: undefined,
      reviewer:  undefined,
      form:      undefined,
    },
  })
}
