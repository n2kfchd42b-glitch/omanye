// ── OMANYE Report Generator ───────────────────────────────────────────────────
// Fetches live program data and assembles structured report content.
// Called server-side only (API route handler).

import { createClient } from '@/lib/supabase/server'
import type {
  ReportSection,
  GeneratedReportContent,
  ExecutiveSummaryContent,
  ProgramOverviewContent,
  BudgetSummaryContent,
  FieldSummaryContent,
  AppendixContent,
  IndicatorReportRow,
} from '@/types/reports'

// ── Row shapes (cast targets) ─────────────────────────────────────────────────

interface ProgramRow {
  name: string; objective: string | null; description: string | null
  location_country: string | null; location_region: string | null
  primary_funder: string | null; start_date: string | null
  end_date: string | null; tags: string[] | null; currency: string | null
}

interface IndicatorRow {
  id: string; name: string; category: string | null; unit: string | null
  target_value: number | null; current_value: number | null
}

interface BudgetSummaryRow {
  total_allocated: number | null; total_spent: number | null
  total_remaining: number | null; burn_rate_pct: number | null
}

interface CategorySpendRow {
  name: string; allocated_amount: number | null; spent: number | null
  remaining: number | null; burn_rate_pct: number | null
}

interface DispatchRow {
  title: string; published_at: string | null; body: string | null
}

interface IndicatorUpdateRow {
  new_value: number; recorded_at: string
  indicators: { name: string; unit: string } | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function indicatorStatus(pct: number): 'on_track' | 'at_risk' | 'off_track' {
  if (pct >= 75) return 'on_track'
  if (pct >= 50) return 'at_risk'
  return 'off_track'
}

function periodLabel(start: string | null, end: string | null): string {
  if (!start && !end) return 'All time'
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

// ── Section builders ──────────────────────────────────────────────────────────

async function buildProgramOverview(programId: string): Promise<ProgramOverviewContent | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('programs')
    .select('name, objective, description, location_country, location_region, primary_funder, start_date, end_date, tags')
    .eq('id', programId)
    .single()

  const p = data as ProgramRow | null
  if (!p) return null

  return {
    name:           p.name,
    objective:      p.objective,
    description:    p.description,
    location:       [p.location_region, p.location_country].filter(Boolean).join(', ') || null,
    primary_funder: p.primary_funder,
    start_date:     p.start_date,
    end_date:       p.end_date,
    tags:           p.tags ?? [],
  }
}

async function buildKeyIndicators(programId: string): Promise<IndicatorReportRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('indicators')
    .select('id, name, category, unit, target_value, current_value')
    .eq('program_id', programId)
    .eq('visible_to_donors', true)          // only donor-visible indicators in reports
    .order('sort_order', { ascending: true })

  const rows = (data as IndicatorRow[] | null) ?? []
  return rows.map((ind) => {
    const target  = ind.target_value  ?? 0
    const current = ind.current_value ?? 0
    const pct     = target > 0 ? Math.round((current / target) * 100) : 0
    return {
      id:           ind.id,
      name:         ind.name,
      category:     ind.category ?? '',
      unit:         ind.unit     ?? '',
      target,
      current,
      pct_achieved: pct,
      status:       indicatorStatus(pct),
    }
  })
}

async function buildBudgetSummary(programId: string): Promise<BudgetSummaryContent | null> {
  const supabase = createClient()

  const [summaryRes, catRes, progRes] = await Promise.all([
    supabase.from('v_budget_summary').select('total_allocated, total_spent, total_remaining, burn_rate_pct').eq('program_id', programId).maybeSingle(),
    supabase.from('v_category_spend').select('name, allocated_amount, spent, remaining, burn_rate_pct').eq('program_id', programId).order('sort_order', { ascending: true }),
    supabase.from('programs').select('currency').eq('id', programId).single(),
  ])

  const summary    = summaryRes.data as BudgetSummaryRow | null
  if (!summary) return null

  const categories = (catRes.data as CategorySpendRow[] | null) ?? []
  const currency   = (progRes.data as { currency: string | null } | null)?.currency ?? 'USD'

  return {
    total_allocated: summary.total_allocated ?? 0,
    total_spent:     summary.total_spent     ?? 0,
    total_remaining: summary.total_remaining ?? 0,
    burn_rate_pct:   summary.burn_rate_pct   ?? 0,
    currency,
    categories: categories.map((c) => ({
      name:          c.name,
      allocated:     c.allocated_amount ?? 0,
      spent:         c.spent            ?? 0,
      remaining:     c.remaining        ?? 0,
      burn_rate_pct: c.burn_rate_pct    ?? 0,
    })),
  }
}

async function buildFieldDataSummary(programId: string): Promise<FieldSummaryContent> {
  const supabase = createClient()
  const { data } = await supabase
    .from('program_updates')
    .select('title, published_at, body')
    .eq('program_id', programId)
    .eq('update_type', 'FIELD_DISPATCH')
    .order('published_at', { ascending: false })
    .limit(3)

  const rows = (data as DispatchRow[] | null) ?? []
  return {
    dispatches: rows.map((d) => ({
      title:        d.title,
      date:         d.published_at ?? '',
      body_preview: (d.body ?? '').slice(0, 200),
    })),
  }
}

