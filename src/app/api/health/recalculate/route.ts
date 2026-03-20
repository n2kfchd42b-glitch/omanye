// POST /api/health/recalculate
// Calculates health scores for all active programs in the authenticated org.
// Also handles H6: detects RAG status transitions and fires in-platform notifications.
//
// Auth: NGO_ADMIN (cookie) OR service-role Bearer token (edge function)
// Rate limit: 3 manual calls per hour per org (bypassed for service-role)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calculateProgramHealth,
  type ProgramData,
  type IndicatorData,
  type BudgetData,
  type RAGStatus,
} from '@/lib/health/calculator'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function resolveAuth(req: NextRequest): Promise<
  | { ok: true; orgId: string; isServiceCall: boolean }
  | { ok: false; response: Response }
> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const auth       = req.headers.get('authorization') ?? ''
  const orgIdParam = req.nextUrl.searchParams.get('org_id')

  if (serviceKey && auth === `Bearer ${serviceKey}` && orgIdParam) {
    return { ok: true, orgId: orgIdParam, isServiceCall: true }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: unauthorized() }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { ok: false, response: unauthorized() }
  if (profile.role !== 'NGO_ADMIN') return { ok: false, response: forbidden() }

  return { ok: true, orgId: profile.organization_id, isServiceCall: false }
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuth(req)
  if (!auth.ok) return auth.response

  const { orgId, isServiceCall } = auth

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // ── Rate limiting (manual calls only) ─────────────────────────────────────
  if (!isServiceCall) {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()

    // Count programs in org to detect "batches" (one recalc = N rows per program)
    const { count: progCount } = await db
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'ACTIVE')

    const batchSize = Math.max(1, progCount ?? 1)

    const { count: recentRows } = await db
      .from('program_health_scores')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', oneHourAgo)

    const recentBatches = Math.floor((recentRows ?? 0) / batchSize)
    if (recentBatches >= 3) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 3 recalculations per hour per organization.' },
        { status: 429 }
      )
    }
  }

  // ── Fetch all active programs for this org ─────────────────────────────────
  const { data: programs, error: progErr } = await db
    .from('programs')
    .select('id, start_date, end_date, total_budget, expected_submission_cadence_per_week, name')
    .eq('organization_id', orgId)
    .eq('status', 'ACTIVE')

  if (progErr) return internalError(progErr.message)
  if (!programs || programs.length === 0) {
    return NextResponse.json({ scored: 0, failed: 0, message: 'No active programs' })
  }

  // ── Fetch admin profiles for RAG transition notifications ─────────────────
  const { data: admins } = await db
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .eq('role', 'NGO_ADMIN')

  const adminIds: string[] = (admins ?? []).map((a: { id: string }) => a.id)

  const now30d = new Date(Date.now() - 30 * 86_400_000).toISOString()

  let scored = 0
  let failed = 0

  for (const prog of programs as (ProgramData & { name: string })[]) {
    try {
      // ── Fetch indicators ─────────────────────────────────────────────────
      const { data: indicators } = await db
        .from('indicators')
        .select('id, name, current_value, target_value, baseline_value')
        .eq('program_id', prog.id)

      // ── Fetch budget rollup ──────────────────────────────────────────────
      const { data: categories } = await db
        .from('budget_categories')
        .select('allocated_amount')
        .eq('program_id', prog.id)

      const { data: expenditures } = await db
        .from('expenditures')
        .select('amount')
        .eq('program_id', prog.id)
        .eq('status', 'APPROVED')

      const totalAllocated = (categories ?? []).reduce(
        (s: number, c: { allocated_amount: number }) => s + Number(c.allocated_amount), 0
      )
      const totalSpent = (expenditures ?? []).reduce(
        (s: number, e: { amount: number }) => s + Number(e.amount), 0
      )

      // ── Fetch recent submission count ────────────────────────────────────
      const { count: submissionCount } = await db
        .from('field_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', prog.id)
        .gte('created_at', now30d)

      // ── Calculate score ──────────────────────────────────────────────────
      const programData: ProgramData = {
        id:                                   prog.id,
        start_date:                           prog.start_date,
        end_date:                             prog.end_date,
        total_budget:                         prog.total_budget ? Number(prog.total_budget) : null,
        expected_submission_cadence_per_week: prog.expected_submission_cadence_per_week
          ? Number(prog.expected_submission_cadence_per_week)
          : null,
      }

      const indicatorData: IndicatorData[] = (indicators ?? []).map((i: {
        id: string; name: string; current_value: number;
        target_value: number | null; baseline_value: number | null
      }) => ({
        id:             i.id,
        name:           i.name,
        current_value:  Number(i.current_value),
        target_value:   i.target_value   != null ? Number(i.target_value)   : null,
        baseline_value: i.baseline_value != null ? Number(i.baseline_value) : null,
      }))

      const budgetData: BudgetData = {
        total_allocated: totalAllocated,
        total_spent:     totalSpent,
      }

      const result = calculateProgramHealth(
        programData,
        indicatorData,
        budgetData,
        submissionCount ?? 0,
      )

      // ── Check previous RAG for transition detection (H6) ─────────────────
      const { data: prevScore } = await db
        .from('program_health_scores')
        .select('rag_status')
        .eq('program_id', prog.id)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const prevRag  = prevScore?.rag_status as RAGStatus | undefined
      const newRag   = result.rag_status
      const changed  = prevRag && prevRag !== newRag

      // ── Insert score ──────────────────────────────────────────────────────
      await db.from('program_health_scores').insert({
        program_id:           prog.id,
        organization_id:      orgId,
        composite_score:      result.composite_score,
        budget_score:         result.budget_score,
        indicator_score:      result.indicator_score,
        field_activity_score: result.field_activity_score,
        rag_status:           result.rag_status,
        score_factors:        result.score_factors,
        calculated_at:        result.calculated_at,
      })

      scored++

      // ── RAG transition notifications (H6) ─────────────────────────────────
      if (changed) {
        const isNewlyRed    = newRag === 'red'
        const isRecovery    = prevRag === 'red' && newRag !== 'red'
        const shouldNotify  = isNewlyRed || isRecovery

        if (shouldNotify && adminIds.length > 0) {
          const title = isNewlyRed
            ? `${prog.name} has dropped to at-risk status`
            : `${prog.name} has improved to ${newRag} status`

          const body = isNewlyRed
            ? `Health score: ${result.composite_score}/100. Review the program health tab for details.`
            : `Health score: ${result.composite_score}/100. The program is recovering.`

          // Find program slug for the link
          const { data: orgRow } = await db
            .from('organizations')
            .select('slug')
            .eq('id', orgId)
            .single()

          const link = orgRow?.slug
            ? `/org/${orgRow.slug}/programs/${prog.id}?tab=health`
            : null

          const notifications = adminIds.map((recipientId: string) => ({
            organization_id: orgId,
            recipient_id:    recipientId,
            type:            'PROGRAM_STATUS_CHANGED',
            title,
            body,
            link,
            priority:        isNewlyRed ? 'HIGH' : 'MEDIUM',
            read:            false,
          }))

          await db.from('notifications').insert(notifications)

          // Audit log (best-effort)
          db.from('audit_log').insert({
            organization_id: orgId,
            actor_id:        null,
            actor_name:      'System',
            actor_role:      'SYSTEM',
            action:          'health.status_changed',
            entity_type:     'Program',
            entity_id:       prog.id,
            entity_name:     prog.name,
            changes: {
              rag_status: { from: prevRag, to: newRag },
              composite_score: { from: null, to: result.composite_score },
            },
          }).then(() => {}).catch(() => {})
        }
      }
    } catch (err) {
      console.error(`[health] failed to score program ${prog.id}:`, err)
      failed++
    }
  }

  return NextResponse.json({
    scored,
    failed,
    total: programs.length,
    message: `Scored ${scored} programs, ${failed} failed`,
  })
}
