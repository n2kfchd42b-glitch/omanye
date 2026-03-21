'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  fullName:         z.string().min(2, 'Full name is required'),
  email:            z.string().email('Enter a valid email address'),
  donorOrgName:     z.string().min(1, 'Organisation name is required'),
  password:         z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword:  z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  border:       '1px solid #2D3F5C',
  borderRadius: 8,
  fontSize:     14,
  color:        '#FFFFFF',
  background:   '#243352',
  outline:      'none',
  boxSizing:    'border-box',
}

const labelStyle: React.CSSProperties = {
  display:      'block',
  fontSize:     13,
  fontWeight:   600,
  color:        '#A0AEC0',
  marginBottom: 5,
}

const errorStyle: React.CSSProperties = {
  fontSize:  12,
  color:     '#FC8181',
  marginTop: 3,
}

const fieldStyle: React.CSSProperties = { marginBottom: 14 }

export default function DonorSignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    setInfoMessage(null)

    try {
      // 1. Create user + profile via server route (uses service role to bypass RLS)
      const res = await fetch('/api/auth/signup/donor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          fullName:     values.fullName,
          email:        values.email,
          password:     values.password,
          donorOrgName: values.donorOrgName,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setServerError(body.error ?? 'Failed to create account.')
        return
      }

      if (!body.canSignInNow) {
        setInfoMessage(
          'Account created! Please check your email and click the confirmation link, then sign in.'
        )
        return
      }

      // Sign in to establish a browser session
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    values.email,
        password: values.password,
      })

      if (signInError) {
        setServerError(signInError.message)
        return
      }

      router.replace('/onboarding')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/signup" style={{ fontSize: 13, color: '#60A5FA', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Back
        </Link>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', marginBottom: 6, fontFamily: 'Palatino, Georgia, serif' }}>
          Create a donor account
        </h2>
        <p style={{ fontSize: 14, color: '#6B7A99' }}>
          Track program impact for the NGOs you fund
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        padding:      '12px 14px',
        borderRadius: 8,
        background:   'rgba(212,175,92,0.1)',
        border:       '1px solid rgba(212,175,92,0.3)',
        color:        '#E8D48B',
        fontSize:     13,
        lineHeight:   1.5,
        marginBottom: 24,
      }}>
        <strong>How it works:</strong> After signing up, NGOs will grant you access to
        view their programs at the level they choose. You can also request access to
        specific programs directly from the donor portal.
      </div>

      {infoMessage && (
        <div style={{
          padding:      '10px 14px',
          borderRadius: 8,
          background:   'rgba(56,161,105,0.15)',
          color:        '#68D391',
          fontSize:     13,
          marginBottom: 16,
        }}>
          {infoMessage}
        </div>
      )}

      {serverError && (
        <div style={{
          padding:      '10px 14px',
          borderRadius: 8,
          background:   'rgba(229,62,62,0.15)',
          color:        '#FC8181',
          fontSize:     13,
          marginBottom: 16,
        }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={fieldStyle}>
          <label htmlFor="fullName" style={labelStyle}>Your full name <span style={{ color: '#FC8181' }}>*</span></label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Kofi Boateng"
            style={{ ...inputStyle, borderColor: errors.fullName ? '#E53E3E' : '#2D3F5C' }}
            {...register('fullName')}
          />
          {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="donorOrgName" style={labelStyle}>
            Your organisation <span style={{ color: '#FC8181' }}>*</span>
            <span style={{ color: '#6B7A99', fontWeight: 400, marginLeft: 4 }}>(the funder)</span>
          </label>
          <input
            id="donorOrgName"
            type="text"
            placeholder="e.g. GIZ, USAID, Bill & Melinda Gates Foundation"
            style={{ ...inputStyle, borderColor: errors.donorOrgName ? '#E53E3E' : '#2D3F5C' }}
            {...register('donorOrgName')}
          />
          {errors.donorOrgName && <p style={errorStyle}>{errors.donorOrgName.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>Work email <span style={{ color: '#FC8181' }}>*</span></label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@foundation.org"
            style={{ ...inputStyle, borderColor: errors.email ? '#E53E3E' : '#2D3F5C' }}
            {...register('email')}
          />
          {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="password" style={labelStyle}>Password <span style={{ color: '#FC8181' }}>*</span></label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            style={{ ...inputStyle, borderColor: errors.password ? '#E53E3E' : '#2D3F5C' }}
            {...register('password')}
          />
          {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
        </div>

        <div style={{ ...fieldStyle, marginBottom: 24 }}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm password <span style={{ color: '#FC8181' }}>*</span></label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#E53E3E' : '#2D3F5C' }}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && <p style={errorStyle}>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width:        '100%',
            padding:      '11px 16px',
            borderRadius: 8,
            border:       'none',
            background:   isSubmitting ? '#6B7A99' : '#D4AF5C',
            color:        '#0F1B33',
            fontSize:     15,
            fontWeight:   700,
            cursor:       isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Creating account…' : 'Create Donor Account'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#6B7A99' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#D4AF5C', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
