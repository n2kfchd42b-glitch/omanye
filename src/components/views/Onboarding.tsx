'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, Check, Leaf } from 'lucide-react'
import { OmanyeLogo } from '../Logo'
import { FormField, Input, Select, Textarea } from '../atoms/FormField'
import { useToast } from '../Toast'
import { cn } from '@/lib/utils'
import type { OnboardingData } from '@/lib/types'

const COUNTRIES = [
  { value: 'GH', label: 'Ghana' }, { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' }, { value: 'ET', label: 'Ethiopia' },
  { value: 'UG', label: 'Uganda' }, { value: 'TZ', label: 'Tanzania' },
  { value: 'SN', label: 'Senegal' }, { value: 'CI', label: 'Côte d\'Ivoire' },
  { value: 'ZA', label: 'South Africa' }, { value: 'OTHER', label: 'Other' },
]

const SECTORS = [
  { value: 'health',      label: 'Health & Nutrition' },
  { value: 'education',   label: 'Education' },
  { value: 'wash',        label: 'WASH' },
  { value: 'livelihoods', label: 'Livelihoods & Agriculture' },
  { value: 'protection',  label: 'Protection & Legal' },
  { value: 'emergency',   label: 'Emergency Response' },
  { value: 'environment', label: 'Environment & Climate' },
  { value: 'governance',  label: 'Governance & Rights' },
  { value: 'other',       label: 'Other' },
]

const REGIONS_GH = [
  { value: 'Greater Accra', label: 'Greater Accra' },
  { value: 'Ashanti',       label: 'Ashanti' },
  { value: 'Northern',      label: 'Northern' },
  { value: 'Volta',         label: 'Volta' },
  { value: 'Eastern',       label: 'Eastern' },
  { value: 'Western',       label: 'Western' },
  { value: 'Brong-Ahafo',   label: 'Brong-Ahafo' },
  { value: 'Central',       label: 'Central' },
  { value: 'Upper East',    label: 'Upper East' },
  { value: 'Upper West',    label: 'Upper West' },
]

const STEPS = ['Organisation', 'First Program', 'Invite Team']

interface OnboardingProps {
  onComplete: () => void
}

type StepData = Partial<OnboardingData>

export function Onboarding({ onComplete }: OnboardingProps) {
  const { success } = useToast()
  const [step,    setStep]    = useState(0)
  const [data,    setData]    = useState<StepData>({})
  const [loading, setLoading] = useState(false)
  const [invite,  setInvite]  = useState('')

  const set = (key: keyof OnboardingData, val: string) =>
    setData(d => ({ ...d, [key]: val }))

  const canAdvance = () => {
    if (step === 0) return !!(data.orgName && data.country && data.sector)
    if (step === 1) return !!(data.progName && data.progRegion)
    return true
  }

  const advance = () => {
    if (step < 2) { setStep(s => s + 1); return }
    setLoading(true)
    setTimeout(() => {
      success('Workspace ready!', `Welcome to OMANYE, ${data.orgName ?? 'your organization'}.`)
      onComplete()
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-snow flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <OmanyeLogo size="lg" variant="light" showTagline className="mb-10" />

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card-md border border-mist/60">
        {/* Progress stepper */}
        <div className="flex items-center px-6 pt-6 pb-5 border-b border-mist gap-0">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i < step  ? 'bg-moss text-white' :
                  i === step ? 'bg-moss text-white ring-4 ring-moss/20' :
                               'bg-mist text-fern/50'
                )}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  i === step ? 'text-moss' : 'text-fern/40'
                )}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mb-4 transition-colors',
                  i < step ? 'bg-moss' : 'bg-mist'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-6 space-y-4">
          {step === 0 && (
            <>
              <div>
                <h2 className="font-fraunces text-xl font-semibold text-forest mb-1">
                  Set up your workspace
                </h2>
                <p className="text-sm text-fern/60">Tell us about your organisation to get started.</p>
              </div>
              <FormField label="Organisation name" required htmlFor="orgName">
                <Input
                  id="orgName"
                  placeholder="e.g. OMANYE Field Office"
                  value={data.orgName ?? ''}
                  onChange={e => set('orgName', e.target.value)}
                />
              </FormField>
              <FormField label="Primary country of operation" required htmlFor="country">
                <Select
                  id="country"
                  options={COUNTRIES}
                  placeholder="Select country…"
                  value={data.country ?? ''}
                  onChange={e => set('country', e.target.value)}
                />
              </FormField>
              <FormField label="Primary sector" required htmlFor="sector">
                <Select
                  id="sector"
                  options={SECTORS}
                  placeholder="Select sector…"
                  value={data.sector ?? ''}
                  onChange={e => set('sector', e.target.value)}
                />
              </FormField>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <h2 className="font-fraunces text-xl font-semibold text-forest mb-1">
                  Create your first program
                </h2>
                <p className="text-sm text-fern/60">You can add more programs after setup.</p>
              </div>
              <FormField label="Program name" required htmlFor="progName">
                <Input
                  id="progName"
                  placeholder="e.g. Clean Water Initiative – Volta"
                  value={data.progName ?? ''}
                  onChange={e => set('progName', e.target.value)}
                />
              </FormField>
              <FormField label="Primary region" required htmlFor="progRegion">
                <Select
                  id="progRegion"
                  options={REGIONS_GH}
                  placeholder="Select region…"
                  value={data.progRegion ?? ''}
                  onChange={e => set('progRegion', e.target.value)}
                />
              </FormField>
              <FormField label="Brief description" htmlFor="desc">
                <Textarea
                  id="desc"
                  placeholder="What does this program aim to achieve?"
                  rows={3}
                />
              </FormField>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="font-fraunces text-xl font-semibold text-forest mb-1">
                  Invite your team
                </h2>
                <p className="text-sm text-fern/60">
                  Add team members by email. You can always do this later.
                </p>
              </div>
              <FormField label="Email addresses" htmlFor="invite" hint="Separate multiple emails with commas">
                <Textarea
                  id="invite"
                  placeholder="colleague@org.org, fieldworker@org.org"
                  rows={4}
                  value={invite}
                  onChange={e => setInvite(e.target.value)}
                />
              </FormField>

              <div className="rounded-xl bg-foam border border-mist p-4 flex gap-3">
                <Leaf size={16} className="text-fern flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-forest">You're almost there</p>
                  <p className="text-xs text-fern/70 mt-0.5">
                    Your workspace for <strong>{data.orgName}</strong> is ready.
                    Click <em>Launch workspace</em> to begin.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="inline-flex items-center gap-1.5 text-sm text-fern hover:text-moss transition-colors"
            >
              <ChevronLeft size={15} /> Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={onComplete}
                className="text-sm text-fern/60 hover:text-fern transition-colors"
              >
                Skip &amp; launch
              </button>
            )}
            <button
              onClick={advance}
              disabled={!canAdvance() || loading}
              className={cn(
                'inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                canAdvance() && !loading
                  ? 'bg-moss text-white hover:bg-fern'
                  : 'bg-mist text-fern/40 cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Launching…
                </span>
              ) : step < 2 ? (
                <>Continue <ChevronRight size={15} /></>
              ) : (
                <>Launch workspace <ChevronRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-fern/40 text-center">
        OMANYE NGO Workspace · Built for field teams
      </p>
    </div>
  )
}
