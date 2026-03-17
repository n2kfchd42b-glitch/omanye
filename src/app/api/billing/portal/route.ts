// POST /api/billing/portal
// Creates a Stripe Customer Portal session and returns the redirect URL.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/billing/stripe'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'NGO_ADMIN only' }, { status: 403 })
  }

  const orgId = profile.organization_id
  if (!orgId) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'No organization' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: subscription } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single()

  const customerId = (subscription as { stripe_customer_id: string | null } | null)?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'No billing account found. Subscribe to a plan first.' },
      { status: 404 }
    )
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single()

  const slug    = (org as { slug: string } | null)?.slug ?? ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${baseUrl}/org/${slug}/settings?tab=billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
