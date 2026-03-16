'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

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
