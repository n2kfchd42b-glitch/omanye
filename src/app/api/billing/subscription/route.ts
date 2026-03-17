// GET /api/billing/subscription
// Returns current subscription, plan limits, and usage stats for the caller's org.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS, getPlanLimits } from '@/lib/billing/plans'
import type { SubscriptionTier } from '@/lib/supabase/database.types'
import type { SubscriptionResponse, UsageStats, Subscription } from '@/types/billing'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'No organization' }, { status: 403 })
  }

  const orgId = profile.organization_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Fetch subscription row
  const { data: sub } = await db
    .from('subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  // Fetch org tier (source of truth)
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', orgId)
    .single()

  const tier: SubscriptionTier = (org as { subscription_tier: SubscriptionTier } | null)?.subscription_tier ?? 'FREE'
  const plan    = PLANS[tier]
  const limits  = getPlanLimits(tier)

  // ── Compute usage ──────────────────────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    { count: programsUsed },
    { count: membersUsed },
    { count: donorsUsed },
    { count: reportsThisMonth },
    { count: fieldFormsUsed },
  ] = await Promise.all([
    db.from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .not('status', 'eq', 'COMPLETED'),
    db.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER']),
    db.from('donor_program_access')
      .select('donor_id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('active', true),
    db.from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', startOfMonth.toISOString()),
    db.from('field_collection_forms')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('active', true),
  ])

  const usage: UsageStats = {
    programs_used:      programsUsed      ?? 0,
    members_used:       membersUsed       ?? 0,
    donors_used:        donorsUsed        ?? 0,
    storage_used_mb:    0,  // tracked at storage bucket level
    reports_this_month: reportsThisMonth  ?? 0,
    field_forms_used:   fieldFormsUsed    ?? 0,
  }

  const response: SubscriptionResponse = {
    subscription: sub as Subscription | null,
    plan,
    usage,
    limits,
  }

  return NextResponse.json(response)
}
