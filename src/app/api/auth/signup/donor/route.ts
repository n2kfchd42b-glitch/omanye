import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const { fullName, email, password, donorOrgName } = await request.json()

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // 1. Create auth user (auto-confirm so they can sign in immediately)
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Failed to create account.' },
      { status: 400 }
    )
  }

  const userId = authData.user.id

  // 2. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:        userId,
      full_name: fullName,
      role:      'DONOR',
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
  }

  // 3. Create donor_profiles row
  const { error: donorProfileError } = await adminClient
    .from('donor_profiles')
    .insert({
      id:                userId,
      organization_name: donorOrgName || null,
      contact_email:     email,
    })

  if (donorProfileError) {
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create donor profile.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
