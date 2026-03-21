import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).substring(2, 6)
  )
}

// Plain anon client — used for user creation so we don't rely on the
// service-role key having GoTrue admin scope (it may be a PostgREST-only key).
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Wrap any promise with a timeout so admin API calls can't hang indefinitely.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function POST(request: Request) {
  const { orgName, country, registrationNumber, fullName, email, password } =
    await request.json()

  if (!orgName || !fullName || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const supabase = anonClient()

  // 1. Create auth user via the public signUp endpoint.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }
  if (!authData.user) {
    return NextResponse.json({ error: 'Email already registered. Please sign in instead.' }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Detect duplicate: if a profile already exists for this user ID, the email
  //    is already registered (Supabase returns the existing user on duplicate signUp
  //    when email confirmation is enabled, to prevent enumeration attacks).
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return NextResponse.json(
      { error: 'Email already registered. Please sign in instead.' },
      { status: 400 }
    )
  }

  // 3. Confirm email via admin so the user can sign in immediately.
  //    Wrapped in a timeout — the admin auth API can occasionally be slow.
  let confirmError: Error | null = null
  if (!authData.session) {
    // Only needed when email confirmation is required (session is null after signUp).
    try {
      const { error } = await withTimeout(
        adminClient.auth.admin.updateUserById(userId, { email_confirm: true }),
        8_000
      )
      if (error) confirmError = error
    } catch (e) {
      confirmError = e instanceof Error ? e : new Error(String(e))
      console.warn('Email confirmation step failed or timed out:', confirmError.message)
    }
  }

  // 4. Create organization
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name:                orgName,
      slug:                toSlug(orgName),
      country:             country || null,
      registration_number: registrationNumber || null,
    })
    .select()
    .single()

  if (orgError || !org) {
    // Clean up the newly created auth user (it's genuinely new — we checked above).
    await withTimeout(adminClient.auth.admin.deleteUser(userId), 5_000).catch(() => {})
    return NextResponse.json(
      { error: `Failed to create organization: ${orgError?.message ?? 'unknown error'}` },
      { status: 500 }
    )
  }

  // 5. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:              userId,
      full_name:       fullName,
      role:            'NGO_ADMIN',
      organization_id: org.id,
    })

  if (profileError) {
    // Clean up both the org and the auth user.
    await adminClient.from('organizations').delete().eq('id', org.id)
    await withTimeout(adminClient.auth.admin.deleteUser(userId), 5_000).catch(() => {})
    return NextResponse.json(
      { error: `Failed to create profile: ${profileError.message}` },
      { status: 500 }
    )
  }

  // 6. The user can sign in immediately if:
  //    - Supabase returned a session on signUp (email confirmation is disabled), OR
  //    - The admin email-confirm call succeeded.
  const canSignInNow = !!authData.session || !confirmError

  return NextResponse.json({ success: true, canSignInNow })
}
