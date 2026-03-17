// POST /api/billing/webhook
// Receives and processes Stripe webhook events.
// IMPORTANT: reads raw body — do NOT add JSON middleware.

import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/billing/stripe'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Raw body is needed for Stripe signature verification
export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function mapStripeStatus(status: string): string {
  const map: Record<string, string> = {
    active:             'ACTIVE',
    past_due:           'PAST_DUE',
    canceled:           'CANCELLED',
    trialing:           'TRIALING',
    incomplete:         'INCOMPLETE',
    incomplete_expired: 'CANCELLED',
    unpaid:             'PAST_DUE',
    paused:             'PAST_DUE',
  }
  return map[status] ?? 'ACTIVE'
}

function stripeTierFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return 'FREE'
  const starterPrices = [
    process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL,
  ].filter(Boolean)
  const proPrices = [
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY,
    process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL,
  ].filter(Boolean)
  if (starterPrices.includes(priceId)) return 'STARTER'
  if (proPrices.includes(priceId))     return 'PROFESSIONAL'
  return 'FREE'
}

async function logBillingEvent(
  admin: ReturnType<typeof getAdminClient>,
  event: Stripe.Event,
  orgId: string | null
) {
  await admin.from('billing_events').insert({
    organization_id: orgId,
    stripe_event_id: event.id,
    event_type:      event.type,
    payload:         event as unknown as Record<string, unknown>,
    processed:       true,
  })
}

