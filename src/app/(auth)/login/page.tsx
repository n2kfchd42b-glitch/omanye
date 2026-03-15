'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signIn } from '@/app/actions/auth'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

// ── Shared input style ────────────────────────────────────────────────────────

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

const errorStyle: React.CSSProperties = {
  fontSize:   12,
  color:      '#C0392B',
  marginTop:  4,
}

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    const result = await signIn(values)
    if (result?.error) setServerError(result.error)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width:        32,
            height:       32,
            borderRadius: 8,
            background:   '#0D2B1E',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontFamily:   'Palatino, Georgia, serif',
            fontWeight:   700,
            fontSize:     16,
            color:        '#D4AF5C',
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
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <div style={{
            padding:      '10px 14px',
            borderRadius: 8,
            background:   '#FEE2E2',
            color:        '#991B1B',
            fontSize:     13,
            marginBottom: 16,
          }}>
            {serverError}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={labelStyle}>Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@organisation.org"
            style={{ ...inputStyle, borderColor: errors.email ? '#C0392B' : '#C8EDD8' }}
            {...register('email')}
          />
          {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="password" style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            style={{ ...inputStyle, borderColor: errors.password ? '#C0392B' : '#C8EDD8' }}
            {...register('password')}
          />
          {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width:        '100%',
            padding:      '11px 16px',
            borderRadius: 8,
            border:       'none',
            background:   isSubmitting ? '#4CAF78' : '#0D2B1E',
            color:        '#D4AF5C',
            fontSize:     15,
            fontWeight:   700,
            cursor:       isSubmitting ? 'not-allowed' : 'pointer',
            letterSpacing: 0.3,
            transition:   'background 0.15s',
          }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
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
