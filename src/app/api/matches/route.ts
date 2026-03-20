// GET /api/matches
// Returns all active funder opportunities ranked by match score for the
// authenticated organization.
//
// Also accepts server-to-server calls from the funder digest edge function:
//   Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//   ?org_id=<uuid>
//
// Query params:
//   min_score   — filter results below this threshold (default: 0)
//   limit       — max results to return (default: 20, max: 100)
//   org_id      — only used when authenticated with service role bearer token

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRankedMatches, getMatchExplanation } from '@/lib/funder-match'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  const params    = req.nextUrl.searchParams
  const minScore  = parseInt(params.get('min_score') ?? '0', 10) || 0
  const limit     = Math.min(parseInt(params.get('limit') ?? '20', 10) || 20, 100)
  const orgIdParam = params.get('org_id')

  // ── Auth: cookie session or service-role bearer ────────────────────────────
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const authHeader = req.headers.get('authorization') ?? ''
  const isServiceCall = serviceKey && authHeader === `Bearer ${serviceKey}` && !!orgIdParam

  const supabase = createClient()
  let orgId: string

  if (isServiceCall) {
    // Server-to-server call (funder digest)
    orgId = orgIdParam!
  } else {
    // Browser request — require cookie auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return unauthorized()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) return unauthorized()
    if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) return forbidden()
    orgId = profile.organization_id
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch org profile tags
  const { data: orgData, error: orgErr } = await db
    .from('organizations')
    .select('focus_areas, eligible_geographies, program_types, annual_budget_range')
    .eq('id', orgId)
    .single()

  if (orgErr) return internalError(orgErr.message)

  const ngoProfile = {
    focus_areas:          (orgData?.focus_areas          ?? []) as string[],
    eligible_geographies: (orgData?.eligible_geographies ?? []) as string[],
    program_types:        (orgData?.program_types        ?? []) as string[],
    annual_budget_range:  (orgData?.annual_budget_range  ?? null) as string | null,
  }

  // Fetch all active funder opportunities
  const { data: opps, error: oppsErr } = await db
    .from('funder_opportunities')
    .select('*')
    .eq('status', 'active')

  if (oppsErr) return internalError(oppsErr.message)

  // Run matching server-side
  const ranked = getRankedMatches(ngoProfile, opps ?? [])
    .filter(({ score }) => score >= minScore)
    .slice(0, limit)
    .map(({ opp, score }) => ({
      ...opp,
      match_score:       score,
      match_explanation: getMatchExplanation(ngoProfile, opp),
    }))

  return NextResponse.json({ data: ranked, total: ranked.length })
}
