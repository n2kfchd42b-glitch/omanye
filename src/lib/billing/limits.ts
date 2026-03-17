// ── Plan limit enforcement ────────────────────────────────────────────────────
// All limit checks happen server-side. Client checks are UI hints only.

import { createClient } from '@/lib/supabase/server'
import { getPlanLimits, getUpgradeTierFor } from './plans'
import type { LimitCheckResult, LimitType } from '@/types/billing'
import type { SubscriptionTier } from '@/lib/supabase/database.types'

// ── Count helpers ─────────────────────────────────────────────────────────────

async function countPrograms(orgId: string): Promise<number> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { count } = await db
    .from('programs')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('status', 'eq', 'COMPLETED')
  return count ?? 0
}

async function countTeamMembers(orgId: string): Promise<number> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { count } = await db
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('role', ['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'])
  return count ?? 0
}

async function countDonors(orgId: string): Promise<number> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { count } = await db
    .from('donor_program_access')
    .select('donor_id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('active', true)
  return count ?? 0
}

async function countReportsThisMonth(orgId: string): Promise<number> {
  const supabase = createClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { count } = await db
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', startOfMonth.toISOString())
  return count ?? 0
}

async function countFieldForms(orgId: string): Promise<number> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { count } = await db
    .from('field_collection_forms')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('active', true)
  return count ?? 0
}

// ── getOrgTier ────────────────────────────────────────────────────────────────

async function getOrgTier(orgId: string): Promise<SubscriptionTier> {
  const supabase = createClient()
  const { data } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', orgId)
    .single()
  return ((data as { subscription_tier: SubscriptionTier } | null)?.subscription_tier) ?? 'FREE'
}

// ── checkLimit ────────────────────────────────────────────────────────────────

export async function checkLimit(
  orgId: string,
  limitType: LimitType
): Promise<LimitCheckResult> {
  const tier   = await getOrgTier(orgId)
  const limits = getPlanLimits(tier)
  const max    = limits[limitType]

  // -1 = unlimited
  if (max === -1) {
    return { allowed: true, current: 0, limit: -1, upgradeRequired: null }
  }

  let current = 0
  switch (limitType) {
    case 'programs':          current = await countPrograms(orgId);       break
    case 'team_members':      current = await countTeamMembers(orgId);    break
    case 'donors':            current = await countDonors(orgId);         break
    case 'reports_per_month': current = await countReportsThisMonth(orgId); break
    case 'field_forms':       current = await countFieldForms(orgId);     break
    case 'storage_mb':
      // Storage tracking requires summing file sizes — return allowed for now
      // as storage enforcement is handled at the storage bucket level
      return { allowed: true, current: 0, limit: max, upgradeRequired: null }
  }

  const allowed = current < max

  return {
    allowed,
    current,
    limit: max,
    upgradeRequired: allowed
      ? null
      : getUpgradeTierFor(tier, limitType, current + 1),
  }
}
