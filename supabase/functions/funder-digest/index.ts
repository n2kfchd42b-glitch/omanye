// ── OMANYE — Funder Digest Edge Function ──────────────────────────────────────
// Sends a weekly plain-text email digest to NGO team members showing their
// top 5 matched funder opportunities. Also creates in-platform notifications
// for high-confidence matches (score ≥ 75).
//
// Schedule: every Monday at 08:00 UTC
//   supabase cron: "0 8 * * 1"
//
// Environment variables required:
//   SUPABASE_URL              — your project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
//   RESEND_API_KEY            — Resend API key
//   SITE_URL                  — e.g. https://app.omanye.com
//   FROM_EMAIL                — e.g. noreply@omanye.com

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')              ?? ''
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')            ?? ''
const SITE_URL       = Deno.env.get('SITE_URL')                  ?? 'https://app.omanye.com'
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL')                ?? 'noreply@omanye.com'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankedOpp {
  id:                   string
  funder_name:          string
  opportunity_title:    string
  funding_range_min:    number | null
  funding_range_max:    number | null
  application_deadline: string | null
  external_link:        string | null
  match_score:          number
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
  opps:          RankedOpp[]
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
    lines.push(`   Match:    ${opp.match_score}/100${opp.match_score >= 75 ? ' ★ High Confidence' : ''}`)
    if (opp.external_link) lines.push(`   Apply:    ${opp.external_link}`)
    lines.push('')
    lines.push('─'.repeat(60))
  }

  lines.push('')
  lines.push(`View your top matches on Omanye:`)
  lines.push(`${SITE_URL}/org/${opts.orgSlug}/matches`)
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
    .select('id, name, slug, focus_areas')
    .filter('focus_areas', 'not.eq', '{}')

  if (orgsErr) {
    return new Response(JSON.stringify({ error: orgsErr.message }), { status: 500 })
  }

  let sent = 0
  let errors = 0
  let notifications_created = 0

  for (const org of (orgs ?? [])) {
    // 2. Call the matches API endpoint (server-to-server auth via service key)
    //    Returns top 20 ranked matches with explanations already computed.
    let topOpps: RankedOpp[] = []
    try {
      const matchRes = await fetch(
        `${SITE_URL}/api/matches?org_id=${org.id}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        }
      )
      if (matchRes.ok) {
        const json = await matchRes.json() as { data: RankedOpp[] }
        topOpps = (json.data ?? []).slice(0, 5)
      }
    } catch (_e) {
      // If the API is unreachable, skip this org's email but continue
      errors++
      continue
    }

    if (topOpps.length === 0) continue

    // 3. Identify high-confidence matches (score ≥ 75)
    const highMatches = topOpps.filter(o => o.match_score >= 75)

    // 4. Fetch team members eligible for digest
    const { data: members } = await db
      .from('profiles')
      .select('id, full_name, notification_preferences(email_notifications, funder_digest_enabled)')
      .eq('organization_id', org.id)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF'])

    for (const member of (members ?? [])) {
      const prefs = Array.isArray(member.notification_preferences)
        ? member.notification_preferences[0]
        : member.notification_preferences

      const digestEnabled =
        !prefs ||
        (prefs.email_notifications !== false && prefs.funder_digest_enabled !== false)

      // 5. Create in-platform notifications for high-confidence matches
      //    (regardless of email digest preference — these are in-app only)
      if (highMatches.length > 0) {
        for (const opp of highMatches) {
          // Check if this notification already exists (avoid duplication on re-runs)
          const { count } = await db
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('recipient_id', member.id)
            .eq('type', 'FUNDER_HIGH_MATCH_FOUND')
            .eq('link', `/org/${org.slug}/matches`)
            .ilike('body', `%${opp.id}%`)

          if ((count ?? 0) === 0) {
            await db.from('notifications').insert({
              organization_id: org.id,
              recipient_id:    member.id,
              type:            'FUNDER_HIGH_MATCH_FOUND',
              title:           `High-confidence match: ${opp.opportunity_title}`,
              body:            `${opp.funder_name} scored ${opp.match_score}/100 for your organization. Opportunity ID: ${opp.id}`,
              link:            `/org/${org.slug}/matches`,
              priority:        'HIGH',
              read:            false,
            })
            notifications_created++
          }
        }
      }

      // 6. Send email digest (if enabled)
      if (!digestEnabled) continue

      const { data: authData } = await db.auth.admin.getUserById(member.id)
      const email = authData?.user?.email
      if (!email) continue

      const body = buildEmailText({
        orgName:       org.name,
        recipientName: member.full_name,
        opps:          topOpps,
        orgSlug:       org.slug,
      })

      const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
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
    JSON.stringify({
      success: true,
      sent,
      errors,
      notifications_created,
      orgs_processed: (orgs ?? []).length,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
