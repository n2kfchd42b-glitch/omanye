// POST /api/billing/checkout
// Creates a Stripe Checkout Session and returns the redirect URL.

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

  const { priceId, organizationId } = await req.json() as {
    priceId:        string
    organizationId: string
  }

  if (!priceId || organizationId !== orgId) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Invalid request' }, { status: 400 })
  }

  // Fetch org for name + existing Stripe customer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: org } = await supabase
    .from('organizations')
    .select('name, slug')
    .eq('id', orgId)
    .single()

  const { data: subscription } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single()

  let customerId: string | undefined = (subscription as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? undefined

  // Create Stripe customer if none exists
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     (org as { name: string } | null)?.name,
      metadata: { organization_id: orgId },
    })
    customerId = customer.id

    // Persist customer ID immediately so we don't create duplicates
    await db
      .from('subscriptions')
      .upsert(
        { organization_id: orgId, stripe_customer_id: customerId, plan: 'FREE', status: 'ACTIVE' },
        { onConflict: 'organization_id' }
      )
  }

  const slug = (org as { name: string; slug: string } | null)?.slug ?? ''
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create({
      customer:    customerId,
      mode:        'subscription',
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/org/${slug}/settings?tab=billing&billing=success`,
      cancel_url:  `${baseUrl}/org/${slug}/settings?tab=billing`,
      subscription_data: {
        trial_period_days: 14,
        metadata: { organization_id: orgId },
      },
      metadata: { organization_id: orgId },
      allow_promotion_codes: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    console.error('[billing/checkout] Stripe error:', err)
    return NextResponse.json({ error: 'STRIPE_ERROR', message: msg }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
