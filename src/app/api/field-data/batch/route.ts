// POST /api/field-data/batch
// ─────────────────────────────────────────────────────────────────────────────
// Accepts an array of up to 50 field submissions from an offline-sync client.
// Processes each item independently so a single invalid row does not block
// the rest. Returns a per-item result array.
//
// Auth: NGO_ADMIN or NGO_STAFF only (same as the single-submission endpoint).
// Rate limit: 10 batch requests per 60 s per user (enforced in middleware).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchSubmissionSchema } from '@/lib/validation/schemas'
import { unauthorized, forbidden, validationError } from '@/lib/api/errors'
import { logActionForUser } from '@/lib/audit/logger'

// Simple in-memory rate limiter: max 10 batch requests per 60 s per user.
// For a production deployment use Redis or Upstash, but this covers single-instance.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_WINDOW_MS  = 60_000
const RATE_LIMIT      = 10

function checkRateLimit(userId: string): boolean {
  const now    = Date.now()
  const bucket = rateLimitMap.get(userId)

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true // allowed
  }

  if (bucket.count >= RATE_LIMIT) return false // blocked

  bucket.count++
  return true
}

// ─────────────────────────────────────────────────────────────────────────────

interface ItemResult {
  client_id:     string
  ok:            boolean
  server_id?:    string
  error?:        string
  flagged?:      boolean
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Too many batch sync requests. Please wait before retrying.' },
      { status: 429 }
    )
  }

  // Parse and validate
  const parsed = batchSubmissionSchema.safeParse(await req.json())
  if (!parsed.success) return validationError(parsed.error)

  const { submissions } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const results: ItemResult[] = []

  for (const sub of submissions) {
    // Flag submissions that look incomplete so they enter the moderation queue
    const needsReview = !sub.location_name || Object.keys(sub.data ?? {}).length === 0

    try {
      const { data, error } = await db
        .from('field_submissions')
        .insert({
          program_id:         sub.program_id,
          organization_id:    profile.organization_id,
          submitted_by:       user.id,
          form_id:            sub.form_id   ?? null,
          submission_date:    sub.submission_date ?? new Date().toISOString(),
          location_name:      sub.location_name ?? '',
          location_lat:       sub.location_lat  ?? null,
          location_lng:       sub.location_lng  ?? null,
          data:               sub.data,
          notes:              sub.notes         ?? '',
          attachments:        sub.attachments   ?? [],
          status:             needsReview ? 'FLAGGED' : 'SUBMITTED',
          sync_source:        'batch_sync',
          device_metadata:    sub.device_metadata ?? null,
          flagged_for_review: needsReview,
          flag_reason:        needsReview
            ? 'Submitted via offline batch sync — missing location or data fields'
            : null,
        })
        .select('id')
        .single()

      if (error) {
        results.push({ client_id: sub.client_id, ok: false, error: error.message })
        continue
      }

      results.push({
        client_id:  sub.client_id,
        ok:         true,
        server_id:  (data as { id: string }).id,
        flagged:    needsReview,
      })
    } catch (err) {
      results.push({
        client_id: sub.client_id,
        ok:        false,
        error:     err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const succeeded = results.filter((r) => r.ok).length
  const flagged   = results.filter((r) => r.ok && r.flagged).length

  // Single audit entry for the whole batch
  void logActionForUser(user.id, {
    organizationId: profile.organization_id,
    action:         'field.batch_sync',
    entityType:     'field_submission',
    metadata: {
      total:     submissions.length,
      succeeded,
      failed:    submissions.length - succeeded,
      flagged,
    },
  })

  return NextResponse.json({ results }, { status: 207 }) // 207 Multi-Status
}
