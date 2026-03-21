'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


const schema = z.object({
  orgName:            z.string().min(2, 'Organisation name must be at least 2 characters'),
  country:            z.string().optional(),
  registrationNumber: z.string().optional(),
  fullName:           z.string().min(2, 'Full name is required'),
  email:              z.string().email('Enter a valid work email'),
  password:           z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword:    z.string(),
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

export default function NGOSignupPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleNextStep = async () => {
    const valid = await trigger(['orgName', 'country', 'registrationNumber'])
    if (valid) setStep(2)
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    setInfoMessage(null)

    try {
      // 1. Create user + org + profile via server route (uses service role to bypass RLS)
      const res = await fetch('/api/auth/signup/ngo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orgName:            values.orgName,
          country:            values.country,
          registrationNumber: values.registrationNumber,
          fullName:           values.fullName,
          email:              values.email,
          password:           values.password,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setServerError(body.error ?? 'Failed to create account.')
        return
      }

      if (!body.canSignInNow) {
        // Email confirmation is enabled and the service-role key could not
        // bypass it. The user must confirm via inbox before signing in.
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
          Register your NGO
        </h2>
        <p style={{ fontSize: 14, color: '#6B7A99' }}>
          Set up your organisation&apos;s workspace
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width:          26,
              height:         26,
              borderRadius:   '50%',
              background:     s <= step ? '#D4AF5C' : '#2D3F5C',
              color:          s <= step ? '#0F1B33' : '#6B7A99',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       12,
              fontWeight:     700,
            }}>
              {s}
            </div>
            <span style={{ fontSize: 12, color: s <= step ? '#FFFFFF' : '#6B7A99', fontWeight: s <= step ? 600 : 400 }}>
              {s === 1 ? 'Organisation' : 'Admin Account'}
            </span>
            {s < 2 && <div style={{ width: 24, height: 1, background: '#2D3F5C' }} />}
          </div>
        ))}
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
        {/* Step 1: Organisation */}
        {step === 1 && (
          <div>
            <div style={{
              padding:      '10px 14px',
              borderRadius: 8,
              background:   'rgba(96,165,250,0.1)',
              color:        '#60A5FA',
              fontSize:     13,
              marginBottom: 20,
              fontWeight:   500,
            }}>
              Tell us about your organisation
            </div>

            <div style={fieldStyle}>
              <label htmlFor="orgName" style={labelStyle}>Organisation name <span style={{ color: '#FC8181' }}>*</span></label>
              <input
                id="orgName"
                type="text"
                placeholder="e.g. HealthBridge Ghana"
                style={{ ...inputStyle, borderColor: errors.orgName ? '#E53E3E' : '#2D3F5C' }}
                {...register('orgName')}
              />
              {errors.orgName && <p style={errorStyle}>{errors.orgName.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label htmlFor="country" style={labelStyle}>Country of operation</label>
              <input
                id="country"
                type="text"
                placeholder="e.g. Ghana"
                style={{ ...inputStyle, borderColor: '#2D3F5C' }}
                {...register('country')}
              />
            </div>

            <div style={{ ...fieldStyle, marginBottom: 24 }}>
              <label htmlFor="registrationNumber" style={labelStyle}>Registration number <span style={{ color: '#6B7A99', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="registrationNumber"
                type="text"
                placeholder="NGO-2024-XXXXX"
                style={{ ...inputStyle, borderColor: '#2D3F5C' }}
                {...register('registrationNumber')}
              />
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              style={{
                width:        '100%',
                padding:      '11px 16px',
                borderRadius: 8,
                border:       'none',
                background:   '#D4AF5C',
                color:        '#0F1B33',
                fontSize:     15,
                fontWeight:   700,
                cursor:       'pointer',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Admin Account */}
        {step === 2 && (
          <div>
            <div style={{
              padding:      '10px 14px',
              borderRadius: 8,
              background:   'rgba(96,165,250,0.1)',
              color:        '#60A5FA',
              fontSize:     13,
              marginBottom: 20,
              fontWeight:   500,
            }}>
              Create your admin account
            </div>

            <div style={fieldStyle}>
              <label htmlFor="fullName" style={labelStyle}>Your full name <span style={{ color: '#FC8181' }}>*</span></label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Amara Osei"
                style={{ ...inputStyle, borderColor: errors.fullName ? '#E53E3E' : '#2D3F5C' }}
                {...register('fullName')}
              />
              {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label htmlFor="email" style={labelStyle}>Work email <span style={{ color: '#FC8181' }}>*</span></label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.org"
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex:         1,
                  padding:      '11px 16px',
                  borderRadius: 8,
                  border:       '1px solid #2D3F5C',
                  background:   '#1A2B4A',
                  color:        '#A0AEC0',
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       'pointer',
                }}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex:         2,
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
                {isSubmitting ? 'Creating account…' : 'Create NGO Account'}
              </button>
            </div>
          </div>
        )}
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
