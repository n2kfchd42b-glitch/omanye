/**
 * Smoke tests — Authentication flows
 *
 * Run with: npm test -- src/tests/smoke/auth.test.ts
 *
 * These tests verify the critical auth paths work end-to-end.
 * They use the Supabase service-role client to set up and tear down
 * test data, and the anon client to simulate real user actions.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Service-role client — bypasses RLS for setup/teardown
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function deleteUserByEmail(email: string) {
  const { data } = await admin.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === email)
  if (user) await admin.auth.admin.deleteUser(user.id)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Authentication — NGO signup', () => {
  const testEmail = `smoke-ngo-${Date.now()}@test.omanye.io`
  const orgSlug   = `smoke-org-${Date.now()}`

  afterAll(async () => {
    await deleteUserByEmail(testEmail)
    await admin.from('organizations').delete().eq('slug', orgSlug)
  })

  it('creates user + org + profile on NGO signup', async () => {
    const res = await fetch(`${APP_URL}/api/auth/signup/ngo`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:             testEmail,
        password:          'Test1234!',
        full_name:         'Test NGO User',
        organization_name: 'Smoke Test Org',
        organization_slug: orgSlug,
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()

    // Verify profile was created
    const { data: profile } = await admin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', body.data.user?.id)
      .single()

    expect(profile?.role).toBe('NGO_ADMIN')
    expect(profile?.organization_id).toBeTruthy()

    // Verify org was created with correct slug
    const { data: org } = await admin
      .from('organizations')
      .select('slug')
      .eq('slug', orgSlug)
      .single()

    expect(org?.slug).toBe(orgSlug)
  })
})

describe('Authentication — Donor signup', () => {
  const testEmail = `smoke-donor-${Date.now()}@test.omanye.io`

  afterAll(async () => {
    await deleteUserByEmail(testEmail)
  })

  it('creates user + profile + donor_profile on donor signup', async () => {
    const res = await fetch(`${APP_URL}/api/auth/signup/donor`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     testEmail,
        password:  'Test1234!',
        full_name: 'Test Donor',
      }),
    })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toBeDefined()

    const userId = body.data.user?.id
    expect(userId).toBeTruthy()

    // Verify profile role
    const { data: profile } = await admin
      .from('profiles')
      .select('role, organization_id')
      .eq('id', userId)
      .single()

    expect(profile?.role).toBe('DONOR')
    expect(profile?.organization_id).toBeNull()

    // Verify donor_profile row
    const { data: donorProfile } = await admin
      .from('donor_profiles')
      .select('id')
      .eq('profile_id', userId)
      .single()

    expect(donorProfile).toBeTruthy()
  })
})

describe('Authentication — redirects', () => {
  it('unauthenticated request to /org/* redirects to /login', async () => {
    const res = await fetch(`${APP_URL}/org/some-org/dashboard`, {
      redirect: 'manual',
    })
    // 307/302 redirect to /login
    expect([301, 302, 307, 308]).toContain(res.status)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/login')
  })

  it('unauthenticated request to /donor/* redirects to /login', async () => {
    const res = await fetch(`${APP_URL}/donor/dashboard`, {
      redirect: 'manual',
    })
    expect([301, 302, 307, 308]).toContain(res.status)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/login')
  })
})
