// ── OMANYE Billing Types ──────────────────────────────────────────────────────

import type { SubscriptionTier } from '@/lib/supabase/database.types'

export type { SubscriptionTier }

// ── Enums ──────────────────────────────────────────────────────────────────────

export type BillingCycle = 'MONTHLY' | 'ANNUAL'

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'TRIALING'
  | 'INCOMPLETE'

// ── Plan limits ────────────────────────────────────────────────────────────────

export interface PlanLimits {
  programs:          number   // -1 = unlimited
  team_members:      number
  donors:            number
  storage_mb:        number
  reports_per_month: number
  field_forms:       number
}

// ── Plan definition ────────────────────────────────────────────────────────────

export interface PlanDefinition {
  name:                      string
  price_monthly:             number | null  // null = custom / Enterprise
  price_annual:              number | null  // per-month price when billed annually
  stripe_price_id_monthly:   string | null
  stripe_price_id_annual:    string | null
  limits:                    PlanLimits
  features:                  string[]
}

// ── Subscription row ───────────────────────────────────────────────────────────

export interface Subscription {
  id:                    string
  organization_id:       string
  stripe_customer_id:    string | null
  stripe_subscription_id: string | null
  stripe_price_id:       string | null
  plan:                  SubscriptionTier
  billing_cycle:         BillingCycle
  status:                SubscriptionStatus
  current_period_start:  string | null
  current_period_end:    string | null
  cancel_at_period_end:  boolean
  trial_ends_at:         string | null
  created_at:            string
  updated_at:            string
}

// ── Billing event row ──────────────────────────────────────────────────────────

export interface BillingEvent {
  id:              string
  organization_id: string | null
  stripe_event_id: string
  event_type:      string
  payload:         Record<string, unknown>
  processed:       boolean
  created_at:      string
}

// ── Usage stats returned by /api/billing/subscription ─────────────────────────

export interface UsageStats {
  programs_used:       number
  members_used:        number
  donors_used:         number
  storage_used_mb:     number
  reports_this_month:  number
  field_forms_used:    number
}

// ── Result from checkLimit() ───────────────────────────────────────────────────

export type LimitType =
  | 'programs'
  | 'team_members'
  | 'donors'
  | 'storage_mb'
  | 'reports_per_month'
  | 'field_forms'

export interface LimitCheckResult {
  allowed:         boolean
  current:         number
  limit:           number        // -1 = unlimited
  upgradeRequired: SubscriptionTier | null
}

// ── API response shapes ────────────────────────────────────────────────────────

export interface SubscriptionResponse {
  subscription: Subscription | null
  plan:         PlanDefinition
  usage:        UsageStats
  limits:       PlanLimits
}
