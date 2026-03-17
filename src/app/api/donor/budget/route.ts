// GET /api/donor/budget?program_id= — donor-safe budget view
// Returns ONLY category-level aggregates. NEVER returns individual expenditure rows.
// Access requires INDICATORS_AND_BUDGET or FULL access level.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'
import { canSeeBudget, filterBudget } from '@/lib/donorFilter'
import type { Program } from '@/lib/programs'
import type { BudgetSummary, CategorySpend, FundingTranche } from '@/lib/budget'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') return forbidden()

  const programId = req.nextUrl.searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  // Verify active access grant
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level, expires_at')
    .eq('donor_id', user.id)
    .eq('program_id', programId)
    .eq('active', true)
    .single()

  if (!grant) return notFound()
  if (grant.expires_at && new Date(grant.expires_at) < new Date()) return notFound()

  // Require budget-level access — Rule 1: never expose expenditures to donors
  if (!canSeeBudget(grant.access_level)) {
    return forbidden()
  }

  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .neq('visibility', 'PRIVATE')
    .single()

  if (progError || !program) return notFound()

  const [summaryResult, categoryResult, trancheResult] = await Promise.all([
    supabase.from('v_budget_summary').select('*').eq('program_id', programId).maybeSingle(),
    supabase.from('v_category_spend').select('*').eq('program_id', programId).order('sort_order', { ascending: true }),
    supabase.from('funding_tranches').select('*').eq('program_id', programId).order('tranche_number', { ascending: true }),
  ])

  if (categoryResult.error) return internalError(categoryResult.error.message)

  // filterBudget enforces access levels and strips detailed expenditure data
  const donorView = filterBudget(
    program as Program,
    grant.access_level,
    (categoryResult.data ?? []) as CategorySpend[],
    (summaryResult.data as BudgetSummary | null) ?? null,
    (trancheResult.data ?? []) as FundingTranche[],
    user.id,
  )

  return NextResponse.json({ data: donorView })
}
