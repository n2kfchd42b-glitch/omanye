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

  console.log('[donor-signup] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[donor-signup] Service role key set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

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
    console.error('[donor-signup] signUp error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }
  if (!authData.user) {
    console.error('[donor-signup] signUp returned no user (likely duplicate email with confirmation ON)')
    return NextResponse.json({ error: 'User already exists or email confirmation is required.' }, { status: 400 })
  }

  const userId = authData.user.id
  console.log('[donor-signup] Auth user created:', userId)

  // 2. Confirm email via admin so the user can sign in immediately.
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })
  if (confirmError) {
    console.error('[donor-signup] email confirm error (non-fatal):', confirmError)
  } else {
    console.log('[donor-signup] Email confirmed via admin')
  }

  // 3. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:        userId,
      full_name: fullName,
      role:      'DONOR',
    })

  if (profileError) {
    console.error('[donor-signup] profile insert error:', profileError)
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create profile: ${profileError.message}` },
      { status: 500 }
    )
  }

  console.log('[donor-signup] Profile created')

  // 4. Create donor_profiles row
  const { error: donorProfileError } = await adminClient
    .from('donor_profiles')
    .insert({
      id:                userId,
      organization_name: donorOrgName || null,
      contact_email:     email,
    })

  if (donorProfileError) {
    console.error('[donor-signup] donor_profiles insert error:', donorProfileError)
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: `Failed to create donor profile: ${donorProfileError.message}` },
      { status: 500 }
    )
  }

  console.log('[donor-signup] Donor profile created')

  // 5. Probe whether the user can sign in right now.
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    console.error('[donor-signup] sign-in probe failed:', signInError)
  }
  const canSignInNow = !signInError

  console.log('[donor-signup] canSignInNow:', canSignInNow)
  return NextResponse.json({ success: true, canSignInNow })
}
