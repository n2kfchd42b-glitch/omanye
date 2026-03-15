import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DonorProgramDetailClient from './DonorProgramDetailClient'
import { filterProgram, canSeeIndicators, canSeeBudget, filterBudget } from '@/lib/donorFilter'
import type { Program, Indicator, ProgramUpdate, DonorProgramView } from '@/lib/programs'
import type { BudgetSummary, CategorySpend, FundingTranche, DonorBudgetView } from '@/lib/budget'

interface Props {
  params: { programId: string }
}

export default async function DonorProgramDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'DONOR') redirect('/login')

  // Verify access grant
  const { data: grant } = await supabase
    .from('donor_program_access')
    .select('access_level, can_download_reports, expires_at')
    .eq('donor_id', user.id)
    .eq('program_id', params.programId)
    .eq('active', true)
    .single()

  if (!grant) redirect('/donor/programs')

  // Check not expired
  if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
    redirect('/donor/programs')
  }

  // Fetch program (RLS also enforces PRIVATE filter)
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.programId)
    .is('deleted_at', null)
    .neq('visibility', 'PRIVATE')
    .single()

  if (!program) redirect('/donor/programs')

  // Fetch org info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url')
    .eq('id', program.organization_id)
    .single()

  // Fetch donor-visible indicators
  const { data: allIndicators } = await supabase
    .from('indicators')
    .select('*')
    .eq('program_id', params.programId)
    .eq('visible_to_donors', true)
    .order('sort_order', { ascending: true })

  // Fetch donor-visible program updates
  const { data: updates } = await supabase
    .from('program_updates')
    .select('*')
    .eq('program_id', params.programId)
    .eq('visible_to_donors', true)
    .order('published_at', { ascending: false })

  // Server-side filter the program based on access level
  const programView = filterProgram(
    program as Program,
    grant.access_level,
    (allIndicators ?? []) as Indicator[],
  )

  // Check pending access request
  const { data: pendingRequest } = await supabase
    .from('donor_access_requests')
    .select('requested_access_level, status, created_at')
    .eq('donor_id', user.id)
    .eq('program_id', params.programId)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch budget data if donor has budget-level access
  let donorBudgetView: DonorBudgetView | null = null
  if (canSeeBudget(grant.access_level)) {
    const [summaryResult, categoryResult, trancheResult] = await Promise.all([
      supabase.from('v_budget_summary').select('*').eq('program_id', params.programId).maybeSingle(),
      supabase.from('v_category_spend').select('*').eq('program_id', params.programId).order('sort_order', { ascending: true }),
      supabase.from('funding_tranches').select('*').eq('program_id', params.programId).order('tranche_number', { ascending: true }),
    ])

    donorBudgetView = filterBudget(
      program as Program,
      grant.access_level,
      (categoryResult.data ?? []) as CategorySpend[],
      (summaryResult.data as BudgetSummary | null) ?? null,
      (trancheResult.data ?? []) as FundingTranche[],
      user.id,
    )
  }

  return (
    <DonorProgramDetailClient
      program={programView}
      rawProgram={{
        start_date: (program as Program).start_date,
        end_date:   (program as Program).end_date,
        logframe_url: (program as Program).logframe_url,
      }}
      updates={(updates ?? []) as ProgramUpdate[]}
      org={org ?? null}
      accessLevel={grant.access_level}
      canDownload={grant.can_download_reports}
      expiresAt={grant.expires_at}
      pendingRequest={pendingRequest ?? null}
      organizationId={program.organization_id}
      donorBudget={donorBudgetView}
    />
  )
}
