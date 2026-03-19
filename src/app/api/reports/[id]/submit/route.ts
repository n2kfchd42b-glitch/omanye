// POST /api/reports/:id/submit
// Mark report as SUBMITTED and send donor notifications.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActionForUser } from '@/lib/audit/logger'
import { sendNotification, getOrgTeam } from '@/lib/notifications/sender'

interface RouteParams { params: { id: string } }

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: reportRaw } = await db
    .from('reports')
    .select('*, programs(name), organizations(name)')
    .eq('id', params.id)
    .single()

  if (!reportRaw) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  const report = reportRaw as Record<string, unknown>

  // Find all donors with active access to this program
  const { data: grants } = await supabase
    .from('donor_program_access')
    .select('donor_id')
    .eq('program_id', report.program_id as string)
    .eq('active', true)

  const donorIds = ((grants ?? []) as { donor_id: string }[]).map((g) => g.donor_id)

  const now = new Date().toISOString()
  const { data, error } = await db
    .from('reports')
    .update({ status: 'SUBMITTED', submitted_at: now, visible_to_donors: true })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send NEW_REPORT notifications to all donors
  if (donorIds.length > 0) {
    const programName = (report.programs as { name: string } | null)?.name ?? 'Unknown Program'
    const orgName     = (report.organizations as { name: string } | null)?.name ?? 'Your partner NGO'

    const notifications = donorIds.map((donorId) => ({
      donor_id:        donorId,
      organization_id: report.organization_id as string,
      program_id:      report.program_id as string,
      type:            'NEW_REPORT',
      title:           `New report: ${report.title as string}`,
      body:            `${orgName} has shared a new report for ${programName}.`,
      link:            `/donor/reports/${params.id}`,
    }))

    await (supabase as any).from('donor_notifications').insert(notifications)
  }

  const programName = (report.programs as { name: string } | null)?.name ?? 'Unknown Program'
  const orgId = report.organization_id as string

  void logActionForUser(user.id, {
    organizationId: orgId,
    action:         'report.submitted',
    entityType:     'report',
    entityId:       params.id,
    entityName:     report.title as string,
    metadata:       { program_id: report.program_id as string },
  })

  // Notify all NGO team members about report submission
  void (async () => {
    const team = await getOrgTeam(orgId)
    const actorName = team.find(m => m.id === user.id)?.full_name ?? 'Someone'
    await Promise.all(team.map(m => sendNotification({
      organizationId: orgId,
      recipientId:    m.id,
      type:           'REPORT_SUBMITTED',
      title:          `${actorName} submitted a report for ${programName}`,
      body:           `Report: ${report.title as string}`,
      link:           `/org/reports`,
      priority:       'LOW',
    })))
  })().catch(err => console.error('[report-submit] notification delivery failed:', err))

  return NextResponse.json({ data, notified: donorIds.length })
}