async function notifyAdmins(
  admin: ReturnType<typeof getAdminClient>,
  orgId: string,
  title: string,
  body: string,
  link: string
) {
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .eq('role', 'NGO_ADMIN')

  if (!admins?.length) return

  const rows = admins.map((a: { id: string }) => ({
    organization_id: orgId,
    recipient_id:    a.id,
    type:            'PAYMENT_ISSUE',
    title,
    body,
    link,
    priority:        'HIGH',
    read:            false,
  }))

  await admin.from('notifications').insert(rows)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig     = req.headers.get('stripe-signature') ?? ''

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  const admin = getAdminClient()

  // Idempotency: skip if already processed
  const { data: existing } = await admin
    .from('billing_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .single()

  if (existing) {
    return NextResponse.json({ received: true, skipped: true })
  }

  // ── Handle events ──────────────────────────────────────────────────────────

  try {
    switch (event.type) {

      // ── checkout.session.completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session  = event.data.object as Stripe.Checkout.Session
        const orgId    = session.metadata?.organization_id
        if (!orgId) break

        const subId  = session.subscription as string | null
        let priceId: string | null  = null
        let periodStart: Date | null = null
        let periodEnd:   Date | null = null

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          priceId     = sub.items.data[0]?.price.id ?? null
          const s = sub as unknown as { current_period_start: number; current_period_end: number }
          periodStart = new Date(s.current_period_start * 1000)
          periodEnd   = new Date(s.current_period_end   * 1000)
        }

        const tier = stripeTierFromPriceId(priceId)

        await admin.from('subscriptions').upsert(
          {
            organization_id:        orgId,
            stripe_customer_id:     session.customer as string,
            stripe_subscription_id: subId,
            stripe_price_id:        priceId,
            plan:                   tier,
            status:                 'ACTIVE',
            current_period_start:   periodStart?.toISOString() ?? null,
            current_period_end:     periodEnd?.toISOString()   ?? null,
          },
          { onConflict: 'organization_id' }
        )

        await admin
          .from('organizations')
          .update({ subscription_tier: tier })
          .eq('id', orgId)

        await logBillingEvent(admin, event, orgId)
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub   = event.data.object as Stripe.Subscription
        const orgId = sub.metadata?.organization_id

        // Try to look up org via customer ID if metadata missing
        let resolvedOrgId: string | null = orgId ?? null
        if (!resolvedOrgId) {
          const { data } = await admin
            .from('subscriptions')
            .select('organization_id')
            .eq('stripe_customer_id', sub.customer as string)
            .single()
          resolvedOrgId = (data as { organization_id: string } | null)?.organization_id ?? null
        }
        if (!resolvedOrgId) break

        const priceId = sub.items.data[0]?.price.id ?? null
        const tier    = stripeTierFromPriceId(priceId)

        await admin.from('subscriptions').upsert(
          {
            organization_id:        resolvedOrgId,
            stripe_subscription_id: sub.id,
            stripe_price_id:        priceId,
            plan:                   tier,
            status:                 mapStripeStatus(sub.status),
            current_period_start:   new Date((sub as unknown as { current_period_start: number }).current_period_start * 1000).toISOString(),
            current_period_end:     new Date((sub as unknown as { current_period_end: number }).current_period_end   * 1000).toISOString(),
            cancel_at_period_end:   sub.cancel_at_period_end,
          },
          { onConflict: 'organization_id' }
        )

        await admin
          .from('organizations')
          .update({ subscription_tier: tier })
          .eq('id', resolvedOrgId)

        await logBillingEvent(admin, event, resolvedOrgId)
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub   = event.data.object as Stripe.Subscription
        const { data } = await admin
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_subscription_id', sub.id)
          .single()
        const resolvedOrgId = (data as { organization_id: string } | null)?.organization_id
        if (!resolvedOrgId) break

        await admin.from('subscriptions').upsert(
          {
            organization_id: resolvedOrgId,
            plan:            'FREE',
            status:          'CANCELLED',
          },
          { onConflict: 'organization_id' }
        )

        await admin
          .from('organizations')
          .update({ subscription_tier: 'FREE' })
          .eq('id', resolvedOrgId)

        // Fetch org slug for link
        const { data: org } = await admin
          .from('organizations')
          .select('slug')
          .eq('id', resolvedOrgId)
          .single()
        const slug = (org as { slug: string } | null)?.slug ?? ''

        await notifyAdmins(
          admin,
          resolvedOrgId,
          'Subscription cancelled',
          'Your OMANYE subscription has been cancelled. Your account has been downgraded to the Free plan.',
          `/org/${slug}/settings?tab=billing`
        )

        await logBillingEvent(admin, event, resolvedOrgId)
        break
      }

      // ── invoice.payment_failed ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const { data } = await admin
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()
        const resolvedOrgId = (data as { organization_id: string } | null)?.organization_id
        if (!resolvedOrgId) break

        await admin
          .from('subscriptions')
          .update({ status: 'PAST_DUE' })
          .eq('organization_id', resolvedOrgId)

        const { data: org } = await admin
          .from('organizations')
          .select('slug')
          .eq('id', resolvedOrgId)
          .single()
        const slug = (org as { slug: string } | null)?.slug ?? ''

        await notifyAdmins(
          admin,
          resolvedOrgId,
          'Payment failed — update your billing details',
          'Your last payment failed. Please update your payment method to avoid losing access.',
          `/org/${slug}/settings?tab=billing`
        )

        await logBillingEvent(admin, event, resolvedOrgId)
        break
      }

      // ── invoice.paid ──────────────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const { data } = await admin
          .from('subscriptions')
          .select('organization_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()
        const resolvedOrgId = (data as { organization_id: string } | null)?.organization_id
        if (!resolvedOrgId) break

        await admin
          .from('subscriptions')
          .update({ status: 'ACTIVE' })
          .eq('organization_id', resolvedOrgId)

        await logBillingEvent(admin, event, resolvedOrgId)
        break
      }

      default:
        // Log unhandled events for visibility
        await logBillingEvent(admin, event, null)
        break
    }
  } catch (err) {
    console.error('[Webhook] Processing error:', err)
    // Return 200 to prevent Stripe from retrying on logic errors;
    // log the event for manual review
    return NextResponse.json({ received: true, error: 'Processing error — check logs' })
  }

  return NextResponse.json({ received: true })
}
