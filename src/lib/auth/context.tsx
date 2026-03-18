'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Organization, Profile } from './types'

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthState {
  session:      Session | null
  user:         User    | null
  profile:      Profile | null
  organization: Organization | null
  loading:      boolean
}

const AuthContext = createContext<AuthState>({
  session:      null,
  user:         null,
  profile:      null,
  organization: null,
  loading:      true,
})

// ── AuthProvider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session:      null,
    user:         null,
    profile:      null,
    organization: null,
    loading:      true,
  })

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    // Catch unhandled rejections from the Supabase SDK's internal auto-refresh
    // timer (setInterval / setTimeout in _startAutoRefresh). The SDK's GoTrue
    // client force-enables autoRefreshToken in the browser and fires background
    // promises that can reject outside any user-controlled try/catch.
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message ?? String(e.reason ?? '')
      const isSdkError =
        msg.includes('did not match the expected pattern') ||
        msg.includes('Invalid URL') ||
        msg.includes('JSON') ||
        msg.includes('AuthRetryableFetchError') ||
        msg.includes('AuthUnknownError')
      if (isSdkError) {
        e.preventDefault()
      }
    }
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch {
      setState(s => ({ ...s, loading: false }))
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      return
    }

    const loadProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profile) return { profile: null, organization: null }

      let organization: Organization | null = null
      if (profile.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single()
        organization = org ?? null
      }

      return { profile, organization }
    }

    // Initial session fetch
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const { profile, organization } = await loadProfile(session.user.id)
          setState({ session, user: session.user, profile, organization, loading: false })
        } else {
          setState(s => ({ ...s, session: null, user: null, profile: null, organization: null, loading: false }))
        }
      })
      .catch(() => {
        setState(s => ({ ...s, loading: false }))
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const { profile, organization } = await loadProfile(session.user.id)
            setState({ session, user: session.user, profile, organization, loading: false })
          } else {
            setState({ session: null, user: null, profile: null, organization: null, loading: false })
          }
        } catch {
          setState(s => ({ ...s, loading: false }))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

export function useUser() {
  const { user, profile, organization, loading } = useAuth()
  return { user, profile, organization, loading }
}

export function useRole() {
  const { profile } = useAuth()
  const role = profile?.role ?? null

  return {
    role,
    isNGOAdmin:  role === 'NGO_ADMIN',
    isNGOStaff:  role === 'NGO_STAFF',
    isNGOViewer: role === 'NGO_VIEWER',
    isDonor:     role === 'DONOR',
    isNGOMember: role !== null && role !== 'DONOR',
    canEdit:     role === 'NGO_ADMIN' || role === 'NGO_STAFF',
  }
}

export function useOrgSlug(): string | null {
  const { organization } = useAuth()
  return organization?.slug ?? null
}
