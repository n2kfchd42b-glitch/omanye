'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { signUpNGO } from '@/app/actions/auth'
import type { Metadata } from 'next'

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

export default function NGOSignupPage() {
  const [serverError, setServerError] = useState<string | null>(null)
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
    const result = await signUpNGO(values)
    if (result?.error) setServerError(result.error)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/signup" style={{ fontSize: 13, color: '#1A5C3A', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Back
        </Link>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F1A14', marginBottom: 6, fontFamily: 'Palatino, Georgia, serif' }}>
          Register your NGO
        </h2>
        <p style={{ fontSize: 14, color: '#4A6355' }}>
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
              background:     s <= step ? '#0D2B1E' : '#E4EFE7',
              color:          s <= step ? '#D4AF5C' : '#7A9688',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       12,
              fontWeight:     700,
            }}>
              {s}
            </div>
            <span style={{ fontSize: 12, color: s <= step ? '#0D2B1E' : '#7A9688', fontWeight: s <= step ? 600 : 400 }}>
              {s === 1 ? 'Organisation' : 'Admin Account'}
            </span>
            {s < 2 && <div style={{ width: 24, height: 1, background: '#C8EDD8' }} />}
          </div>
        ))}
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
        {/* Step 1: Organisation */}
        {step === 1 && (
          <div>
            <div style={{
              padding:      '10px 14px',
              borderRadius: 8,
              background:   '#EAF7EE',
              color:        '#1A5C3A',
              fontSize:     13,
              marginBottom: 20,
              fontWeight:   500,
            }}>
              Tell us about your organisation
            </div>

            <div style={fieldStyle}>
              <label htmlFor="orgName" style={labelStyle}>Organisation name <span style={{ color: '#C0392B' }}>*</span></label>
              <input
                id="orgName"
                type="text"
                placeholder="e.g. HealthBridge Ghana"
                style={{ ...inputStyle, borderColor: errors.orgName ? '#C0392B' : '#C8EDD8' }}
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
                style={{ ...inputStyle, borderColor: '#C8EDD8' }}
                {...register('country')}
              />
            </div>

            <div style={{ ...fieldStyle, marginBottom: 24 }}>
              <label htmlFor="registrationNumber" style={labelStyle}>Registration number <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="registrationNumber"
                type="text"
                placeholder="NGO-2024-XXXXX"
                style={{ ...inputStyle, borderColor: '#C8EDD8' }}
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
                background:   '#0D2B1E',
                color:        '#D4AF5C',
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
              background:   '#EAF7EE',
              color:        '#1A5C3A',
              fontSize:     13,
              marginBottom: 20,
              fontWeight:   500,
            }}>
              Create your admin account
            </div>

            <div style={fieldStyle}>
              <label htmlFor="fullName" style={labelStyle}>Your full name <span style={{ color: '#C0392B' }}>*</span></label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="e.g. Amara Osei"
                style={{ ...inputStyle, borderColor: errors.fullName ? '#C0392B' : '#C8EDD8' }}
                {...register('fullName')}
              />
              {errors.fullName && <p style={errorStyle}>{errors.fullName.message}</p>}
            </div>

            <div style={fieldStyle}>
              <label htmlFor="email" style={labelStyle}>Work email <span style={{ color: '#C0392B' }}>*</span></label>
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex:         1,
                  padding:      '11px 16px',
                  borderRadius: 8,
                  border:       '1px solid #C8EDD8',
                  background:   '#FFFFFF',
                  color:        '#2C3E35',
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
                  background:   isSubmitting ? '#4CAF78' : '#0D2B1E',
                  color:        '#D4AF5C',
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
