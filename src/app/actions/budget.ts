'use server'

// ── OMANYE Budget & Financial Tracking — Server Actions ───────────────────────

import { createClient } from '@/lib/supabase/server'
import type {
  BudgetCategory,
  Expenditure,
  BudgetAmendment,
  FundingTranche,
  BudgetSummary,
  CategorySpend,
  DonorBudgetView,
  CreateBudgetCategoryPayload,
  UpdateBudgetCategoryPayload,
  SubmitExpenditurePayload,
  CreateBudgetAmendmentPayload,
  CreateFundingTranchePayload,
  UpdateFundingTranchePayload,
} from '@/lib/budget'
import { filterBudget } from '@/lib/donorFilter'

type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

// ── Budget Categories ─────────────────────────────────────────────────────────

export async function createBudgetCategory(
  programId:      string,
  organizationId: string,
  payload:        CreateBudgetCategoryPayload,
): Promise<ActionResult<BudgetCategory>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_categories')
    .insert({
      program_id:       programId,
      organization_id:  organizationId,
      name:             payload.name,
      description:      payload.description ?? null,
      allocated_amount: payload.allocated_amount,
      currency:         payload.currency ?? 'USD',
      color:            payload.color ?? '#4CAF78',
      sort_order:       payload.sort_order ?? 0,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetCategory, error: null }
}

export async function listBudgetCategories(
  programId: string,
): Promise<ActionResult<BudgetCategory[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as BudgetCategory[], error: null }
}

export async function updateBudgetCategory(
  categoryId: string,
  payload:    UpdateBudgetCategoryPayload,
): Promise<ActionResult<BudgetCategory>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_categories')
    .update({
      ...(payload.name             !== undefined && { name:             payload.name }),
      ...(payload.description      !== undefined && { description:      payload.description }),
      ...(payload.allocated_amount !== undefined && { allocated_amount: payload.allocated_amount }),
      ...(payload.currency         !== undefined && { currency:         payload.currency }),
      ...(payload.color            !== undefined && { color:            payload.color }),
      ...(payload.sort_order       !== undefined && { sort_order:       payload.sort_order }),
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetCategory, error: null }
}

export async function deleteBudgetCategory(
  categoryId: string,
): Promise<ActionResult<true>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('budget_categories')
    .delete()
    .eq('id', categoryId)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

// ── Expenditures ──────────────────────────────────────────────────────────────

export async function submitExpenditure(
  programId:      string,
  organizationId: string,
  submittedBy:    string,
  payload:        SubmitExpenditurePayload,
): Promise<ActionResult<Expenditure>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenditures')
    .insert({
      program_id:          programId,
      organization_id:     organizationId,
      submitted_by:        submittedBy,
      budget_category_id:  payload.budget_category_id ?? null,
      description:         payload.description,
      amount:              payload.amount,
      currency:            payload.currency ?? 'USD',
      transaction_date:    payload.transaction_date,
      payment_method:      payload.payment_method ?? null,
      reference_number:    payload.reference_number ?? null,
      receipt_url:         payload.receipt_url ?? null,
      notes:               payload.notes ?? null,
      status:              'PENDING',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Expenditure, error: null }
}

export async function listExpenditures(
  programId: string,
  filters?: {
    status?:             string
    budget_category_id?: string
    from_date?:          string
    to_date?:            string
    search?:             string
  },
): Promise<ActionResult<Expenditure[]>> {
  const supabase = createClient()
  let query = supabase
    .from('expenditures')
    .select(`
      *,
      category:budget_categories(name),
      submitter:profiles!expenditures_submitted_by_fkey(full_name),
      approver:profiles!expenditures_approved_by_fkey(full_name)
    `)
    .eq('program_id', programId)
    .order('transaction_date', { ascending: false })

  if (filters?.status)             query = query.eq('status', filters.status)
  if (filters?.budget_category_id) query = query.eq('budget_category_id', filters.budget_category_id)
  if (filters?.from_date)          query = query.gte('transaction_date', filters.from_date)
  if (filters?.to_date)            query = query.lte('transaction_date', filters.to_date)
  if (filters?.search)             query = query.ilike('description', `%${filters.search}%`)

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    category_name:  (row.category as { name: string } | null)?.name ?? null,
    submitter_name: (row.submitter as { full_name: string } | null)?.full_name ?? null,
    approver_name:  (row.approver as { full_name: string } | null)?.full_name ?? null,
  }))

  return { data: rows as Expenditure[], error: null }
}

