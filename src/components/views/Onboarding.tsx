'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Database, BarChart2, FileText, Map } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { OmanyeLogo } from '@/components/Logo'
import { FormField, Input, Select } from '@/components/atoms/FormField'
import type { User, UserRole } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'Project Lead', label: 'Project Lead'  },
  { value: 'M&E Officer',  label: 'M&E Officer'   },
  { value: 'Field Staff',  label: 'Field Staff'   },
  { value: 'Supervisor',   label: 'Supervisor'    },
  { value: 'Donor',        label: 'Donor'         },
  { value: 'Admin',        label: 'Admin'         },
  { value: 'Viewer',       label: 'Viewer'        },
]

const FEATURES = [
  {
    icon: Database,
    title: 'Data Collection',
    description: 'Connect KoBoToolbox, REDCap, ODK Central, or upload CSV datasets.',
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description: 'Run descriptive, trend, and impact analyses on your program data.',
  },
  {
    icon: FileText,
    title: 'Documents',
    description: 'Manage logframes, reports, proposals, and share with your team.',
  },
  {
    icon: Map,
    title: 'Field Map',
    description: 'Visualize program activities and beneficiary coverage geographically.',
  },
]

// ── Dot-grid SVG background ───────────────────────────────────────────────────

function DotGrid() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(125,212,160,0.10)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}

// ── Step pill indicator ───────────────────────────────────────────────────────

function StepPills({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            height: 6,
            borderRadius: 99,
            transition: 'width 0.25s ease, background 0.2s',
            width: i === step ? 28 : 8,
            background: i === step ? COLORS.sage : 'rgba(125,212,160,0.25)',
          }}
        />
      ))}
    </div>
  )
}

// ── Onboarding ────────────────────────────────────────────────────────────────

interface OnboardingProps {
  onComplete: (user: User) => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)

  // Step 1 fields
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')

  // Step 2 fields
  const [org,  setOrg]  = useState('')
  const [role, setRole] = useState<UserRole>('Project Lead')

  const canNext = step === 0
    ? name.trim().length > 0 && email.includes('@')
    : step === 1
      ? org.trim().length > 0
      : true

  function handleNext() {
    if (step < 2) { setStep(s => s + 1); return }
    onComplete({ name: name.trim(), email: email.trim(), org: org.trim(), role })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: COLORS.forest,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <DotGrid />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <OmanyeLogo size="md" variant="dark" showTagline />
        </div>

        {/* Step pills */}
        <StepPills step={step} />

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(125,212,160,0.15)',
            borderRadius: 20,
            padding: '32px 32px',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Step 1: Name + Email */}
          {step === 0 && (
            <div className="fade-up">
              <h2 style={{
                fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600,
                color: '#ffffff', marginBottom: 6,
              }}>
                Welcome to OMANYE
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(125,212,160,0.65)', marginBottom: 24, lineHeight: 1.5 }}>
                Let's set up your workspace. Start with your personal details.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Full name" required htmlFor="ob-name">
                  <Input
                    id="ob-name"
                    placeholder="e.g. Amara Osei"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </FormField>
                <FormField label="Work email" required htmlFor="ob-email">
                  <Input
                    id="ob-email"
                    type="email"
                    placeholder="you@organisation.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 2: Org + Role */}
          {step === 1 && (
            <div className="fade-up">
              <h2 style={{
                fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600,
                color: '#ffffff', marginBottom: 6,
              }}>
                Your organisation
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(125,212,160,0.65)', marginBottom: 24, lineHeight: 1.5 }}>
                Tell us about your organisation and your role.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Organisation name" required htmlFor="ob-org">
                  <Input
                    id="ob-org"
                    placeholder="e.g. OMANYE Field Office"
                    value={org}
                    onChange={e => setOrg(e.target.value)}
                  />
                </FormField>
                <FormField label="Your role" required htmlFor="ob-role">
                  <Select
                    id="ob-role"
                    options={ROLES}
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Step 3: Feature cards + CTA */}
          {step === 2 && (
            <div className="fade-up">
              <h2 style={{
                fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600,
                color: '#ffffff', marginBottom: 6,
              }}>
                Everything you need
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(125,212,160,0.65)', marginBottom: 24, lineHeight: 1.5 }}>
                Your workspace for <strong style={{ color: COLORS.mint }}>{org}</strong> is ready.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
                {FEATURES.map((f, i) => {
                  const Icon = f.icon
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(125,212,160,0.12)',
                        borderRadius: 12,
                        padding: '14px 14px',
                      }}
                    >
                      <Icon size={16} style={{ color: COLORS.sage, marginBottom: 8 }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>{f.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(125,212,160,0.55)', lineHeight: 1.5 }}>{f.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, color: 'rgba(125,212,160,0.60)',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.mint)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(125,212,160,0.60)')}
              >
                <ChevronLeft size={14} /> Back
              </button>
            ) : <span />}

            <button
              onClick={handleNext}
              disabled={!canNext}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 22px',
                borderRadius: 10,
                background: canNext ? COLORS.sage : 'rgba(125,212,160,0.15)',
                color: canNext ? COLORS.forest : 'rgba(125,212,160,0.35)',
                fontSize: 13, fontWeight: 700,
                cursor: canNext ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {step === 2 ? 'Enter Workspace' : 'Continue'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(125,212,160,0.30)' }}>
          OMANYE NGO Workspace · Built for field teams
        </p>
      </div>
    </div>
  )
}
