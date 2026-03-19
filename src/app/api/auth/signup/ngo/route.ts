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
    return NextResponse.json({ error: 'User already exists or email confirmation is required.' }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Confirm email via admin so the user can sign in immediately.
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })
  if (confirmError) {
    // Non-fatal — user can still confirm via email link
  }

  // 3. Create organization
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
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create organization: ${orgError?.message ?? 'unknown error'}` },
      { status: 500 }
    )
  }

  // 4. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:              userId,
      full_name:       fullName,
      role:            'NGO_ADMIN',
      organization_id: org.id,
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create profile: ${profileError.message}` },
      { status: 500 }
    )
  }

  // 5. Probe whether the user can sign in right now (email confirmed or not).
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  const canSignInNow = !signInError

  return NextResponse.json({ success: true, canSignInNow })
}
