'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import type { SubscriptionTier } from '@/lib/supabase/database.types'
import type { LimitType } from '@/types/billing'
import { PLANS } from '@/lib/billing/plans'

const LIMIT_LABELS: Record<LimitType, string> = {
  programs:          'program',
  team_members:      'team member',
  donors:            'donor connection',
  storage_mb:        'storage',
  reports_per_month: 'monthly report',
  field_forms:       'field form',
}

interface Props {
  limitType:       LimitType
  current:         number
  limit:           number
  upgradeRequired: SubscriptionTier | null
  /** If provided, renders inside a specific org settings context */
  orgSlug?:        string
}

export function UpgradePrompt({ limitType, current, limit, upgradeRequired, orgSlug }: Props) {
  const router         = useRouter()
  const [loading, setLoading] = useState(false)

  const label        = LIMIT_LABELS[limitType] ?? limitType.replace(/_/g, ' ')
  const tierName     = upgradeRequired ? PLANS[upgradeRequired]?.name ?? upgradeRequired : 'a higher plan'
  const limitDisplay = limit === -1 ? 'unlimited' : String(limit)

  async function handleUpgradeNow() {
    const tier = upgradeRequired
    if (!tier) { router.push('/pricing'); return }

    const plan = PLANS[tier]
    // Use monthly price by default for quick upgrade
    const priceId = plan.stripe_price_id_monthly
    if (!priceId) { router.push('/pricing'); return }

    if (!orgSlug) { router.push('/pricing'); return }

    setLoading(true)
    try {
      // Fetch org ID from subscription endpoint to get organizationId
      const res  = await fetch('/api/billing/subscription')
      const json = await res.json()
      const orgId = (json.subscription as { organization_id?: string } | null)?.organization_id

      if (!orgId) { router.push('/pricing'); return }

      const checkoutRes = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, organizationId: orgId }),
      })
      const checkoutJson = await checkoutRes.json()
      if (checkoutJson.url) window.location.href = checkoutJson.url
      else router.push('/pricing')
    } catch {
      router.push('/pricing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background:   COLORS.forest,
      border:       `1px solid ${COLORS.gold}40`,
      borderRadius: 14,
      padding:      20,
      display:      'flex',
      flexDirection: 'column',
      gap:          14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width:        36, height:    36, borderRadius:  8,
          background:   `${COLORS.gold}22`,
          display:      'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink:   0,
        }}>
          <Lock size={16} color={COLORS.gold} />
        </div>
        <div>
          <p style={{
            fontSize:   14, fontWeight: 600,
            color:      '#ffffff', margin: '0 0 4px',
            fontFamily: FONTS.body,
          }}>
            You&apos;ve reached your {label} limit
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, fontFamily: FONTS.body }}>
            {current} / {limitDisplay} {label}s used
            {upgradeRequired ? ` · Upgrade to ${tierName} to add more` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => router.push('/pricing')}
          style={{
            flex: 1, padding: '9px 0',
            background: 'transparent',
            border:     `1px solid rgba(255,255,255,0.2)`,
            borderRadius: 9, color: 'rgba(255,255,255,0.7)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: FONTS.body,
            boxShadow: 'none',
          }}
        >
          View Plans
        </button>
        <button
          onClick={handleUpgradeNow}
          disabled={loading}
          style={{
            flex: 1, padding: '9px 0',
            background:   loading ? `${COLORS.gold}80` : COLORS.gold,
            border:       'none',
            borderRadius: 9, color: COLORS.forest,
            fontSize: 13, fontWeight: 700,
            cursor:   loading ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.body,
            boxShadow: SHADOW.card,
          }}
        >
          {loading ? 'Loading…' : `Upgrade to ${tierName}`}
        </button>
      </div>
    </div>
  )
}
