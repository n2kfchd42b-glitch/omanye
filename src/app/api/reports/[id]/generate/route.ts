// POST /api/reports/:id/generate
// Fetches live program data and generates report content.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportContent } from '@/lib/reports/generator'
import type { ReportSection } from '@/types/reports'
import { logActionForUser } from '@/lib/audit/logger'

interface RouteParams { params: { id: string } }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: report, error: fetchErr } = await db.from('reports').select('*').eq('id', params.id).single()

  if (fetchErr || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  const r = report as Record<string, unknown>
  const content = await generateReportContent(
    r.program_id as string,
    (r.sections as ReportSection[]) ?? [],
    (r.reporting_period_start as string | null) ?? null,
    (r.reporting_period_end   as string | null) ?? null,
    (r.challenges             as string | null) ?? null,
  )

  const { data, error } = await db
    .from('reports')
    .update({ content, status: 'GENERATED', generated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logActionForUser(user.id, {
    action:     'report.generated',
    entityType: 'report',
    entityId:   params.id,
    entityName: r.title as string,
    metadata:   { program_id: r.program_id as string },
  })

  return NextResponse.json({ data })
}
