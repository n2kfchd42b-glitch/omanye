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
  border:       '1px solid #C8EDD8',
  borderRadius: 8,
  fontSize:     14,
  color:        '#0F1A14',
  background:   '#FFFFFF',
  outline:      'none',
  boxSizing:    'border-box',
}

const labelStyle: React.CSSProperties = {
  display:      'block',
  fontSize:     13,
  fontWeight:   600,
  color:        '#2C3E35',
  marginBottom: 5,
}

const errorStyle: React.CSSProperties = {
  fontSize:  12,
  color:     '#C0392B',
  marginTop: 3,
}

const fieldStyle: React.CSSProperties = { marginBottom: 14 }

export default function DonorSignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    values.email,
      password: values.password,
      options:  { data: { full_name: values.fullName } },
    })

    if (authError || !authData.user) {
      setServerError(authError?.message ?? 'Failed to create account.')
      return
    }

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id:        userId,
        full_name: values.fullName,
        role:      'DONOR',
      })

    if (profileError) {
      setServerError('Failed to create profile.')
      return
    }

    // 3. Create donor_profiles row
    const { error: donorProfileError } = await supabase
      .from('donor_profiles')
      .insert({
        id:                userId,
        organization_name: values.donorOrgName || null,
        contact_email:     values.email,
      })

    if (donorProfileError) {
      setServerError('Failed to create donor profile.')
      return
    }

    router.push('/onboarding')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/signup" style={{ fontSize: 13, color: '#1A5C3A', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Back
        </Link>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F1A14', marginBottom: 6, fontFamily: 'Palatino, Georgia, serif' }}>
          Create a donor account
        </h2>
        <p style={{ fontSize: 14, color: '#4A6355' }}>
          Track program impact for the NGOs you fund
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        padding:      '12px 14px',
        borderRadius: 8,
        background:   '#FEF9EC',
        border:       '1px solid #D4AF5C',
        color:        '#78350F',
        fontSize:     13,
        lineHeight:   1.5,
        marginBottom: 24,
      }}>
        <strong>How it works:</strong> After signing up, NGOs will grant you access to
        view their programs at the level they choose. You can also request access to
        specific programs directly from the donor portal.
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={fieldStyle}>
          <label htmlFor="fullName" style={labelStyle}>Your full name <span style={{ color: '#C0392B' }}>*</span></label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Kofi Boateng"
            style={{ ...inputStyle, borderColor: errors.fullName ? '#C0392B' : '#C8EDD8' }}
            {...register('fullName')}
          />
          {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="donorOrgName" style={labelStyle}>
            Your organisation <span style={{ color: '#C0392B' }}>*</span>
            <span style={{ color: '#7A9688', fontWeight: 400, marginLeft: 4 }}>(the funder)</span>
          </label>
          <input
            id="donorOrgName"
            type="text"
            placeholder="e.g. GIZ, USAID, Bill & Melinda Gates Foundation"
            style={{ ...inputStyle, borderColor: errors.donorOrgName ? '#C0392B' : '#C8EDD8' }}
            {...register('donorOrgName')}
          />
          {errors.donorOrgName && <p style={errorStyle}>{errors.donorOrgName.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="email" style={labelStyle}>Work email <span style={{ color: '#C0392B' }}>*</span></label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@foundation.org"
            style={{ ...inputStyle, borderColor: errors.email ? '#C0392B' : '#C8EDD8' }}
            {...register('email')}
          />
          {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="password" style={labelStyle}>Password <span style={{ color: '#C0392B' }}>*</span></label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            style={{ ...inputStyle, borderColor: errors.password ? '#C0392B' : '#C8EDD8' }}
            {...register('password')}
          />
          {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
        </div>

        <div style={{ ...fieldStyle, marginBottom: 24 }}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirm password <span style={{ color: '#C0392B' }}>*</span></label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            style={{ ...inputStyle, borderColor: errors.confirmPassword ? '#C0392B' : '#C8EDD8' }}
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
            background:   isSubmitting ? '#D97706' : '#0D2B1E',
            color:        '#D4AF5C',
            fontSize:     15,
            fontWeight:   700,
            cursor:       isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Creating account…' : 'Create Donor Account'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#7A9688' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#1A5C3A', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