export async function getExpenditure(
  expenditureId: string,
): Promise<ActionResult<Expenditure>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenditures')
    .select(`
      *,
      category:budget_categories(name),
      submitter:profiles!expenditures_submitted_by_fkey(full_name),
      approver:profiles!expenditures_approved_by_fkey(full_name)
    `)
    .eq('id', expenditureId)
    .single()

  if (error) return { data: null, error: error.message }

  const row = data as Record<string, unknown>
  return {
    data: {
      ...row,
      category_name:  (row.category as { name: string } | null)?.name ?? null,
      submitter_name: (row.submitter as { full_name: string } | null)?.full_name ?? null,
      approver_name:  (row.approver as { full_name: string } | null)?.full_name ?? null,
    } as Expenditure,
    error: null,
  }
}

export async function approveExpenditure(
  expenditureId: string,
  approvedBy:    string,
): Promise<ActionResult<Expenditure>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenditures')
    .update({
      status:      'APPROVED',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', expenditureId)
    .eq('status', 'PENDING')
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Expenditure, error: null }
}

export async function rejectExpenditure(
  expenditureId: string,
  approvedBy:    string,
  notes?:        string,
): Promise<ActionResult<Expenditure>> {
  const supabase = createClient()
  const updatePayload: Record<string, unknown> = {
    status:      'REJECTED',
    approved_by: approvedBy,
    approved_at: new Date().toISOString(),
  }
  if (notes !== undefined) updatePayload.notes = notes

  const { data, error } = await supabase
    .from('expenditures')
    .update(updatePayload)
    .eq('id', expenditureId)
    .eq('status', 'PENDING')
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Expenditure, error: null }
}

export async function voidExpenditure(
  expenditureId: string,
): Promise<ActionResult<Expenditure>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('expenditures')
    .update({ status: 'VOID' })
    .eq('id', expenditureId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Expenditure, error: null }
}

export async function deleteExpenditure(
  expenditureId: string,
): Promise<ActionResult<true>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('expenditures')
    .delete()
    .eq('id', expenditureId)
    .eq('status', 'PENDING')

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

// ── Budget Amendments ─────────────────────────────────────────────────────────

export async function createBudgetAmendment(
  programId:      string,
  organizationId: string,
  approvedBy:     string,
  payload:        CreateBudgetAmendmentPayload,
): Promise<ActionResult<BudgetAmendment>> {
  const supabase = createClient()

  // Insert the amendment record
  const { data, error } = await supabase
    .from('budget_amendments')
    .insert({
      program_id:       programId,
      organization_id:  organizationId,
      approved_by:      approvedBy,
      from_category_id: payload.from_category_id,
      to_category_id:   payload.to_category_id,
      amount:           payload.amount,
      reason:           payload.reason,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Apply the transfer: reduce from_category, increase to_category
  const [fromResult, toResult] = await Promise.all([
    supabase.rpc('decrement_category_budget', {
      cat_id: payload.from_category_id,
      amt:    payload.amount,
    }),
    supabase.rpc('increment_category_budget', {
      cat_id: payload.to_category_id,
      amt:    payload.amount,
    }),
  ])

  // If RPC not available, fall back to manual update approach
  if (fromResult.error || toResult.error) {
    // Try raw update with arithmetic
    const { data: fromCat } = await supabase
      .from('budget_categories')
      .select('allocated_amount')
      .eq('id', payload.from_category_id)
      .single()
    const { data: toCat } = await supabase
      .from('budget_categories')
      .select('allocated_amount')
      .eq('id', payload.to_category_id)
      .single()

    if (fromCat && toCat) {
      await Promise.all([
        supabase
          .from('budget_categories')
          .update({ allocated_amount: (fromCat as { allocated_amount: number }).allocated_amount - payload.amount })
          .eq('id', payload.from_category_id),
        supabase
          .from('budget_categories')
          .update({ allocated_amount: (toCat as { allocated_amount: number }).allocated_amount + payload.amount })
          .eq('id', payload.to_category_id),
      ])
    }
  }

  return { data: data as BudgetAmendment, error: null }
}

export async function listBudgetAmendments(
  programId: string,
): Promise<ActionResult<BudgetAmendment[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('budget_amendments')
    .select(`
      *,
      from_cat:budget_categories!budget_amendments_from_category_id_fkey(name),
      to_cat:budget_categories!budget_amendments_to_category_id_fkey(name),
      approver:profiles!budget_amendments_approved_by_fkey(full_name)
    `)
    .eq('program_id', programId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    from_category_name: (row.from_cat as { name: string } | null)?.name ?? null,
    to_category_name:   (row.to_cat as { name: string } | null)?.name ?? null,
    approver_name:      (row.approver as { full_name: string } | null)?.full_name ?? null,
  }))

  return { data: rows as BudgetAmendment[], error: null }
}

