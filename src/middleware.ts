import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

// ── Rate limit store (in-memory; for production use Vercel KV) ────────────────
// key: `${ip}:${bucket}`, value: { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

type RateLimitBucket = 'auth' | 'webhook' | 'api'

const RATE_LIMITS: Record<RateLimitBucket, { max: number; windowMs: number }> = {
  auth:    { max: 10,  windowMs: 60_000 },   // 10 req/min — brute-force protection
  webhook: { max: 100, windowMs: 60_000 },   // 100 req/min — Stripe
  api:     { max: 60,  windowMs: 60_000 },   // 60 req/min — general API
}

function getRateLimitBucket(pathname: string): RateLimitBucket | null {
  if (pathname.startsWith('/api/auth/'))            return 'auth'
  if (pathname === '/api/billing/webhook')           return 'webhook'
  if (pathname.startsWith('/api/'))                  return 'api'
  return null
}

function checkRateLimit(
  key: string,
  bucket: RateLimitBucket
): { allowed: boolean; retryAfter: number } {
  const limit = RATE_LIMITS[bucket]
  const now   = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + limit.windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (entry.count >= limit.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true, retryAfter: 0 }
}

// Prune expired entries every ~5 minutes to avoid memory leaks
let lastPruneAt = Date.now()
function maybePruneStore() {
  const now = Date.now()
  if (now - lastPruneAt < 300_000) return
  lastPruneAt = now
  for (const [key, entry] of Array.from(rateLimitStore)) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

// ── Allowed CORS origins ──────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  'http://localhost:3000',
].filter((v, i, a) => a.indexOf(v) === i) // deduplicate

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  // Allow all Vercel preview deployments
  if (/^https:\/\/[^.]+\.vercel\.app$/.test(origin)) return true
  // Allow GitHub Codespace origins
  if (/^https:\/\/[^.]+\.app\.github\.dev$/.test(origin)) return true
  return false
}

// ── Security headers added to every response ──────────────────────────────────
function applySecurityHeaders(response: NextResponse, origin: string | null): NextResponse {
  const h = response.headers

  h.set('X-Frame-Options',           'DENY')
  h.set('X-Content-Type-Options',    'nosniff')
  h.set('Referrer-Policy',           'strict-origin-when-cross-origin')
  h.set('Permissions-Policy',        'camera=(), microphone=(), geolocation=()')
  h.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "frame-src https://js.stripe.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://va.vercel-scripts.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "object-src 'self' data:",
      "font-src 'self' data:",
    ].join('; ')
  )

  // CORS for API routes
  if (origin && isAllowedOrigin(origin)) {
    h.set('Access-Control-Allow-Origin',      origin)
    h.set('Access-Control-Allow-Methods',     'GET, POST, PATCH, PUT, DELETE, OPTIONS')
    h.set('Access-Control-Allow-Headers',     'Content-Type, Authorization')
    h.set('Access-Control-Allow-Credentials', 'true')
    h.set('Vary',                             'Origin')
  }

  return response
}

// ── Main middleware ───────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin       = request.headers.get('origin')
  const method       = request.method

  maybePruneStore()

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const preflight = new NextResponse(null, { status: 204 })
    return applySecurityHeaders(preflight, origin)
  }

  // ── Rate limiting on API routes ─────────────────────────────────────────────
  const bucket = getRateLimitBucket(pathname)
  if (bucket) {
    const ip  = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              ?? request.headers.get('x-real-ip')
              ?? 'unknown'
    const key = `${ip}:${bucket}`
    const { allowed, retryAfter } = checkRateLimit(key, bucket)

    if (!allowed) {
      const response = NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' },
        { status: 429 }
      )
      response.headers.set('Retry-After', String(retryAfter))
      return applySecurityHeaders(response, origin)
    }
  }

  // ── Guard: if Supabase env vars are not yet configured ─────────────────────
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/auth/') ||
      pathname.startsWith('/team/join/') ||
      pathname.startsWith('/invite/') ||
      pathname === '/'
    if (isAuthRoute) return applySecurityHeaders(NextResponse.next(), origin)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return applySecurityHeaders(NextResponse.redirect(loginUrl), origin)
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

  // ── Route classification ────────────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/team/join/') ||
    pathname.startsWith('/invite/')

  const isMarketingRoute =
    pathname === '/features' ||
    pathname === '/about' ||
    pathname === '/pricing' ||
    pathname === '/contact' ||
    pathname === '/blog'

  // Public org profile root: /org/[slug] (no further sub-path)
  const isPublicOrgProfile = /^\/org\/[^/]+$/.test(pathname)

  // Public program detail: /org/[slug]/programs/[id] (exact, no deeper sub-path)
  const isPublicProgramDetail = /^\/org\/[^/]+\/programs\/[^/]+$/.test(pathname)

  // API routes handle their own auth — never redirect them to /login
  const isApiRoute = pathname.startsWith('/api/')

  const isAlwaysPublic =
    isAuthRoute || pathname === '/' || isApiRoute ||
    isMarketingRoute || isPublicOrgProfile || isPublicProgramDetail

  // ── Not authenticated ───────────────────────────────────────────────────────
  if (!user) {
    if (isAlwaysPublic) return applySecurityHeaders(supabaseResponse, origin)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl), origin)
  }

  // ── Authenticated: fetch role ───────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    if (pathname.startsWith('/onboarding') || isAlwaysPublic) {
      return applySecurityHeaders(supabaseResponse, origin)
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return applySecurityHeaders(NextResponse.redirect(loginUrl), origin)
  }

  const { role, onboarding_complete, organization_id } = profile

  // ── Authenticated hitting auth/home → redirect to their home ───────────────
  if (isAuthRoute || pathname === '/') {
    const redirect = await redirectToHome(request, supabase, role, organization_id)
    return applySecurityHeaders(redirect, origin)
  }

  if (isMarketingRoute || isPublicOrgProfile || isPublicProgramDetail) {
    return applySecurityHeaders(supabaseResponse, origin)
  }

  // ── Must complete onboarding ────────────────────────────────────────────────
  if (!onboarding_complete && !pathname.startsWith('/onboarding')) {
    const onboardUrl = request.nextUrl.clone()
    onboardUrl.pathname = '/onboarding'
    return applySecurityHeaders(NextResponse.redirect(onboardUrl), origin)
  }

  // ── /org/* — NGO roles only ─────────────────────────────────────────────────
  if (pathname.startsWith('/org/')) {
    if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(role)) {
      const redirect = await redirectToHome(request, supabase, role, organization_id)
      return applySecurityHeaders(redirect, origin)
    }
  }

  // ── /donor/* — DONOR role only ──────────────────────────────────────────────
  if (pathname.startsWith('/donor/')) {
    if (role !== 'DONOR') {
      const redirect = await redirectToHome(request, supabase, role, organization_id)
      return applySecurityHeaders(redirect, origin)
    }
  }

  return applySecurityHeaders(supabaseResponse, origin)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function redirectToHome(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  role: string,
  organizationId: string | null
): Promise<NextResponse> {
  const url = request.nextUrl.clone()

  if (role === 'DONOR') {
    url.pathname = '/donor/dashboard'
    return NextResponse.redirect(url)
  }

  if (organizationId) {
    const { data: org } = await supabase
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

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
