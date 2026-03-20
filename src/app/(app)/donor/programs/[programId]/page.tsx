import { redirect } from 'next/navigation'
import { requireDonorAuth } from '@/lib/auth/server'
import DonorProgramDetailClient from './DonorProgramDetailClient'
import { filterProgram, canSeeBudget, filterBudget } from '@/lib/donorFilter'
import type { Program, Indicator, ProgramUpdate } from '@/lib/programs'
import type { BudgetSummary, CategorySpend, FundingTranche, DonorBudgetView } from '@/lib/budget'

interface Props {
  params: { programId: string }
}

export default async function DonorProgramDetailPage({ params }: Props) {
  const { supabase, user } = await requireDonorAuth()

  // Check donor has access to this program
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level, can_download_reports, expires_at, organization_id')
    .eq('donor_id', user.id)
    .eq('program_id', params.programId)
    .eq('active', true)
    .maybeSingle()

  if (!grant) redirect('/donor/programs')

  const accessLevel = grant.access_level as import('@/lib/supabase/database.types').AccessLevel

  // Fetch program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.programId)
    .is('deleted_at', null)
    .single()

  if (!program) redirect('/donor/programs')

  // Fetch org info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('id', program.organization_id)
    .single()

  // Fetch all indicators and updates — filter to donor-visible rows at the
  // query level (RLS enforces the same rule, this is defense-in-depth).
  const { data: allIndicators } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', params.programId)
    .eq('visible_to_donors', true)
    .order('sort_order', { ascending: true })

  const { data: updates } = await supabase
    .from('program_updates')
    .select('*')
    .eq('program_id', params.programId)
    .eq('visible_to_donors', true)
    .order('published_at', { ascending: false })

  const programView = filterProgram(
    program as Program,
    accessLevel,
    (allIndicators ?? []) as Indicator[],
  )

  // Fetch budget data
  let donorBudgetView: DonorBudgetView | null = null
  if (canSeeBudget(accessLevel)) {
    const [summaryResult, categoryResult, trancheResult] = await Promise.all([
      supabase.from('v_budget_summary').select('*').eq('program_id', params.programId).maybeSingle(),
      supabase.from('v_category_spend').select('*').eq('program_id', params.programId).order('sort_order', { ascending: true }),
      supabase.from('funding_tranches').select('*').eq('program_id', params.programId).order('tranche_number', { ascending: true }),
    ])

    donorBudgetView = filterBudget(
      program as Program,
      accessLevel,
      (categoryResult.data ?? []) as CategorySpend[],
      (summaryResult.data as BudgetSummary | null) ?? null,
      (trancheResult.data ?? []) as FundingTranche[],
      user.id,
    )
  }

  // Check for pending access request
  const { data: pendingReq } = await supabase
    .from('donor_access_requests')
    .select('requested_access_level, status, created_at')
    .eq('donor_id', user.id)
    .eq('program_id', params.programId)
    .eq('status', 'PENDING')
    .maybeSingle()

  return (
    <DonorProgramDetailClient
      program={programView}
      rawProgram={{
        start_date:   (program as Program).start_date,
        end_date:     (program as Program).end_date,
        logframe_url: (program as Program).logframe_url,
      }}
      updates={(updates ?? []) as ProgramUpdate[]}
      org={org ?? null}
      accessLevel={accessLevel}
      canDownload={grant.can_download_reports}
      expiresAt={grant.expires_at}
      pendingRequest={pendingReq as { requested_access_level: import('@/lib/supabase/database.types').AccessLevel; status: string; created_at: string } | null}
      organizationId={program.organization_id}
      donorBudget={donorBudgetView}
    />
  )
}
