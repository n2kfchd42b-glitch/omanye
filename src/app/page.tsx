import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Root page: resolve auth state and redirect to the right destination.
// Middleware handles unauthenticated requests; this handles authenticated ones.
export default async function Home() {
  // If Supabase is not yet configured, send straight to login.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect('/login')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!profile.onboarding_complete) redirect('/onboarding')

  if (profile.role === 'DONOR') redirect('/donor/dashboard')

  // NGO user — look up org slug
  if (profile.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', profile.organization_id)
      .single()

    if (org?.slug) redirect(`/org/${org.slug}/dashboard`)
  }

  redirect('/onboarding')
}
