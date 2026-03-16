'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// ── Slug helpers ──────────────────────────────────────────────────────────────

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

// ── NGO sign-up ───────────────────────────────────────────────────────────────

export async function signUpNGO(data: {
  orgName:            string
  country?:           string
  registrationNumber?: string
  fullName:           string
  email:              string
  password:           string
}): Promise<{ error: string } | void> {
  const supabase = createClient()

  // 1. Create auth.users entry
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    data.email,
    password: data.password,
    options:  { data: { full_name: data.fullName } },
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create account.' }
  }

  const userId = authData.user.id

  // Auto-confirm email so users can sign in immediately (no email required in this flow)
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })
  if (confirmError) {
    console.warn('Could not auto-confirm email:', confirmError.message)
    // Non-fatal: user may need to confirm email via inbox
  }

  // 2. Create organization (service role — bypasses RLS during signup)
  const { data: org, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name:                data.orgName,
      slug:                toSlug(data.orgName),
      country:             data.country || null,
      registration_number: data.registrationNumber || null,
    })
    .select()
    .single()

  if (orgError || !org) {
    return { error: 'Failed to create organization.' }
  }

  // 3. Create profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:              userId,
      full_name:       data.fullName,
      role:            'NGO_ADMIN',
      organization_id: org.id,
    })

  if (profileError) {
    return { error: 'Failed to create profile.' }
  }

  redirect('/onboarding')
}

// ── Donor sign-up ─────────────────────────────────────────────────────────────

export async function signUpDonor(data: {
  fullName:         string
  email:            string
  password:         string
  donorOrgName:     string
}): Promise<{ error: string } | void> {
  const supabase = createClient()

  // 1. Create auth.users entry
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    data.email,
    password: data.password,
    options:  { data: { full_name: data.fullName } },
  })

  if (authError || !authData.user) {
    return { error: authError?.message ?? 'Failed to create account.' }
  }

  const userId = authData.user.id

  // Auto-confirm email so users can sign in immediately (no email required in this flow)
  const { error: donorConfirmError } = await adminClient.auth.admin.updateUserById(userId, { email_confirm: true })
  if (donorConfirmError) {
    console.warn('Could not auto-confirm email:', donorConfirmError.message)
  }

  // 2. Create profile (organization_id = null for donors)
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:        userId,
      full_name: data.fullName,
      role:      'DONOR',
    })

  if (profileError) {
    return { error: 'Failed to create profile.' }
  }

  // 3. Create donor_profiles row
  const { error: donorProfileError } = await adminClient
    .from('donor_profiles')
    .insert({
      id:                userId,
      organization_name: data.donorOrgName || null,
      contact_email:     data.email,
    })

  if (donorProfileError) {
    return { error: 'Failed to create donor profile.' }
  }

  redirect('/onboarding')
}

// ── Sign in ───────────────────────────────────────────────────────────────────

export async function signIn(data: {
  email:    string
  password: string
}): Promise<{ error: string } | void> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email:    data.email,
    password: data.password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { error: 'Email not confirmed. Check your inbox for a confirmation link, or contact support if you did not receive one.' }
    }
    return { error: error.message }
  }

  // Fetch profile to determine redirect destination
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }

  if (!profile.onboarding_complete) {
    redirect('/onboarding')
  }

  if (profile.role === 'DONOR') {
    redirect('/donor/dashboard')
  }

  // NGO user — get org slug
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', profile.organization_id)
      .single()

    if (org?.slug) {
      redirect(`/org/${org.slug}/dashboard`)
    }
  }

  redirect('/onboarding')
}

// ── Sign out ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Complete NGO onboarding ───────────────────────────────────────────────────

export async function completeNGOOnboarding(data: {
  userId:       string
  orgId:        string
  orgSlug:      string
  logoUrl?:     string
  website?:     string
  description?: string
  fullName:     string
  jobTitle?:    string
  avatarUrl?:   string
}): Promise<{ error: string } | void> {
  const { error: profileErr } = await adminClient
    .from('profiles')
    .update({
      full_name:           data.fullName,
      job_title:           data.jobTitle   || null,
      avatar_url:          data.avatarUrl  || null,
      onboarding_complete: true,
    })
    .eq('id', data.userId)

  if (profileErr) return { error: profileErr.message }

  const { error: orgErr } = await adminClient
    .from('organizations')
    .update({
      logo_url:    data.logoUrl    || null,
      website:     data.website    || null,
      description: data.description || null,
    })
    .eq('id', data.orgId)

  if (orgErr) return { error: orgErr.message }

  redirect(`/org/${data.orgSlug}/dashboard`)
}

// ── Complete Donor onboarding ─────────────────────────────────────────────────

export async function completeDonorOnboarding(data: {
  userId:       string
  fullName:     string
  avatarUrl?:   string
  donorOrgName: string
}): Promise<{ error: string } | void> {
  const { error: profileErr } = await adminClient
    .from('profiles')
    .update({
      full_name:           data.fullName,
      avatar_url:          data.avatarUrl || null,
      onboarding_complete: true,
    })
    .eq('id', data.userId)

  if (profileErr) return { error: profileErr.message }

  const { error: donorErr } = await adminClient
    .from('donor_profiles')
    .update({ organization_name: data.donorOrgName })
    .eq('id', data.userId)

  if (donorErr) return { error: donorErr.message }

  redirect('/donor/dashboard')
}

// ── Invite team member (NGO_ADMIN only) ──────────────────────────────────────

export async function inviteTeamMember(data: {
  email:          string
  fullName:       string
  role:           'NGO_STAFF' | 'NGO_VIEWER'
  organizationId: string
}): Promise<{ error: string } | void> {
  // Use admin to create/invite user; in production wire to Supabase inviteUserByEmail
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    data.email,
    { data: { full_name: data.fullName } }
  )

  if (inviteError || !inviteData.user) {
    return { error: inviteError?.message ?? 'Failed to send invite.' }
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:              inviteData.user.id,
      full_name:       data.fullName,
      role:            data.role,
      organization_id: data.organizationId,
    })

  if (profileError) {
    return { error: 'Invite sent but failed to create profile.' }
  }
}
