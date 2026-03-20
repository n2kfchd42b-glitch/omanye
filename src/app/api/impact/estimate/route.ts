// POST /api/impact/estimate — run a deterministic impact calculation and save result
// GET  /api/impact/estimate?limit=5 — list recent estimates for the authenticated org

import { NextRequest, NextResponse } from 'next/server'
import { createClient }    from '@/lib/supabase/server'
import { calculateImpact } from '@/lib/impact/calculator'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'

// ── GET — list recent estimates ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get('limit') ?? '5', 10) || 5,
    20
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('impact_estimates')
    .select('id, program_type, geography_region, total_budget, currency, duration_months, target_beneficiary_count, notes, results, confidence_level, created_at')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return internalError(error.message)

  return NextResponse.json({ data: data ?? [] })
}

// ── POST — calculate and save estimate ───────────────────────────────────────

interface EstimateBody {
  organization_id?:         string
  program_type?:            string
  geography_region?:        string
  total_budget?:            number
  currency?:                string
  duration_months?:         number
  target_beneficiary_count?: number
  program_id?:              string
  notes?:                   string
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  let body: EstimateBody
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const {
    program_type,
    geography_region,
    total_budget,
    currency         = 'USD',
    duration_months,
    target_beneficiary_count,
    program_id,
    notes,
  } = body

  // Validate required fields
  if (!program_type?.trim())     return internalError('program_type is required')
  if (!geography_region?.trim()) return internalError('geography_region is required')
  if (!total_budget || total_budget <= 0) return internalError('total_budget must be > 0')
  if (!duration_months || duration_months <= 0) return internalError('duration_months must be > 0')

  // Run deterministic calculation
  let result
  try {
    result = calculateImpact({
      program_type,
      geography_region,
      total_budget:            Number(total_budget),
      duration_months:         Number(duration_months),
      target_beneficiary_count: target_beneficiary_count ? Number(target_beneficiary_count) : undefined,
    })
  } catch (err) {
    return internalError(err instanceof Error ? err.message : 'Calculation error')
  }

  // Save to impact_estimates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const insertRow: Record<string, unknown> = {
    organization_id:          profile.organization_id,
    program_type,
    geography_region,
    total_budget:             Number(total_budget),
    currency,
    duration_months:          Number(duration_months),
    target_beneficiary_count: target_beneficiary_count ? Number(target_beneficiary_count) : null,
    notes:                    notes || null,
    results:                  result,
    benchmark_used:           result.benchmark_used,
    confidence_level:         result.confidence_level,
    created_by:               user.id,
  }
  if (program_id) insertRow.program_id = program_id

  const { data: saved, error: saveErr } = await db
    .from('impact_estimates')
    .insert(insertRow)
    .select('id, program_type, geography_region, total_budget, currency, duration_months, target_beneficiary_count, notes, results, confidence_level, created_at')
    .single()

  if (saveErr) return internalError(saveErr.message)

  // Audit log (best-effort)
  logActionForUser(user.id, {
    action:     'impact.estimate_created',
    entityType: 'ImpactEstimate',
    entityId:   saved.id,
    entityName: `${program_type} · ${geography_region}`,
    metadata: {
      total_budget,
      currency,
      duration_months,
      confidence_level: result.confidence_level,
    },
  }).catch((e: unknown) => console.error('[audit] impact estimate log failed:', e))

  return NextResponse.json({ result, estimate: saved }, { status: 201 })
}
