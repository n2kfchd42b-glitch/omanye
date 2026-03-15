import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Guard: if Supabase env vars are not yet configured, allow all public
  //    routes through so the app is still navigable during initial setup.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/auth/') ||
      pathname === '/'
    if (isAuthRoute) return NextResponse.next()
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — MUST use getUser() not getSession() for secure validation
  const { data: { user } } = await supabase.auth.getUser()

  // ── Public routes — always accessible ──────────────────────────────────────
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth/callback') ||
    pathname === '/'

  // ── Not authenticated ───────────────────────────────────────────────────────
  if (!user) {
    if (isPublicRoute) return supabaseResponse
    // Redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Authenticated: fetch role (minimal — just role + onboarding + org_id) ──
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  // If profile somehow missing, allow onboarding routes, otherwise kick to login
  if (!profile) {
    if (pathname.startsWith('/onboarding') || isPublicRoute) return supabaseResponse
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  const { role, onboarding_complete, organization_id } = profile

  // ── Authenticated user hitting auth pages → redirect to their home ──────────
  if (isPublicRoute && pathname !== '/') {
    return redirectToHome(request, role, organization_id)
  }

  // ── Must complete onboarding first ─────────────────────────────────────────
  if (!onboarding_complete && !pathname.startsWith('/onboarding')) {
    const onboardUrl = request.nextUrl.clone()
    onboardUrl.pathname = '/onboarding'
    return NextResponse.redirect(onboardUrl)
  }

  // ── /org/* — NGO roles only ─────────────────────────────────────────────────
  if (pathname.startsWith('/org/')) {
    if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(role)) {
      return redirectToHome(request, role, organization_id)
    }
  }

  // ── /donor/* — DONOR role only ──────────────────────────────────────────────
  if (pathname.startsWith('/donor/')) {
    if (role !== 'DONOR') {
      return redirectToHome(request, role, organization_id)
    }
  }

  // ── /onboarding — must be authenticated (already checked above) ─────────────
  // No additional check needed.

  return supabaseResponse
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function redirectToHome(
  request: NextRequest,
  role: string,
  organizationId: string | null
): Promise<NextResponse> {
  const url = request.nextUrl.clone()

  if (role === 'DONOR') {
    url.pathname = '/donor/dashboard'
    return NextResponse.redirect(url)
  }

  // NGO user — we need the slug; do a quick lookup
  if (organizationId) {
    // Build an admin client for the slug lookup in middleware
    // (We can't use the typed adminClient here since it's an Edge Runtime file)
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: org } = await admin
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single()

    if (org?.slug) {
      url.pathname = `/org/${org.slug}/dashboard`
      return NextResponse.redirect(url)
    }
  }

  url.pathname = '/onboarding'
  return NextResponse.redirect(url)
}

// ── Matcher — run middleware on all app routes ────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
