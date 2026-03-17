import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

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

export async function POST(request: Request) {
  const { orgName, country, registrationNumber, fullName, email, password } =
    await request.json()

  if (!orgName || !fullName || !email || !password) {
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

  // 2. Create organization
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name:                orgName,
      slug:                toSlug(orgName),
      country:             country   || null,
      registration_number: registrationNumber || null,
    })
    .select()
    .single()

  if (orgError || !org) {
    // Roll back auth user to keep state clean
    await adminClient.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Failed to create organization.' }, { status: 500 })
  }

  // 3. Create profile
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
    return NextResponse.json({ error: 'Failed to create profile.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
