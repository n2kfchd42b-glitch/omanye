// GET /api/donor/reports/:id/download
// Gated by can_download_reports. Scaffolded — actual PDF generation is Prompt 7.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: reportRaw } = await db
    .from('reports')
    .select('program_id, title')
    .eq('id', params.id)
    .single()

  if (!reportRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const report = reportRaw as { program_id: string; title: string }

  const { data: grantRaw } = await supabase
    .from('donor_program_access')
    .select('can_download_reports')
    .eq('donor_id', user.id)
    .eq('program_id', report.program_id)
    .eq('active', true)
    .single()

  const grant = grantRaw as { can_download_reports: boolean } | null
  if (!grant?.can_download_reports) {
    return NextResponse.json(
      { error: 'Download access not granted. Contact the program team.' },
      { status: 403 }
    )
  }

  // Scaffolded — PDF generation implemented in Prompt 7
  return NextResponse.json(
    { message: 'PDF generation coming soon', report_id: params.id },
    { status: 501 }
  )
}
