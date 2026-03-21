import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function POST(request: Request) {
  const { fullName, email, password, donorOrgName } = await request.json()

  if (!fullName || !email || !password) {
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

  // 2. Detect duplicate: if a profile already exists, the email is already registered.
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
  let confirmError: Error | null = null
  if (!authData.session) {
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

  // 4. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:        userId,
      full_name: fullName,
      role:      'DONOR',
    })

  if (profileError) {
    await withTimeout(adminClient.auth.admin.deleteUser(userId), 5_000).catch(() => {})
    return NextResponse.json(
      { error: `Failed to create profile: ${profileError.message}` },
      { status: 500 }
    )
  }

  // 5. Create donor_profiles row
  const { error: donorProfileError } = await adminClient
    .from('donor_profiles')
    .insert({
      id:                userId,
      organization_name: donorOrgName || null,
      contact_email:     email,
    })

  if (donorProfileError) {
    await withTimeout(adminClient.auth.admin.deleteUser(userId), 5_000).catch(() => {})
    return NextResponse.json(
      { error: `Failed to create donor profile: ${donorProfileError.message}` },
      { status: 500 }
    )
  }

  const canSignInNow = !!authData.session || !confirmError

  return NextResponse.json({ success: true, canSignInNow })
}
