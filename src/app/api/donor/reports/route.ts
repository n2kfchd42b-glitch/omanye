// GET /api/donor/reports — list visible reports for the authenticated donor

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileRaw as { role: string } | null
  if (profile?.role !== 'DONOR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // RLS on reports ensures: visible_to_donors=true AND donor_can_access_program()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('reports')
    .select(`
      id, title, report_type, reporting_period_start, reporting_period_end,
      status, visible_to_donors, submitted_at, created_at, program_id, organization_id,
      programs(name), organizations(name)
    `)
    .order('submitted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data as Record<string, unknown>[]) ?? []
  const programIds = Array.from(new Set(rows.map((r) => r.program_id as string)))

  const { data: grants } = await supabase
    .from('donor_program_access')
    .select('program_id, can_download_reports, access_level')
    .eq('donor_id', user.id)
    .eq('active', true)
    .in('program_id', programIds.length > 0 ? programIds : ['__none__'])

  const grantMap = new Map(
    ((grants ?? []) as { program_id: string; can_download_reports: boolean; access_level: string }[])
      .map((g) => [g.program_id, { can_download: g.can_download_reports, access_level: g.access_level }])
  )

  const reports = rows.map((r) => ({
    ...r,
    program_name:      (r.programs      as { name: string } | null)?.name ?? null,
    organization_name: (r.organizations as { name: string } | null)?.name ?? null,
    can_download:      grantMap.get(r.program_id as string)?.can_download  ?? false,
    access_level:      grantMap.get(r.program_id as string)?.access_level  ?? 'SUMMARY_ONLY',
    programs:          undefined,
    organizations:     undefined,
  }))

  return NextResponse.json({ data: reports })
}
