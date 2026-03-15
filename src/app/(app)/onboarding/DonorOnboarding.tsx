'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { completeDonorOnboarding } from '@/app/actions/auth'

const step1Schema = z.object({
  fullName:     z.string().min(2, 'Full name is required'),
  avatarUrl:    z.string().url('Enter a valid URL').optional().or(z.literal('')),
  donorOrgName: z.string().min(1, 'Organisation name is required'),
})

type Step1 = z.infer<typeof step1Schema>

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1px solid #C8EDD8',
  borderRadius: 8, fontSize: 14, color: '#0F1A14', background: '#FFFFFF',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E35', marginBottom: 5,
}
const fieldStyle: React.CSSProperties = { marginBottom: 16 }
const errorStyle: React.CSSProperties = { fontSize: 12, color: '#C0392B', marginTop: 3 }

interface Props {
  userId:      string
  initialName: string
}

export function DonorOnboarding({ userId, initialName }: Props) {
  const [step, setStep]               = useState<1 | 2>(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step1Data, setStep1Data]     = useState<Step1 | null>(null)

  const form = useForm<Step1>({
    resolver:      zodResolver(step1Schema),
    defaultValues: { fullName: initialName, avatarUrl: '', donorOrgName: '' },
  })

  const handleStep1 = form.handleSubmit(data => {
    setStep1Data(data)
    setStep(2)
  })

  const handleFinish = async () => {
    if (!step1Data) return
    setServerError(null)

    const result = await completeDonorOnboarding({
      userId,
      fullName:     step1Data.fullName,
      avatarUrl:    step1Data.avatarUrl || undefined,
      donorOrgName: step1Data.donorOrgName,
    })

    if (result?.error) setServerError(result.error)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F4FAF6',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: '#0D2B1E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Palatino, Georgia, serif', fontWeight: 700, fontSize: 18, color: '#D4AF5C' }}>O</div>
            <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0D2B1E' }}>OMANYE</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F1A14', fontFamily: 'Palatino, Georgia, serif', marginBottom: 6 }}>
            Welcome to your Donor Portal
          </h1>
          <p style={{ fontSize: 14, color: '#4A6355' }}>
            Track impact for the programmes you fund
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {['Your Profile', 'How It Works'].map((label, i) => {
            const s = i + 1
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: s < step ? '#4CAF78' : s === step ? '#0D2B1E' : '#E4EFE7',
                    color:      s < step ? '#FFFFFF' : s === step ? '#D4AF5C' : '#7A9688',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  }}>
                    {s < step ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 11, color: s === step ? '#0D2B1E' : '#7A9688', fontWeight: s === step ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i === 0 && <div style={{ width: 48, height: 1, background: step > 1 ? '#4CAF78' : '#C8EDD8', margin: '0 4px', marginBottom: 18 }} />}
              </div>
            )
          })}
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 3px rgba(13,43,30,0.06)', padding: 28 }}>
          {serverError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
              {serverError}
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>Confirm your profile</h2>
                <p style={{ fontSize: 13, color: '#4A6355' }}>NGOs will see this when reviewing your access requests</p>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="fullName" style={labelStyle}>Full name <span style={{ color: '#C0392B' }}>*</span></label>
                <input id="fullName" type="text" style={{ ...inputStyle, borderColor: form.formState.errors.fullName ? '#C0392B' : '#C8EDD8' }} {...form.register('fullName')} />
                {form.formState.errors.fullName && <p style={errorStyle}>{form.formState.errors.fullName.message}</p>}
              </div>

              <div style={fieldStyle}>
                <label htmlFor="donorOrgName" style={labelStyle}>Your organisation <span style={{ color: '#C0392B' }}>*</span></label>
                <input id="donorOrgName" type="text" placeholder="e.g. GIZ, USAID, Gates Foundation" style={{ ...inputStyle, borderColor: form.formState.errors.donorOrgName ? '#C0392B' : '#C8EDD8' }} {...form.register('donorOrgName')} />
                {form.formState.errors.donorOrgName && <p style={errorStyle}>{form.formState.errors.donorOrgName.message}</p>}
              </div>

              <div style={{ ...fieldStyle, marginBottom: 24 }}>
                <label htmlFor="avatarUrl" style={labelStyle}>Avatar URL <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="avatarUrl" type="url" placeholder="https://…/photo.jpg" style={inputStyle} {...form.register('avatarUrl')} />
                {form.formState.errors.avatarUrl && <p style={errorStyle}>{form.formState.errors.avatarUrl.message}</p>}
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#0D2B1E', color: '#D4AF5C', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Continue →
              </button>
            </form>
          )}

          {/* Step 2: Explainer */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>How your donor portal works</h2>
                <p style={{ fontSize: 13, color: '#4A6355' }}>You&apos;re set up — here&apos;s what to expect</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
                {[
                  {
                    icon:  '🤝',
                    title: 'NGOs connect you to programmes',
                    desc:  'When an NGO grants you access, their programmes will appear in your portal with the data they\'ve chosen to share.',
                  },
                  {
                    icon:  '📬',
                    title: 'Request access yourself',
                    desc:  'You can find NGO programmes and submit access requests. The NGO\'s admin reviews and approves or denies each request.',
                  },
                  {
                    icon:  '🔒',
                    title: 'Access is granular',
                    desc:  'NGOs control exactly what you see — summary only, indicators, budget data, or full programme details.',
                  },
                  {
                    icon:  '📊',
                    title: 'Real impact data',
                    desc:  'See live KPI progress, budget utilisation, field reports, and donor reports as the NGO publishes them.',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: '#F4FAF6', borderRadius: 10 }}>
                    <span style={{ fontSize: 22, lineHeight: 1.3, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1A14', marginBottom: 3 }}>{title}</div>
                      <div style={{ fontSize: 13, color: '#4A6355', lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #C8EDD8', background: '#FFFFFF', color: '#2C3E35', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button
                  type="button"
                  onClick={handleFinish}
                  style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: '#0D2B1E', color: '#D4AF5C', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Go to Donor Portal →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
