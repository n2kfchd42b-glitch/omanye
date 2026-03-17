import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` param can carry a pre-auth destination (e.g. ?next=/onboarding)
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const supabase = createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Session is now set in cookies. Fetch the user profile to determine
  // the correct post-auth destination.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  // Determine the base URL (handles Vercel preview + production)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal       = process.env.NODE_ENV === 'development'
  const baseUrl       = isLocal
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  // If profile is missing, send to onboarding
  if (!profile) {
    return NextResponse.redirect(`${baseUrl}/onboarding`)
  }

  const { role, onboarding_complete, organization_id } = profile

  // Must complete onboarding first
  if (!onboarding_complete) {
    return NextResponse.redirect(`${baseUrl}/onboarding`)
  }

  // Honour an explicit `next` param (e.g. from magic-link or OAuth with state)
  if (next && next !== '/') {
    return NextResponse.redirect(`${baseUrl}${next}`)
  }

  // Role-based home redirect
  if (role === 'DONOR') {
    return NextResponse.redirect(`${baseUrl}/donor/dashboard`)
  }

  // NGO user — look up org slug for the dashboard URL
  if (organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', organization_id)
      .single()

    if (org?.slug) {
      return NextResponse.redirect(`${baseUrl}/org/${org.slug}/dashboard`)
    }
  }

  // Fallback — let middleware sort it out
  return NextResponse.redirect(`${baseUrl}/onboarding`)
}
