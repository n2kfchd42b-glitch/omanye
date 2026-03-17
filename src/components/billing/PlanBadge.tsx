import type { SubscriptionTier } from '@/lib/supabase/database.types'
import { COLORS, FONTS } from '@/lib/tokens'

interface Props {
  tier:  SubscriptionTier
  size?: 'sm' | 'md' | 'lg'
}

const TIER_STYLES: Record<SubscriptionTier, { bg: string; text: string; border?: string }> = {
  FREE:         { bg: '#F1F5F9',         text: '#475569' },
  STARTER:      { bg: '#DBEAFE',         text: '#1E40AF' },
  PROFESSIONAL: { bg: '#D4AF5C22',       text: '#78350F' },
  ENTERPRISE:   { bg: COLORS.forest,     text: '#ffffff', border: `2px solid ${COLORS.gold}` },
}

const SIZE_STYLES: Record<'sm' | 'md' | 'lg', { fontSize: number; padding: string; borderRadius: number }> = {
  sm:  { fontSize: 10, padding: '2px 8px',  borderRadius: 12 },
  md:  { fontSize: 12, padding: '4px 12px', borderRadius: 16 },
  lg:  { fontSize: 14, padding: '6px 16px', borderRadius: 20 },
}

export function PlanBadge({ tier, size = 'md' }: Props) {
  const ts = TIER_STYLES[tier] ?? TIER_STYLES.FREE
  const ss = SIZE_STYLES[size]

  return (
    <span
      style={{
        display:      'inline-block',
        fontSize:     ss.fontSize,
        fontWeight:   700,
        padding:      ss.padding,
        borderRadius: ss.borderRadius,
        background:   ts.bg,
        color:        ts.text,
        border:       ts.border ?? 'none',
        fontFamily:   FONTS.body,
        letterSpacing: '0.02em',
        lineHeight:   1,
      }}
    >
      {tier}
    </span>
  )
}
