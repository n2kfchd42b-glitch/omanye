// ── OMANYE — Funder Digest Edge Function ──────────────────────────────────────
// Sends a weekly plain-text email digest to NGO team members showing their
// top 5 matched funder opportunities.
//
// Schedule: every Monday at 08:00 UTC
//   supabase cron: "0 8 * * 1"
//
// Environment variables required:
//   SUPABASE_URL        — your project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
//   RESEND_API_KEY      — Resend API key
//   SITE_URL            — e.g. https://app.omanye.com
//   FROM_EMAIL          — e.g. noreply@omanye.com

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')              ?? ''
const SERVICE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')            ?? ''
const SITE_URL         = Deno.env.get('SITE_URL')                  ?? 'https://app.omanye.com'
const FROM_EMAIL       = Deno.env.get('FROM_EMAIL')                ?? 'noreply@omanye.com'

// ── Match score (inline copy for Deno — cannot import from src/) ──────────────

interface NgoProfile {
  focus_areas:          string[]
  eligible_geographies: string[]
  program_types:        string[]
  annual_budget_range:  string | null
}

interface FunderOpp {
  id:                   string
  funder_name:          string
  opportunity_title:    string
  funding_range_min:    number | null
  funding_range_max:    number | null
  application_deadline: string | null
  external_link:        string | null
  focus_areas:          string[]
  eligible_geographies: string[]
  eligible_org_types:   string[]
}

const BUDGET_MIDPOINTS: Record<string, number> = {
  under_100k: 50_000,
  '100k_500k': 300_000,
  '500k_1m':   750_000,
  '1m_5m':   3_000_000,
  above_5m: 10_000_000,
}

function matchScore(ngo: NgoProfile, opp: FunderOpp): number {
  const focusDenom  = opp.focus_areas.length || 1
  const focusHits   = ngo.focus_areas.filter(x => opp.focus_areas.includes(x)).length
  const geoDenom    = opp.eligible_geographies.length || 1
  const geoHits     = ngo.eligible_geographies.filter(x => opp.eligible_geographies.includes(x)).length
  let budget = 0
  if (ngo.annual_budget_range && BUDGET_MIDPOINTS[ngo.annual_budget_range] !== undefined) {
    const mid = BUDGET_MIDPOINTS[ngo.annual_budget_range]
    const min = opp.funding_range_min ?? 0
    const max = opp.funding_range_max ?? Infinity
    if (mid >= min && mid <= max) budget = 20
  }
  return Math.round((focusHits / focusDenom) * 40 + (geoHits / geoDenom) * 40 + budget)
}

// ── Formatting ────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null): string {
  if (n === null) return '?'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Unspecified'
  if (min === null) return `Up to ${fmtCurrency(max)}`
  if (max === null) return `From ${fmtCurrency(min)}`
  return `${fmtCurrency(min)} – ${fmtCurrency(max)}`
}

function fmtDate(d: string | null): string {
  if (!d) return 'Rolling'
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Email body ────────────────────────────────────────────────────────────────

function buildEmailText(opts: {
  orgName:       string
  recipientName: string | null
  opps:          FunderOpp[]
  scores:        number[]
  orgSlug:       string
}): string {
  const lines: string[] = []
  const greeting = opts.recipientName ? `Hi ${opts.recipientName},` : 'Hello,'

  lines.push(`${greeting}`)
  lines.push('')
  lines.push(`Here are the top ${opts.opps.length} funding opportunities matched to ${opts.orgName} this week.`)
  lines.push('')
  lines.push('─'.repeat(60))

  for (let i = 0; i < opts.opps.length; i++) {
    const opp = opts.opps[i]
    lines.push('')
    lines.push(`${i + 1}. ${opp.opportunity_title}`)
    lines.push(`   Funder:   ${opp.funder_name}`)
    lines.push(`   Funding:  ${fmtRange(opp.funding_range_min, opp.funding_range_max)}`)
    lines.push(`   Deadline: ${fmtDate(opp.application_deadline)}`)
    lines.push(`   Match:    ${opts.scores[i]}/100`)
    if (opp.external_link) {
      lines.push(`   Apply:    ${opp.external_link}`)
    }
    lines.push('')
    lines.push('─'.repeat(60))
  }

  lines.push('')
  lines.push(`View all opportunities on Omanye:`)
  lines.push(`${SITE_URL}/org/${opts.orgSlug}/funders`)
  lines.push('')
  lines.push('To stop receiving these digests, visit your notification settings:')
  lines.push(`${SITE_URL}/org/${opts.orgSlug}/settings`)
  lines.push('')
  lines.push('── Omanye Team')

  return lines.join('\n')
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (_req) => {
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // 1. Fetch all orgs that have at least one focus area
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: orgs, error: orgsErr } = await db
    .from('organizations')
    .select('id, name, slug, focus_areas, eligible_geographies, program_types, annual_budget_range')
    .filter('focus_areas', 'not.eq', '{}')

  if (orgsErr) {
    return new Response(JSON.stringify({ error: orgsErr.message }), { status: 500 })
  }

  // 2. Fetch all active funder opportunities
  const { data: allOpps, error: oppsErr } = await db
    .from('funder_opportunities')
    .select('id, funder_name, opportunity_title, funding_range_min, funding_range_max, application_deadline, external_link, focus_areas, eligible_geographies, eligible_org_types')
    .eq('status', 'active')

  if (oppsErr) {
    return new Response(JSON.stringify({ error: oppsErr.message }), { status: 500 })
  }

  let sent = 0
  let errors = 0

  for (const org of (orgs ?? [])) {
    const ngoProfile: NgoProfile = {
      focus_areas:          org.focus_areas          ?? [],
      eligible_geographies: org.eligible_geographies ?? [],
      program_types:        org.program_types        ?? [],
      annual_budget_range:  org.annual_budget_range  ?? null,
    }

    // Score and rank opps for this org
    const scored = (allOpps as FunderOpp[])
      .map(opp => ({ opp, score: matchScore(ngoProfile, opp) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const da = a.opp.application_deadline ? new Date(a.opp.application_deadline).getTime() : Infinity
        const db2 = b.opp.application_deadline ? new Date(b.opp.application_deadline).getTime() : Infinity
        return da - db2
      })
      .slice(0, 5)

    if (scored.length === 0) continue

    // Fetch team members with email notifications enabled + funder_digest_enabled
    const { data: members } = await db
      .from('profiles')
      .select('id, full_name, notification_preferences(email_notifications, funder_digest_enabled)')
      .eq('organization_id', org.id)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF'])

    for (const member of (members ?? [])) {
      const prefs = Array.isArray(member.notification_preferences)
        ? member.notification_preferences[0]
        : member.notification_preferences

      // Skip if email notifications globally off or digest specifically disabled
      if (prefs && (prefs.email_notifications === false || prefs.funder_digest_enabled === false)) {
        continue
      }

      // Get auth user email
      const { data: authData } = await db.auth.admin.getUserById(member.id)
      const email = authData?.user?.email
      if (!email) continue

      const body = buildEmailText({
        orgName:       org.name,
        recipientName: member.full_name,
        opps:          scored.map(s => s.opp),
        scores:        scored.map(s => s.score),
        orgSlug:       org.slug,
      })

      // Send via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `Omanye <${FROM_EMAIL}>`,
          to:      [email],
          subject: `Your weekly funder digest — ${org.name}`,
          text:    body,
        }),
      })

      if (res.ok) sent++
      else errors++
    }
  }

  return new Response(
    JSON.stringify({ success: true, sent, errors, orgs_processed: (orgs ?? []).length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
