'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { completeNGOOnboarding, inviteTeamMember } from '@/app/actions/auth'

// ── Schemas ───────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  logoUrl:     z.string().url('Enter a valid URL').optional().or(z.literal('')),
  website:     z.string().url('Enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Max 500 characters').optional(),
})

const step2Schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  jobTitle: z.string().optional(),
  avatarUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

const step3Schema = z.object({
  inviteName:  z.string().optional(),
  inviteEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  inviteRole:  z.enum(['NGO_STAFF', 'NGO_VIEWER']).optional(),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

// ── Styles ────────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId:      string
  orgId:       string
  orgSlug:     string
  orgName:     string
  initialName: string
}

export function NGOOnboarding({ userId, orgId, orgSlug, orgName, initialName }: Props) {
  const [step, setStep]             = useState<1 | 2 | 3>(1)
  const [serverError, setServerError] = useState<string | null>(null)
  const [step1Data, setStep1Data]   = useState<Step1>({})
  const [step2Data, setStep2Data]   = useState<Step2>({ fullName: initialName })

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { logoUrl: '', website: '', description: '' } })
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { fullName: initialName, jobTitle: '', avatarUrl: '' } })
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { inviteName: '', inviteEmail: '', inviteRole: 'NGO_STAFF' } })

  const handleStep1 = form1.handleSubmit(data => {
    setStep1Data(data)
    setStep(2)
  })

  const handleStep2 = form2.handleSubmit(data => {
    setStep2Data(data)
    setStep(3)
  })

  const handleFinish = form3.handleSubmit(async (data) => {
    setServerError(null)

    // Optionally send invite
    if (data.inviteEmail && data.inviteName) {
      await inviteTeamMember({
        email:          data.inviteEmail,
        fullName:       data.inviteName,
        role:           data.inviteRole ?? 'NGO_STAFF',
        organizationId: orgId,
      })
    }

    const result = await completeNGOOnboarding({
      userId,
      orgId,
      orgSlug,
      logoUrl:     step1Data.logoUrl     || undefined,
      website:     step1Data.website     || undefined,
      description: step1Data.description || undefined,
      fullName:    step2Data.fullName,
      jobTitle:    step2Data.jobTitle    || undefined,
      avatarUrl:   step2Data.avatarUrl   || undefined,
    })

    if (result?.error) setServerError(result.error)
  })

  const STEPS = ['Organisation', 'Your Profile', 'Invite Team']

  return (
    <div style={{
      minHeight:       '100vh',
      background:      '#F4FAF6',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, background: '#0D2B1E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Palatino, Georgia, serif', fontWeight: 700, fontSize: 18, color: '#D4AF5C',
            }}>O</div>
            <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0D2B1E' }}>
              OMANYE
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F1A14', fontFamily: 'Palatino, Georgia, serif', marginBottom: 6 }}>
            Set up {orgName}
          </h1>
          <p style={{ fontSize: 14, color: '#4A6355' }}>
            A few details to get your workspace ready
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
          {STEPS.map((label, i) => {
            const s = i + 1
            const active  = s === step
            const done    = s < step
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? '#4CAF78' : active ? '#0D2B1E' : '#E4EFE7',
                    color:      done ? '#FFFFFF' : active ? '#D4AF5C' : '#7A9688',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 11, color: active ? '#0D2B1E' : '#7A9688', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 48, height: 1, background: done ? '#4CAF78' : '#C8EDD8', margin: '0 4px', marginBottom: 18 }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF', borderRadius: 16,
          boxShadow: '0 1px 3px rgba(13,43,30,0.06), 0 1px 2px -1px rgba(13,43,30,0.04)',
          padding: 28,
        }}>
          {serverError && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
              {serverError}
            </div>
          )}

          {/* ── Step 1: Org details ───────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleStep1} noValidate>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>Organisation details</h2>
                <p style={{ fontSize: 13, color: '#4A6355' }}>Add a logo and brief description for your workspace</p>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="logoUrl" style={labelStyle}>Logo URL <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="logoUrl" type="url" placeholder="https://yourorg.org/logo.png" style={inputStyle} {...form1.register('logoUrl')} />
                {form1.formState.errors.logoUrl && <p style={errorStyle}>{form1.formState.errors.logoUrl.message}</p>}
              </div>

              <div style={fieldStyle}>
                <label htmlFor="website" style={labelStyle}>Website <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="website" type="url" placeholder="https://yourorg.org" style={inputStyle} {...form1.register('website')} />
                {form1.formState.errors.website && <p style={errorStyle}>{form1.formState.errors.website.message}</p>}
              </div>

              <div style={{ ...fieldStyle, marginBottom: 24 }}>
                <label htmlFor="description" style={labelStyle}>Organisation description <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="A brief description of your NGO's mission and work…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  {...form1.register('description')}
                />
                {form1.formState.errors.description && <p style={errorStyle}>{form1.formState.errors.description.message}</p>}
              </div>

              <button type="submit" style={{ width: '100%', padding: '11px 16px', borderRadius: 8, border: 'none', background: '#0D2B1E', color: '#D4AF5C', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Continue →
              </button>
            </form>
          )}

          {/* ── Step 2: Admin profile ─────────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleStep2} noValidate>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>Your profile</h2>
                <p style={{ fontSize: 13, color: '#4A6355' }}>How should your team see you?</p>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="fullName" style={labelStyle}>Full name <span style={{ color: '#C0392B' }}>*</span></label>
                <input id="fullName" type="text" style={{ ...inputStyle, borderColor: form2.formState.errors.fullName ? '#C0392B' : '#C8EDD8' }} {...form2.register('fullName')} />
                {form2.formState.errors.fullName && <p style={errorStyle}>{form2.formState.errors.fullName.message}</p>}
              </div>

              <div style={fieldStyle}>
                <label htmlFor="jobTitle" style={labelStyle}>Job title <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="jobTitle" type="text" placeholder="e.g. Programme Director" style={inputStyle} {...form2.register('jobTitle')} />
              </div>

              <div style={{ ...fieldStyle, marginBottom: 24 }}>
                <label htmlFor="avatarUrl" style={labelStyle}>Avatar URL <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="avatarUrl" type="url" placeholder="https://yourorg.org/avatar.jpg" style={inputStyle} {...form2.register('avatarUrl')} />
                {form2.formState.errors.avatarUrl && <p style={errorStyle}>{form2.formState.errors.avatarUrl.message}</p>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #C8EDD8', background: '#FFFFFF', color: '#2C3E35', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: '#0D2B1E', color: '#D4AF5C', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Continue →</button>
              </div>
            </form>
          )}

          {/* ── Step 3: Invite team member ────────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleFinish} noValidate>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>Invite your first team member</h2>
                <p style={{ fontSize: 13, color: '#4A6355' }}>This step is optional — you can invite more people later from Team settings</p>
              </div>

              <div style={fieldStyle}>
                <label htmlFor="inviteName" style={labelStyle}>Name <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="inviteName" type="text" placeholder="e.g. Abena Mensah" style={inputStyle} {...form3.register('inviteName')} />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="inviteEmail" style={labelStyle}>Email <span style={{ color: '#7A9688', fontWeight: 400 }}>(optional)</span></label>
                <input id="inviteEmail" type="email" placeholder="colleague@organisation.org" style={inputStyle} {...form3.register('inviteEmail')} />
                {form3.formState.errors.inviteEmail && <p style={errorStyle}>{form3.formState.errors.inviteEmail.message}</p>}
              </div>

              <div style={{ ...fieldStyle, marginBottom: 24 }}>
                <label htmlFor="inviteRole" style={labelStyle}>Role</label>
                <select id="inviteRole" style={inputStyle} {...form3.register('inviteRole')}>
                  <option value="NGO_STAFF">Staff — can edit programs and upload data</option>
                  <option value="NGO_VIEWER">Viewer — read-only access (board member, auditor)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(2)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #C8EDD8', background: '#FFFFFF', color: '#2C3E35', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
                <button
                  type="submit"
                  disabled={form3.formState.isSubmitting}
                  style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none', background: form3.formState.isSubmitting ? '#4CAF78' : '#0D2B1E', color: '#D4AF5C', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  {form3.formState.isSubmitting ? 'Setting up…' : 'Go to Dashboard →'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleFinish()}
                style={{ width: '100%', marginTop: 10, padding: '9px', borderRadius: 8, border: 'none', background: 'transparent', color: '#4A6355', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Skip — I&apos;ll invite people later
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
