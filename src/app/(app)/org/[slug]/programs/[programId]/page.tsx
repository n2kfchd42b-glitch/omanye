import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProgramDetailClient from './ProgramDetailClient'
import type { Program, Indicator, ProgramUpdate } from '@/lib/programs'
import type { BudgetCategory, Expenditure, BudgetAmendment, FundingTranche, BudgetSummary, CategorySpend } from '@/lib/budget'
import { ArrowLeft, MapPin, Calendar, Users, Tag, TrendingUp, ArrowRight } from 'lucide-react'

interface Props {
  params: { slug: string; programId: string }
}

// ── Public program view (no auth) ─────────────────────────────────────────────

async function PublicProgramView({
  program,
  orgSlug,
  orgName,
}: {
  program: Program
  orgSlug: string
  orgName: string
}) {
  const supabase = createClient()

  const [indicatorsResult, updatesResult] = await Promise.all([
    supabase
      .from('indicators')
      .select('id, name, current_value, target_value, unit, description')
      .eq('program_id', program.id)
      .eq('is_key_indicator', true)
      .eq('visible_to_donors', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('program_updates')
      .select('id, title, body, update_type, published_at, visible_to_donors')
      .eq('program_id', program.id)
      .eq('visible_to_donors', true)
      .neq('update_type', 'DONOR_REPORT')
      .order('published_at', { ascending: false })
      .limit(5),
  ])

  const keyIndicators = indicatorsResult.data ?? []
  const publicUpdates = updatesResult.data ?? []

  const serif = 'var(--font-fraunces),Georgia,serif'
  const sans  = 'var(--font-instrument),system-ui,sans-serif'

  return (
    <>
      {/* Cover hero */}
      <div
        className="pt-16 min-h-64 flex items-end relative overflow-hidden"
        style={{
          background: program.cover_image_url
            ? `linear-gradient(to bottom, rgba(15,27,51,0.4), rgba(15,27,51,0.85)), url(${program.cover_image_url}) center/cover`
            : 'linear-gradient(135deg, #0F1B33 0%, #1a2e4a 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
          <Link
            href={`/org/${orgSlug}`}
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.6)', fontFamily: sans }}
          >
            <ArrowLeft size={14} /> Back to {orgName}
          </Link>
          <div
            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold mb-4"
            style={{
              background: program.status === 'ACTIVE' ? 'rgba(76,175,120,0.2)' : 'rgba(212,175,92,0.2)',
              color: program.status === 'ACTIVE' ? '#7DD4A0' : '#D4AF5C',
              fontFamily: sans,
            }}
          >
            {program.status}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3" style={{ fontFamily: serif }}>
            {program.name}
          </h1>
          {program.objective && (
            <p className="text-base max-w-2xl" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: sans }}>
              {program.objective}
            </p>
          )}
        </div>
      </div>

      {/* Meta bar */}
      <div className="py-4" style={{ background: 'white', borderBottom: '1px solid rgba(15,27,51,0.07)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-5">
          {[
            program.location_country && { Icon: MapPin, text: [program.location_region, program.location_country].filter(Boolean).join(', ') },
            program.primary_funder && { Icon: Users, text: `Funded by ${program.primary_funder}` },
            program.start_date && { Icon: Calendar, text: `Started ${new Date(program.start_date).getFullYear()}` },
          ].filter(Boolean).map((item, i) => item && (
            <span key={i} className="flex items-center gap-1.5 text-sm" style={{ color: 'rgba(15,27,51,0.55)', fontFamily: sans }}>
              <item.Icon size={13} /> {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="py-16" style={{ background: '#F8F8F6' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 flex flex-col gap-10">
              {program.description && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#0F1B33', fontFamily: serif }}>About this program</h2>
                  <p className="text-base leading-relaxed" style={{ color: 'rgba(15,27,51,0.7)', fontFamily: sans }}>{program.description}</p>
                </div>
              )}
              {(program as any).tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <Tag size={13} style={{ color: 'rgba(15,27,51,0.35)' }} />
                  {(program as any).tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-xs" style={{ background: 'rgba(15,27,51,0.07)', color: 'rgba(15,27,51,0.6)', fontFamily: sans }}>{tag}</span>
                  ))}
                </div>
              )}
              {publicUpdates.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-5" style={{ color: '#0F1B33', fontFamily: serif }}>Latest updates</h2>
                  <div className="flex flex-col gap-4">
                    {publicUpdates.map((u) => (
                      <div key={u.id} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(15,27,51,0.07)' }}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-base" style={{ color: '#0F1B33', fontFamily: serif }}>{u.title}</h3>
                          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(15,27,51,0.4)', fontFamily: sans }}>
                            {u.published_at ? new Date(u.published_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        {u.body && <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'rgba(15,27,51,0.65)', fontFamily: sans }}>{u.body}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — indicators + donor CTA */}
            <div className="flex flex-col gap-6">
              {keyIndicators.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(15,27,51,0.08)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={16} style={{ color: '#D4AF5C' }} />
                    <h3 className="font-semibold text-sm" style={{ color: '#0F1B33', fontFamily: serif }}>Key Indicators</h3>
                  </div>
                  <div className="flex flex-col gap-5">
                    {keyIndicators.map((ind) => {
                      const pct = Math.min(Math.round(((ind.current_value ?? 0) / (ind.target_value || 1)) * 100), 100)
                      return (
                        <div key={ind.id}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium truncate max-w-[65%]" style={{ color: '#0F1B33', fontFamily: sans }}>{ind.name}</span>
                            <span style={{ color: 'rgba(15,27,51,0.5)', fontFamily: sans }}>
                              {(ind.current_value ?? 0).toLocaleString()}/{(ind.target_value ?? 0).toLocaleString()}{ind.unit ? ` ${ind.unit}` : ''}
                            </span>
                          </div>
                          <div className="h-2 rounded-full mb-1" style={{ background: 'rgba(15,27,51,0.07)' }}>
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: pct >= 80 ? '#D4AF5C' : pct >= 50 ? '#D97706' : '#C0392B' }} />
                          </div>
                          <p className="text-xs" style={{ color: 'rgba(15,27,51,0.4)', fontFamily: sans }}>{pct}% of target</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl p-5" style={{ background: '#0F1B33' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#D4AF5C', fontFamily: sans }}>For Donors</p>
                <p className="text-sm mb-1 font-medium" style={{ color: 'white', fontFamily: serif }}>Funding this program?</p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: sans }}>
                  Request access to detailed reports and real-time data from {orgName}.
                </p>
                <Link
                  href="/signup/donor"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: '#D4AF5C', color: '#0F1B33', fontFamily: sans }}
                >
                  Connect as Donor <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main page — handles both public + authenticated NGO views ─────────────────

export default async function ProgramDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Unauthenticated: show public view if program.visibility = PUBLIC ──────
  if (!user) {
    // Resolve org by slug to validate
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', params.slug)
      .single()

    if (!org) redirect(`/org/${params.slug}`)

    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('id', params.programId)
      .eq('organization_id', org.id)
      .is('deleted_at', null)
      .single()

    if (!program || program.visibility !== 'PUBLIC') {
      redirect(`/org/${params.slug}`)
    }

    return (
      <>
        {/* Minimal nav header since no auth layout wraps this (app) route */}
        <div style={{ background: '#0F1B33', borderBottom: '1px solid rgba(212,175,92,0.1)' }}>
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href={`/org/${params.slug}`} className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}>
              ← {org.name}
            </Link>
            <Link href="/login" className="text-sm font-medium" style={{ color: '#D4AF5C', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}>
              Sign In
            </Link>
          </div>
        </div>
        <PublicProgramView program={program as unknown as Program} orgSlug={params.slug} orgName={org.name} />
      </>
    )
  }

  // ── Authenticated: validate NGO role ────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile || !['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) {
    redirect('/login')
  }
  if (!profile.organization_id) redirect('/onboarding')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, slug, name')
    .eq('id', profile.organization_id)
    .single()

  if (!org || org.slug !== params.slug) {
    redirect(org ? `/org/${org.slug}/programs` : '/login')
  }

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', params.programId)
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .single()

  if (!program) redirect(`/org/${params.slug}/programs`)

  const [
    indicatorsResult,
    updatesResult,
    categoriesResult,
    expendituresResult,
    summaryResult,
    categorySpendResult,
    tranchesResult,
    amendmentsResult,
  ] = await Promise.all([
    supabase.from('indicators').select('*').eq('program_id', params.programId).order('sort_order', { ascending: true }),
    supabase.from('program_updates').select('*').eq('program_id', params.programId).order('published_at', { ascending: false }),
    supabase.from('budget_categories').select('*').eq('program_id', params.programId).order('sort_order', { ascending: true }),
    supabase.from('expenditures').select('*').eq('program_id', params.programId).order('transaction_date', { ascending: false }),
    supabase.from('v_budget_summary').select('*').eq('program_id', params.programId).maybeSingle(),
    supabase.from('v_category_spend').select('*').eq('program_id', params.programId).order('sort_order', { ascending: true }),
    supabase.from('funding_tranches').select('*').eq('program_id', params.programId).order('tranche_number', { ascending: true }),
    supabase.from('budget_amendments').select('*').eq('program_id', params.programId).order('created_at', { ascending: false }),
  ])

  return (
    <ProgramDetailClient
      program={program as Program}
      indicators={(indicatorsResult.data ?? []) as Indicator[]}
      updates={(updatesResult.data ?? []) as ProgramUpdate[]}
      userRole={profile.role}
      orgSlug={params.slug}
      currentUserId={user.id}
      initialCategories={(categoriesResult.data ?? []) as BudgetCategory[]}
      initialExpenditures={(expendituresResult.data ?? []) as Expenditure[]}
      initialSummary={(summaryResult.data as BudgetSummary | null) ?? null}
      initialCategorySpend={(categorySpendResult.data ?? []) as CategorySpend[]}
      initialTranches={(tranchesResult.data ?? []) as FundingTranche[]}
      initialAmendments={(amendmentsResult.data ?? []) as BudgetAmendment[]}
    />
  )
}
