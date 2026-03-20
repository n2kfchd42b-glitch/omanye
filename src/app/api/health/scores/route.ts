// GET /api/health/scores
// Two modes, selected by query param:
//
//   ?program_id=<uuid>   — score history for a single program
//   (no program_id)      — org summary: latest score per program + 8-week trend
//
// Additional params:
//   ?limit=N             — max rows for history mode (default 20, max 90)
//   ?org_id=<uuid>       — service-role override (bypasses cookie auth for edge functions)
//
// Auth: any org member (NGO_ADMIN | NGO_STAFF | NGO_VIEWER) via cookie,
//       OR service-role Bearer token with ?org_id param.
//
// RLS on program_health_scores allows SELECT for any profile in the org.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'

// ── Auth helper (mirrors recalculate route, but allows all org roles) ──────────

async function resolveAuth(req: NextRequest): Promise<
  | { ok: true; orgId: string }
  | { ok: false; response: Response }
> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const auth       = req.headers.get('authorization') ?? ''
  const orgIdParam = req.nextUrl.searchParams.get('org_id')

  if (serviceKey && auth === `Bearer ${serviceKey}` && orgIdParam) {
    return { ok: true, orgId: orgIdParam }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: unauthorized() }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { ok: false, response: forbidden() }

  return { ok: true, orgId: profile.organization_id }
}

// ── ISO week string (e.g. "2026-W10") ─────────────────────────────────────────

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = utc.getUTCDay() || 7         // Mon=1 … Sun=7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)  // shift to Thursday
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await resolveAuth(req)
  if (!auth.ok) return auth.response

  const { orgId } = auth
  const sp        = req.nextUrl.searchParams
  const programId = sp.get('program_id')
  const limit     = Math.max(1, Math.min(parseInt(sp.get('limit') ?? '20') || 20, 90))

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // ── Mode 1: program history ──────────────────────────────────────────────────
  if (programId) {
    // Sanitise to prevent injection through crafted UUIDs
    const safeId = programId.replace(/[^a-f0-9-]/gi, '')

    const { data, error } = await db
      .from('program_health_scores')
      .select('id, composite_score, budget_score, indicator_score, field_activity_score, rag_status, score_factors, calculated_at')
      .eq('program_id',      safeId)
      .eq('organization_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(limit)

    if (error) return internalError(error.message)

    return NextResponse.json({ data: data ?? [] })
  }

  // ── Mode 2: org summary ──────────────────────────────────────────────────────

  // Fetch all scores for the org (capped at 2000 to bound memory)
  const { data: allRows, error: allErr } = await db
    .from('program_health_scores')
    .select('program_id, composite_score, budget_score, indicator_score, field_activity_score, rag_status, calculated_at')
    .eq('organization_id', orgId)
    .order('calculated_at', { ascending: false })
    .limit(2000)

  if (allErr) return internalError(allErr.message)

  type ScoreRow = {
    program_id:           string
    composite_score:      number
    budget_score:         number
    indicator_score:      number
    field_activity_score: number
    rag_status:           string
    calculated_at:        string
  }

  const rows: ScoreRow[] = allRows ?? []

  // ── Latest score per program ────────────────────────────────────────────────
  const seenPrograms = new Set<string>()
  const latestPerProgram: ScoreRow[] = []
  for (const row of rows) {
    if (!seenPrograms.has(row.program_id)) {
      seenPrograms.add(row.program_id)
      latestPerProgram.push(row)
    }
  }

  // Enrich with program names (best-effort)
  const programIds = latestPerProgram.map(r => r.program_id)
  let nameMap: Record<string, string> = {}
  if (programIds.length > 0) {
    const { data: progs } = await db
      .from('programs')
      .select('id, name')
      .in('id', programIds)
    for (const p of (progs ?? []) as Array<{ id: string; name: string }>) {
      nameMap[p.id] = p.name
    }
  }

  const summary = latestPerProgram.map(r => ({
    program_id:           r.program_id,
    program_name:         nameMap[r.program_id] ?? null,
    composite_score:      r.composite_score,
    budget_score:         r.budget_score,
    indicator_score:      r.indicator_score,
    field_activity_score: r.field_activity_score,
    rag_status:           r.rag_status,
    calculated_at:        r.calculated_at,
  }))

  // ── Weekly trend — last 8 ISO weeks ────────────────────────────────────────
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 86_400_000).toISOString()
  const recentRows    = rows.filter(r => r.calculated_at >= eightWeeksAgo)

  // Group by ISO week and average composite_score
  const weekBuckets: Record<string, { sum: number; count: number }> = {}
  for (const row of recentRows) {
    const week = isoWeek(row.calculated_at)
    if (!weekBuckets[week]) weekBuckets[week] = { sum: 0, count: 0 }
    weekBuckets[week].sum   += row.composite_score
    weekBuckets[week].count += 1
  }

  const weekly_trend = Object.entries(weekBuckets)
    .map(([week, { sum, count }]) => ({
      week,
      avg_score:    Math.round((sum / count) * 10) / 10,
      sample_count: count,
    }))
    .sort((a, b) => a.week.localeCompare(b.week))

  return NextResponse.json({ data: summary, weekly_trend })
}
