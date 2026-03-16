// GET /api/field/summary?program_id= — M&E summary for a program

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MaeSummary, SubmissionStatus } from '@/types/field'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const programId = req.nextUrl.searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const [submissionsResult, formsResult] = await Promise.all([
    db
      .from('field_submissions')
      .select('id, status, submission_date, location_name')
      .eq('program_id', programId),
    db
      .from('field_collection_forms')
      .select('id', { count: 'exact', head: true })
      .eq('program_id', programId)
      .eq('active', true),
  ])

  if (submissionsResult.error) {
    return NextResponse.json({ error: submissionsResult.error.message }, { status: 500 })
  }

  const submissions = (submissionsResult.data ?? []) as {
    id: string
    status: SubmissionStatus
    submission_date: string
    location_name: string
  }[]

  const now          = new Date()
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const byStatus: Record<SubmissionStatus, number> = {
    DRAFT:     0,
    SUBMITTED: 0,
    REVIEWED:  0,
    FLAGGED:   0,
  }

  let thisMonth = 0
  let lastDate: string | null = null
  const locationMap = new Map<string, number>()

  for (const s of submissions) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1
    if (s.submission_date?.startsWith(thisMonthStr)) thisMonth++
    if (!lastDate || s.submission_date > lastDate) lastDate = s.submission_date
    if (s.location_name) {
      locationMap.set(s.location_name, (locationMap.get(s.location_name) ?? 0) + 1)
    }
  }

  const byLocation = Array.from(locationMap.entries())
    .map(([location_name, count]) => ({ location_name, count }))
    .sort((a, b) => b.count - a.count)

  const summary: MaeSummary = {
    total_submissions:      submissions.length,
    submissions_this_month: thisMonth,
    by_status:              byStatus,
    by_location:            byLocation,
    last_submission_date:   lastDate,
    active_forms_count:     formsResult.count ?? 0,
  }

  return NextResponse.json({ data: summary })
}
