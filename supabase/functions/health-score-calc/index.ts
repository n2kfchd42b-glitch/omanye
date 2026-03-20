// ── OMANYE — Health Score Calc Edge Function ──────────────────────────────────
// Triggers the health recalculate API for every organization that has at least
// one active program. Runs daily at 06:00 UTC via pg_cron.
//
// Strategy: iterate over orgs in batches of 20, calling the Next.js API route
// (POST /api/health/recalculate?org_id=…) with a service-role Bearer token.
// The API route owns all calculation + storage logic — this function is a
// scheduler/fan-out only.
//
// Environment variables required:
//   SUPABASE_URL              — your project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
//   SITE_URL                  — e.g. https://app.omanye.com

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')              ?? ''
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const SITE_URL     = Deno.env.get('SITE_URL')                  ?? 'https://app.omanye.com'

const BATCH_SIZE = 20

serve(async (_req) => {
  if (!SERVICE_KEY) {
    return new Response(
      JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }),
      { status: 500 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createClient(SUPABASE_URL, SERVICE_KEY)

  // ── Fetch all org IDs that have at least one active program ─────────────────
  const { data: rows, error: orgsErr } = await db
    .from('programs')
    .select('organization_id')
    .eq('status', 'ACTIVE')

  if (orgsErr) {
    return new Response(JSON.stringify({ error: orgsErr.message }), { status: 500 })
  }

  // Deduplicate org IDs
  const orgIds: string[] = [...new Set(
    (rows ?? []).map((r: { organization_id: string }) => r.organization_id)
  )]

  if (orgIds.length === 0) {
    return new Response(
      JSON.stringify({ success: true, orgs_processed: 0, scored: 0, failed: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let totalScored = 0
  let totalFailed = 0
  let orgsProcessed = 0
  const errors: string[] = []

  // ── Process in batches of BATCH_SIZE to avoid edge function timeouts ─────────
  for (let i = 0; i < orgIds.length; i += BATCH_SIZE) {
    const batch = orgIds.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (orgId: string) => {
        try {
          const res = await fetch(
            `${SITE_URL}/api/health/recalculate?org_id=${orgId}`,
            {
              method:  'POST',
              headers: {
                Authorization:  `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (res.ok) {
            const json = await res.json() as { scored?: number; failed?: number }
            totalScored += json.scored ?? 0
            totalFailed += json.failed ?? 0
            orgsProcessed++
          } else {
            const text = await res.text()
            errors.push(`org ${orgId}: HTTP ${res.status} — ${text.slice(0, 120)}`)
            totalFailed++
          }
        } catch (err) {
          errors.push(`org ${orgId}: ${String(err).slice(0, 120)}`)
          totalFailed++
        }
      })
    )
  }

  return new Response(
    JSON.stringify({
      success:        true,
      orgs_processed: orgsProcessed,
      scored:         totalScored,
      failed:         totalFailed,
      errors:         errors.length > 0 ? errors : undefined,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
