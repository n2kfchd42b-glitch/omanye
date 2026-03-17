// ── Stripe instances ──────────────────────────────────────────────────────────
// This file is imported by server-side code only (API routes, Server Actions).
// The secret key must NEVER appear in client bundles.

import Stripe from 'stripe'
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js'

// ── Server-side Stripe instance (secret key) ─────────────────────────────────
// Lazy singleton — instantiated on first use so build-time imports don't throw.

let _stripe: Stripe | null = null

export function getServerStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    })
  }
  return _stripe
}

// Convenience export — used by existing imports of `stripe`
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getServerStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// ── Client-side Stripe.js loader (publishable key) ───────────────────────────
// Call getStripe() inside components / event handlers — do not call at module level.

let stripePromise: Promise<StripeJs | null> | null = null

export function getStripe(): Promise<StripeJs | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
    )
  }
  return stripePromise
}