async function buildAppendix(
  programId:   string,
  periodStart: string | null,
  periodEnd:   string | null,
): Promise<AppendixContent> {
  const supabase = createClient()

  // Resolve which indicators are visible to donors so the appendix history
  // never exposes updates for internally-hidden indicators.
  const { data: visibleInds } = await supabase
    .from('indicators')
    .select('id')
    .eq('program_id', programId)
    .eq('visible_to_donors', true)

  const visibleIds = (visibleInds ?? []).map((i: { id: string }) => i.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let iuQuery: any = supabase
    .from('indicator_updates')
    .select('new_value, recorded_at, indicators(name, unit)')
    .eq('program_id', programId)
    .order('recorded_at', { ascending: false })
    .limit(50)

  // Only include updates for donor-visible indicators
  if (visibleIds.length > 0) {
    iuQuery = iuQuery.in('indicator_id', visibleIds)
  } else {
    // No visible indicators — return empty updates without hitting the DB
    const [catRes] = await Promise.all([
      supabase.from('v_category_spend').select('name, spent, currency').eq('program_id', programId).order('sort_order', { ascending: true }),
    ])
    const catRows = (catRes.data as { name: string; spent: number | null; currency: string | null }[] | null) ?? []
    return {
      indicator_updates: [],
      expenditure_totals: catRows.map((c) => ({
        category_name: c.name,
        total_spent:   c.spent    ?? 0,
        currency:      c.currency ?? 'USD',
      })),
    }
  }

  if (periodStart) iuQuery = iuQuery.gte('recorded_at', periodStart)
  if (periodEnd)   iuQuery = iuQuery.lte('recorded_at', periodEnd + 'T23:59:59Z')

  const [iuRes, catRes] = await Promise.all([
    iuQuery,
    supabase.from('v_category_spend').select('name, spent, currency').eq('program_id', programId).order('sort_order', { ascending: true }),
  ])

  const iuRows  = (iuRes.data  as IndicatorUpdateRow[] | null) ?? []
  const catRows = (catRes.data as { name: string; spent: number | null; currency: string | null }[] | null) ?? []

  return {
    indicator_updates: iuRows.map((u) => ({
      indicator_name: u.indicators?.name ?? 'Unknown',
      new_value:      u.new_value,
      unit:           u.indicators?.unit ?? '',
      recorded_at:    u.recorded_at,
    })),
    expenditure_totals: catRows.map((c) => ({
      category_name: c.name,
      total_spent:   c.spent    ?? 0,
      currency:      c.currency ?? 'USD',
    })),
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateReportContent(
  programId:   string,
  sections:    ReportSection[],
  periodStart: string | null,
  periodEnd:   string | null,
  challenges:  string | null,
): Promise<GeneratedReportContent> {
  const content: GeneratedReportContent = {}

  const needsOverview   = sections.includes('PROGRAM_OVERVIEW')   || sections.includes('EXECUTIVE_SUMMARY')
  const needsIndicators = sections.includes('KEY_INDICATORS')     || sections.includes('EXECUTIVE_SUMMARY')
  const needsBudget     = sections.includes('BUDGET_SUMMARY')     || sections.includes('EXECUTIVE_SUMMARY')

  const [programOverview, keyIndicators, budgetSummary] = await Promise.all([
    needsOverview   ? buildProgramOverview(programId) : Promise.resolve(null),
    needsIndicators ? buildKeyIndicators(programId)   : Promise.resolve([]),
    needsBudget     ? buildBudgetSummary(programId)   : Promise.resolve(null),
  ])

  // EXECUTIVE_SUMMARY
  if (sections.includes('EXECUTIVE_SUMMARY') && programOverview) {
    const total = keyIndicators.length
    const overallAchievement = total > 0
      ? Math.round(keyIndicators.reduce((s, i) => s + i.pct_achieved, 0) / total)
      : 0

    const highlights: string[] = []
    if (overallAchievement >= 75)      highlights.push(`Strong overall indicator achievement at ${overallAchievement}%`)
    else if (overallAchievement >= 50) highlights.push(`Moderate progress — overall achievement at ${overallAchievement}%`)
    else                               highlights.push(`Program requires attention — overall achievement at ${overallAchievement}%`)

    const offTrack = keyIndicators.filter(i => i.status === 'off_track')
    if (offTrack.length > 0)
      highlights.push(`${offTrack.length} indicator${offTrack.length > 1 ? 's' : ''} below 50% of target`)

    if (budgetSummary) highlights.push(`Budget utilisation at ${budgetSummary.burn_rate_pct}%`)

    content.executiveSummary = {
      program_name:            programOverview.name,
      objective:               programOverview.objective,
      funder:                  programOverview.primary_funder,
      period:                  periodLabel(periodStart, periodEnd),
      overall_achievement_pct: overallAchievement,
      burn_rate_pct:           budgetSummary?.burn_rate_pct ?? null,
      key_highlights:          highlights,
    }
  }

  if (sections.includes('PROGRAM_OVERVIEW') && programOverview) content.programOverview  = programOverview
  if (sections.includes('KEY_INDICATORS'))                       content.keyIndicators   = keyIndicators
  if (sections.includes('BUDGET_SUMMARY')     && budgetSummary)  content.budgetSummary   = budgetSummary
  if (sections.includes('FIELD_DATA_SUMMARY'))                   content.fieldDataSummary = await buildFieldDataSummary(programId)
  if (sections.includes('CHALLENGES'))                           content.challenges       = challenges ?? ''
  if (sections.includes('APPENDIX'))                             content.appendix         = await buildAppendix(programId, periodStart, periodEnd)

  return content
}
