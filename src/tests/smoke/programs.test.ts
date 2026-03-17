/**
 * Smoke tests — Programs CRUD & role enforcement
 *
 * Verifies:
 *  - NGO_ADMIN can create a program
 *  - NGO_STAFF can create a program
 *  - NGO_VIEWER receives 403 when attempting to create
 *  - DONOR receives 403 when attempting to access NGO program endpoints
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Test fixture helpers ──────────────────────────────────────────────────────

async function createTestOrg(slug: string) {
  const { data, error } = await admin
    .from('organizations')
    .insert({ name: `Test Org ${slug}`, slug, subscription_tier: 'FREE' })
    .select()
    .single()
  if (error) throw error
  return data as { id: string; slug: string }
}

async function createTestUser(
  email: string,
  password: string,
  role: string,
  orgId: string | null
) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  const userId = data.user.id

  await admin.from('profiles').upsert({
    id:                  userId,
    full_name:           `Test ${role}`,
    role,
    organization_id:     orgId,
    onboarding_complete: true,
  })

  return userId
}

async function signInAs(email: string, password: string): Promise<string> {
  const anonClient = createClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.session?.access_token ?? ''
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ts       = Date.now()
const ORG_SLUG = `smoke-prog-${ts}`
let orgId: string

const ADMIN_EMAIL   = `smoke-admin-${ts}@test.omanye.io`
const STAFF_EMAIL   = `smoke-staff-${ts}@test.omanye.io`
const VIEWER_EMAIL  = `smoke-viewer-${ts}@test.omanye.io`
const DONOR_EMAIL   = `smoke-prog-donor-${ts}@test.omanye.io`
const TEST_PASSWORD = 'Test1234!'

beforeAll(async () => {
  const org = await createTestOrg(ORG_SLUG)
  orgId = org.id

  await Promise.all([
    createTestUser(ADMIN_EMAIL,  TEST_PASSWORD, 'NGO_ADMIN',  orgId),
    createTestUser(STAFF_EMAIL,  TEST_PASSWORD, 'NGO_STAFF',  orgId),
    createTestUser(VIEWER_EMAIL, TEST_PASSWORD, 'NGO_VIEWER', orgId),
    createTestUser(DONOR_EMAIL,  TEST_PASSWORD, 'DONOR',      null),
  ])
})

afterAll(async () => {
  // Delete programs created during tests
  await admin.from('programs').delete().eq('organization_id', orgId)
  // Delete users
  for (const email of [ADMIN_EMAIL, STAFF_EMAIL, VIEWER_EMAIL, DONOR_EMAIL]) {
    const { data } = await admin.auth.admin.listUsers()
    const user = data.users.find((u) => u.email === email)
    if (user) await admin.auth.admin.deleteUser(user.id)
  }
  await admin.from('organizations').delete().eq('id', orgId)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

async function createProgram(token: string) {
  return fetch(`${APP_URL}/api/programs`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name:         `Smoke Program ${Date.now()}`,
      currency:     'USD',
      organization_id: orgId,
    }),
  })
}

describe('Programs — role enforcement', () => {
  it('NGO_ADMIN can create a program', async () => {
    const token = await signInAs(ADMIN_EMAIL, TEST_PASSWORD)
    const res   = await createProgram(token)
    expect([200, 201]).toContain(res.status)
  })

  it('NGO_STAFF can create a program', async () => {
    const token = await signInAs(STAFF_EMAIL, TEST_PASSWORD)
    const res   = await createProgram(token)
    expect([200, 201]).toContain(res.status)
  })

  it('NGO_VIEWER cannot create a program (403)', async () => {
    const token = await signInAs(VIEWER_EMAIL, TEST_PASSWORD)
    const res   = await createProgram(token)
    expect(res.status).toBe(403)
  })

  it('DONOR cannot access NGO program creation endpoint (403)', async () => {
    const token = await signInAs(DONOR_EMAIL, TEST_PASSWORD)
    const res   = await createProgram(token)
    expect(res.status).toBe(403)
  })
})
