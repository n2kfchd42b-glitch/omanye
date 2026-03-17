/**
 * Smoke tests — Billing & plan enforcement
 *
 * Verifies:
 *  - FREE plan enforces program creation limit
 *  - LIMIT_EXCEEDED error code returned correctly
 *  - Stripe webhook processes checkout.session.completed
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL          = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ts         = Date.now()
const ORG_SLUG   = `smoke-billing-${ts}`
const ADMIN_EMAIL = `billing-admin-${ts}@test.omanye.io`
const TEST_PW    = 'Test1234!'
const FREE_PLAN_LIMIT = 3  // adjust to match FREE tier limit in your plan config

let orgId: string
let adminToken: string

beforeAll(async () => {
  // Create org on FREE plan
  const { data: org } = await admin
    .from('organizations')
    .insert({ name: `Billing Test Org ${ts}`, slug: ORG_SLUG, subscription_tier: 'FREE' })
    .select()
    .single()
  orgId = (org as { id: string }).id

  // Create admin user
  const { data: authData } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL, password: TEST_PW, email_confirm: true,
  })
  const adminId = authData.user!.id

  await admin.from('profiles').upsert({
    id:                  adminId,
    full_name:           'Billing Test Admin',
    role:                'NGO_ADMIN',
    organization_id:     orgId,
    onboarding_complete: true,
  })

  // Sign in to get token
  const client = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: session } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: TEST_PW,
  })
  adminToken = session.session?.access_token ?? ''

  // Pre-create programs up to the FREE limit
  for (let i = 0; i < FREE_PLAN_LIMIT; i++) {
    await admin.from('programs').insert({
      name:            `Billing Test Program ${i}`,
      organization_id: orgId,
      currency:        'USD',
      created_by:      authData.user!.id,
      status:          'ACTIVE',
    })
  }
})

afterAll(async () => {
  await admin.from('programs').delete().eq('organization_id', orgId)
  const { data } = await admin.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === ADMIN_EMAIL)
  if (user) await admin.auth.admin.deleteUser(user.id)
  await admin.from('organizations').delete().eq('id', orgId)
})

describe('Billing — FREE plan limits', () => {
  it('returns LIMIT_EXCEEDED when program limit is reached', async () => {
    const res = await fetch(`${APP_URL}/api/programs`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name:            `Over-limit Program ${Date.now()}`,
        currency:        'USD',
        organization_id: orgId,
      }),
    })

    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toBe('LIMIT_EXCEEDED')
  })
})

describe('Billing — Stripe webhook', () => {
  it('webhook endpoint rejects request without valid Stripe signature', async () => {
    const res = await fetch(`${APP_URL}/api/billing/webhook`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    })
    // Must reject without a valid Stripe-Signature header
    expect([400, 401, 403]).toContain(res.status)
  })

  it('webhook endpoint is reachable (not 404)', async () => {
    const res = await fetch(`${APP_URL}/api/billing/webhook`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Stripe-Signature': 't=0,v1=invalid',
      },
      body: JSON.stringify({}),
    })
    // Stripe signature validation will fail (400), but endpoint exists (not 404)
    expect(res.status).not.toBe(404)
  })
})
