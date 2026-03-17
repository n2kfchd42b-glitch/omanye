import type { PlanDefinition, PlanLimits } from '@/types/billing'
import type { SubscriptionTier } from '@/lib/supabase/database.types'

// ── Plan definitions ──────────────────────────────────────────────────────────

export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
  FREE: {
    name:                    'Free',
    price_monthly:           0,
    price_annual:            0,
    stripe_price_id_monthly: null,
    stripe_price_id_annual:  null,
    limits: {
      programs:          2,
      team_members:      3,
      donors:            5,
      storage_mb:        500,
      reports_per_month: 3,
      field_forms:       1,
    },
    features: [
      'Up to 2 programs',
      'Up to 3 team members',
      'Up to 5 donor connections',
      'Basic reporting',
      '500 MB storage',
      'Email support',
    ],
  },

  STARTER: {
    name:                    'Starter',
    price_monthly:           49,
    price_annual:            39,   // per month, billed annually
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY ?? null,
    stripe_price_id_annual:  process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL  ?? null,
    limits: {
      programs:          10,
      team_members:      10,
      donors:            25,
      storage_mb:        5_000,
      reports_per_month: 20,
      field_forms:       5,
    },
    features: [
      'Up to 10 programs',
      'Up to 10 team members',
      'Up to 25 donor connections',
      'Full reporting + PDF export',
      '5 GB storage',
      'M&E dashboard',
      'Priority email support',
    ],
  },

  PROFESSIONAL: {
    name:                    'Professional',
    price_monthly:           149,
    price_annual:            119,
    stripe_price_id_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY ?? null,
    stripe_price_id_annual:  process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL  ?? null,
    limits: {
      programs:          50,
      team_members:      50,
      donors:            100,
      storage_mb:        25_000,
      reports_per_month: -1,   // unlimited
      field_forms:       -1,
    },
    features: [
      'Up to 50 programs',
      'Up to 50 team members',
      'Up to 100 donor connections',
      'Unlimited reports',
      '25 GB storage',
      'Advanced M&E analytics',
      'Audit log export',
      'Dedicated support',
    ],
  },

  ENTERPRISE: {
    name:                    'Enterprise',
    price_monthly:           null,
    price_annual:            null,
    stripe_price_id_monthly: null,
    stripe_price_id_annual:  null,
    limits: {
      programs:          -1,
      team_members:      -1,
      donors:            -1,
      storage_mb:        -1,
      reports_per_month: -1,
      field_forms:       -1,
    },
    features: [
      'Unlimited everything',
      'Custom integrations',
      'SSO / SAML',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom contracts',
      'On-premise option',
    ],
  },
}

// ── Helper: get limits for a tier ────────────────────────────────────────────

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLANS[tier]?.limits ?? PLANS.FREE.limits
}

// ── Helper: minimum tier that unlocks a higher limit ─────────────────────────

const TIER_ORDER: SubscriptionTier[] = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']

export function getUpgradeTierFor(
  currentTier: SubscriptionTier,
  limitType: keyof PlanLimits,
  needed: number
): SubscriptionTier | null {
  for (const tier of TIER_ORDER) {
    const tierIndex   = TIER_ORDER.indexOf(tier)
    const currentIndex = TIER_ORDER.indexOf(currentTier)
    if (tierIndex <= currentIndex) continue  // not an upgrade
    const limit = PLANS[tier].limits[limitType]
    if (limit === -1 || limit >= needed) return tier
  }
  return null
}

// ── Helper: is a tier self-serve (has Stripe price IDs)? ─────────────────────

export function isSelfServeTier(tier: SubscriptionTier): boolean {
  return tier === 'STARTER' || tier === 'PROFESSIONAL'
}
