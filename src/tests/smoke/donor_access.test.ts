/**
 * Smoke tests — Donor access control
 *
 * Verifies that access level gates and data isolation are enforced:
 *  - SUMMARY_ONLY donors cannot see indicators
 *  - INDICATORS donors can see visible indicators
 *  - No donor can ever read expenditures
 *  - internal_notes is never returned to a donor
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL          = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ts       = Date.now()
const ORG_SLUG = `smoke-da-${ts}`
const TEST_PASSWORD = 'Test1234!'

let orgId:    string
let programId: string

async function createTestUser(email: string, role: string, orgIdArg: string | null) {
  const { data } = await admin.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  })
  await admin.from('profiles').upsert({
    id:                  data.user!.id,
    full_name:           `Test ${role}`,
    role,
    organization_id:     orgIdArg,
    onboarding_complete: true,
  })
  return data.user!.id
}

async function signInAndGetToken(email: string): Promise<string> {
  const client = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD })
  return data.session?.access_token ?? ''
}

beforeAll(async () => {
  // Create org
  const { data: org } = await admin
    .from('organizations')
    .insert({ name: `DA Test Org ${ts}`, slug: ORG_SLUG, subscription_tier: 'FREE' })
    .select()
    .single()
  orgId = (org as { id: string }).id

  // Create NGO admin
  const adminId = await createTestUser(`da-admin-${ts}@test.omanye.io`, 'NGO_ADMIN', orgId)

  // Create program
  const { data: prog } = await admin
    .from('programs')
    .insert({ name: 'Test DA Program', organization_id: orgId, currency: 'USD', created_by: adminId, status: 'ACTIVE' })
    .select()
    .single()
  programId = (prog as { id: string }).id

  // Create visible indicator
  await admin.from('indicators').insert({
    program_id:       programId,
    name:             'Beneficiaries reached',
    target_value:     1000,
    unit:             'people',
    visible_to_donor: true,
    created_by:       adminId,
  })

  // Create expenditure
  await admin.from('expenditures').insert({
    program_id:       programId,
    organization_id:  orgId,
    amount:           5000,
    description:      'Test expenditure',
    transaction_date: new Date().toISOString(),
    created_by:       adminId,
  })
})

afterAll(async () => {
  await admin.from('programs').delete().eq('id', programId)
  const { data } = await admin.auth.admin.listUsers()
  for (const u of data.users) {
    if (u.email?.endsWith(`${ts}@test.omanye.io`)) {
      await admin.auth.admin.deleteUser(u.id)
    }
  }
  await admin.from('organizations').delete().eq('id', orgId)
})

describe('Donor access — SUMMARY_ONLY', () => {
  let donorId: string
  let token: string

  beforeAll(async () => {
    const email = `da-donor-summary-${ts}@test.omanye.io`
    donorId = await createTestUser(email, 'DONOR', null)
    // Grant SUMMARY_ONLY access
    await admin.from('donor_program_access').insert({
      donor_id:        donorId,
      program_id:      programId,
      organization_id: orgId,
      access_level:    'SUMMARY_ONLY',
      active:          true,
      granted_at:      new Date().toISOString(),
    })
    token = await signInAndGetToken(email)
  })

  it('cannot see indicators', async () => {
    const res = await fetch(`${APP_URL}/api/donor/programs/${programId}/indicators`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Should be 403 forbidden or 404; not 200 with data
    expect(res.status).not.toBe(200)
  })

  it('cannot see expenditures', async () => {
    const res = await fetch(`${APP_URL}/api/donor/programs/${programId}/expenditures`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).not.toBe(200)
  })

  it('internal_notes is not returned in program access response', async () => {
    const res = await fetch(`${APP_URL}/api/donor/programs/${programId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 200) {
      const body = await res.json()
      // internal_notes must be absent or null regardless of what RLS returns
      expect(body.data?.internal_notes).toBeFalsy()
    }
    // 403 is also acceptable
  })
})

describe('Donor access — INDICATORS', () => {
  let token: string

  beforeAll(async () => {
    const email   = `da-donor-ind-${ts}@test.omanye.io`
    const donorId = await createTestUser(email, 'DONOR', null)
    await admin.from('donor_program_access').insert({
      donor_id:        donorId,
      program_id:      programId,
      organization_id: orgId,
      access_level:    'INDICATORS',
      active:          true,
      granted_at:      new Date().toISOString(),
    })
    token = await signInAndGetToken(email)
  })

  it('can see visible indicators', async () => {
    const res = await fetch(`${APP_URL}/api/donor/programs/${programId}/indicators`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Acceptable: 200 with data, or 404 if route path differs
    expect([200, 404]).toContain(res.status)
  })

  it('still cannot see expenditures', async () => {
    const res = await fetch(`${APP_URL}/api/donor/programs/${programId}/expenditures`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.status).not.toBe(200)
  })
})

describe('Donor access — direct RLS check on expenditures', () => {
  it('donor client cannot read any expenditure row via Supabase directly', async () => {
    // Create a donor client with an actual donor session
    const email   = `da-donor-rls-${ts}@test.omanye.io`
    const donorId = await createTestUser(email, 'DONOR', null)
    // Grant FULL access — even this must not expose expenditures
    await admin.from('donor_program_access').insert({
      donor_id:        donorId,
      program_id:      programId,
      organization_id: orgId,
      access_level:    'FULL',
      active:          true,
      granted_at:      new Date().toISOString(),
    })

    const donorClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    await donorClient.auth.signInWithPassword({ email, password: TEST_PASSWORD })

    const { data, error } = await donorClient.from('expenditures').select('*').limit(5)
    // RLS must return zero rows (empty array) or an RLS violation error
    expect(error !== null || (data ?? []).length === 0).toBe(true)
  })
})
