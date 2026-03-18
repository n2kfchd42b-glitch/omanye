'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  border:       '1px solid #C8EDD8',
  borderRadius: 8,
  fontSize:     15,
  color:        '#0F1A14',
  background:   '#FFFFFF',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display:      'block',
  fontSize:     13,
  fontWeight:   600,
  color:        '#2C3E35',
  marginBottom: 6,
}

export default function LoginPage() {
  const router = useRouter()

  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, onboarding_complete, organization_id')
        .eq('id', data.user.id)
        .single()

      if (!profile?.onboarding_complete) {
        router.push('/onboarding')
        return
      }

      if (profile.role === 'DONOR') {
        router.push('/donor/dashboard')
        return
      }

      if (!profile.organization_id) {
        setError('No organisation found for your account. Please contact support.')
        setLoading(false)
        return
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', profile.organization_id)
        .single()

      if (orgError || !org?.slug) {
        setError('Could not load your organisation. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/org/${org.slug}/dashboard`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed.'
      setError(message)
      setGoogleLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width:          32,
            height:         32,
            borderRadius:   8,
            background:     '#0D2B1E',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     'Palatino, Georgia, serif',
            fontWeight:     700,
            fontSize:       16,
            color:          '#D4AF5C',
          }}>
            O
          </div>
          <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#0D2B1E' }}>
            OMANYE
          </span>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0F1A14', marginBottom: 6, fontFamily: 'Palatino, Georgia, serif' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 15, color: '#4A6355' }}>
          Sign in to your workspace
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        style={{
          width:          '100%',
          padding:        '10px 16px',
          border:         '1px solid #C8EDD8',
          borderRadius:   8,
          background:     '#FFFFFF',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            10,
          fontSize:       14,
          fontWeight:     600,
          color:          '#2C3E35',
          marginBottom:   20,
          opacity:        googleLoading ? 0.7 : 1,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: '#C8EDD8' }} />
        <span style={{ fontSize: 12, color: '#7A9688', fontWeight: 500 }}>or sign in with email</span>
        <div style={{ flex: 1, height: 1, background: '#C8EDD8' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleFormSubmit} noValidate>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@organisation.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width:         '100%',
            padding:       '11px 16px',
            borderRadius:  8,
            border:        'none',
            background:    loading ? '#4CAF78' : '#0D2B1E',
            color:         '#D4AF5C',
            fontSize:      15,
            fontWeight:    700,
            cursor:        loading ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            transition:    'background 0.15s',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        {error && (
          <div style={{
            padding:      '10px 14px',
            borderRadius: 8,
            background:   '#FEE2E2',
            color:        '#991B1B',
            fontSize:     13,
            marginTop:    12,
          }}>
            {error}
          </div>
        )}
      </form>

      {/* Footer links */}
      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#4A6355' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#1A5C3A', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
