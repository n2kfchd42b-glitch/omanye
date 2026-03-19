'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, CheckCircle } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { updateDonorProfile } from '@/app/actions/auth'

interface Props {
  fullName:         string
  email:            string
  organizationName: string
  contactEmail:     string
  website:          string
}

export default function DonorProfileClient({ fullName, email, organizationName, contactEmail, website }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    fullName,
    organizationName,
    contactEmail,
    website,
  })

  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasChanges =
    form.fullName !== fullName ||
    form.organizationName !== organizationName ||
    form.contactEmail !== contactEmail ||
    form.website !== website

  function handleChange(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(false)
  }

  function handleSave() {
    if (!form.fullName.trim()) { setError('Full name is required.'); return }
    if (!form.contactEmail.trim()) { setError('Contact email is required.'); return }

    startTransition(async () => {
      const result = await updateDonorProfile({
        fullName:     form.fullName.trim(),
        donorOrgName: form.organizationName.trim(),
        contactEmail: form.contactEmail.trim(),
        website:      form.website.trim(),
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    })
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px' }}>
        Profile & Settings
      </h1>
      <p style={{ fontSize: 13, color: COLORS.stone, margin: '0 0 32px' }}>
        Manage your donor account information. NGOs will see your name and organisation when you access their programmes.
      </p>

      <div style={{
        background: COLORS.pearl, border: `1px solid ${COLORS.mist}`,
        borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Full Name */}
        <FieldGroup label="Full Name" required>
          <input
            type="text"
            value={form.fullName}
            onChange={e => handleChange('fullName', e.target.value)}
            style={inputStyle}
            placeholder="Your full name"
          />
        </FieldGroup>

        {/* Auth Email (read-only) */}
        <FieldGroup label="Login Email" hint="This is your authentication email and cannot be changed here.">
          <input
            type="email"
            value={email}
            disabled
            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
          />
        </FieldGroup>

        {/* Contact Email */}
        <FieldGroup label="Contact Email" hint="Email visible to NGOs for communication." required>
          <input
            type="email"
            value={form.contactEmail}
            onChange={e => handleChange('contactEmail', e.target.value)}
            style={inputStyle}
            placeholder="contact@example.com"
          />
        </FieldGroup>

        {/* Organisation Name */}
        <FieldGroup label="Donor Organisation">
          <input
            type="text"
            value={form.organizationName}
            onChange={e => handleChange('organizationName', e.target.value)}
            style={inputStyle}
            placeholder="e.g. GIZ, USAID, Ford Foundation"
          />
        </FieldGroup>

        {/* Website */}
        <FieldGroup label="Website">
          <input
            type="url"
            value={form.website}
            onChange={e => handleChange('website', e.target.value)}
            style={inputStyle}
            placeholder="https://example.org"
          />
        </FieldGroup>

        {/* Error / Success */}
        {error && (
          <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>{error}</p>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#38A169' }}>
            <CheckCircle size={14} /> Profile updated successfully.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: hasChanges ? COLORS.gold : COLORS.mist,
              color: hasChanges ? COLORS.forest : COLORS.stone,
              fontWeight: 600, fontSize: 14,
              cursor: hasChanges && !isPending ? 'pointer' : 'not-allowed',
              opacity: isPending ? 0.7 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldGroup({ label, hint, required, children }: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.slate, marginBottom: 6 }}>
        {label} {required && <span style={{ color: COLORS.crimson }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: COLORS.stone, margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: `1px solid ${COLORS.mist}`,
  background: COLORS.foam,
  color: '#FFFFFF',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}