// ── Funding Tranches ──────────────────────────────────────────────────────────

export async function createFundingTranche(
  programId:      string,
  organizationId: string,
  payload:        CreateFundingTranchePayload,
): Promise<ActionResult<FundingTranche>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_tranches')
    .insert({
      program_id:      programId,
      organization_id: organizationId,
      donor_id:        payload.donor_id ?? null,
      funder_name:     payload.funder_name ?? null,
      tranche_number:  payload.tranche_number,
      expected_amount: payload.expected_amount,
      currency:        payload.currency ?? 'USD',
      expected_date:   payload.expected_date,
      notes:           payload.notes ?? null,
      status:          'EXPECTED',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as FundingTranche, error: null }
}

export async function listFundingTranches(
  programId: string,
): Promise<ActionResult<FundingTranche[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_tranches')
    .select('*')
    .eq('program_id', programId)
    .order('tranche_number', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as FundingTranche[], error: null }
}

export async function updateFundingTranche(
  trancheId: string,
  payload:   UpdateFundingTranchePayload,
): Promise<ActionResult<FundingTranche>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('funding_tranches')
    .update({
      ...(payload.received_amount !== undefined && { received_amount: payload.received_amount }),
      ...(payload.received_date   !== undefined && { received_date:   payload.received_date }),
      ...(payload.status          !== undefined && { status:          payload.status }),
      ...(payload.notes           !== undefined && { notes:           payload.notes }),
      ...(payload.expected_amount !== undefined && { expected_amount: payload.expected_amount }),
      ...(payload.expected_date   !== undefined && { expected_date:   payload.expected_date }),
    })
    .eq('id', trancheId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as FundingTranche, error: null }
}

// ── Computed Views ────────────────────────────────────────────────────────────

export async function getBudgetSummary(
  programId: string,
): Promise<ActionResult<BudgetSummary | null>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_budget_summary')
    .select('*')
    .eq('program_id', programId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as BudgetSummary | null, error: null }
}

export async function getCategorySpend(
  programId: string,
): Promise<ActionResult<CategorySpend[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_category_spend')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as CategorySpend[], error: null }
}

// ── Donor Budget Endpoint ─────────────────────────────────────────────────────
// Verifies the donor's access level, then returns a filtered DonorBudgetView.
// Individual expenditures are NEVER included.

export async function getDonorBudget(
  programId: string,
): Promise<ActionResult<DonorBudgetView | null>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }

  // Verify access level
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level')
    .eq('donor_id', user.id)
    .eq('program_id', programId)
    .eq('active', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .maybeSingle()

  if (!grant) return { data: null, error: 'No access to this program' }

  const accessLevel = grant.access_level as import('@/lib/supabase/database.types').AccessLevel

  if (accessLevel === 'SUMMARY_ONLY' || accessLevel === 'INDICATORS') {
    return { data: null, error: null }
  }

  // Fetch program currency
  const { data: program } = await supabase
    .from('programs')
    .select('total_budget, currency')
    .eq('id', programId)
    .single()

  if (!program) return { data: null, error: 'Program not found' }

  // Fetch aggregated data (not individual expenditures)
  const [summaryResult, categoryResult, trancheResult] = await Promise.all([
    supabase
      .from('v_budget_summary')
      .select('*')
      .eq('program_id', programId)
      .maybeSingle(),
    supabase
      .from('v_category_spend')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('funding_tranches')
      .select('*')
      .eq('program_id', programId)
      .order('tranche_number', { ascending: true }),
  ])

  const budgetView = filterBudget(
    program as { total_budget: number | null; currency: string },
    accessLevel,
    (categoryResult.data ?? []) as import('@/lib/budget').CategorySpend[],
    (summaryResult.data as import('@/lib/budget').BudgetSummary | null) ?? null,
    (trancheResult.data ?? []) as import('@/lib/budget').FundingTranche[],
    user.id,
  )

  return { data: budgetView, error: null }
}
