// PATCH /api/reports/:id/publish
// Toggle visible_to_donors. NGO_ADMIN only (enforced by RLS).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'

interface RouteParams { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body: { visible_to_donors: boolean } = await req.json()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('reports')
    .update({ visible_to_donors: body.visible_to_donors })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const d = data as Record<string, unknown>
  void logActionForUser(user.id, {
    action:     'report.published',
    entityType: 'report',
    entityId:   params.id,
    entityName: d.title as string,
    changes:    { visible_to_donors: { from: !body.visible_to_donors, to: body.visible_to_donors } },
    metadata:   { program_id: d.program_id as string },
  })

  return NextResponse.json({ data })
}
