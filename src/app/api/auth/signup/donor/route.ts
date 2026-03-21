import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

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
    return NextResponse.json({ error: 'User already exists or email confirmation is required.' }, { status: 400 })
  }

  const userId = authData.user.id

  // 2. Confirm email via admin so the user can sign in immediately.
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })

  // 3. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:        userId,
      full_name: fullName,
      role:      'DONOR',
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create profile: ${profileError.message}` },
      { status: 500 }
    )
  }

  // 4. Create donor_profiles row
  const { error: donorProfileError } = await adminClient
    .from('donor_profiles')
    .insert({
      id:                userId,
      organization_name: donorOrgName || null,
      contact_email:     email,
    })

  if (donorProfileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create donor profile: ${donorProfileError.message}` },
      { status: 500 }
    )
  }

  // 5. Determine whether the user can sign in immediately.
  //    authData.session is non-null when Supabase has email confirmation disabled.
  //    Alternatively, if the admin email-confirm call succeeded, the user is confirmed.
  const canSignInNow = !!authData.session || !confirmError

  return NextResponse.json({ success: true, canSignInNow })
}
