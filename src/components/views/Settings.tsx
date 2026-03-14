'use client'

import React, { useState } from 'react'
import { User as UserIcon, Building2, Bell, Shield, CreditCard } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { FormField, Input, Select } from '@/components/atoms/FormField'
import { EmptyState } from '@/components/atoms/EmptyState'
import { useToast } from '@/components/Toast'
import type { User, UserRole, NotifPrefs } from '@/lib/types'

// ── Nav sidebar ───────────────────────────────────────────────────────────────

type SettingsSection = 'profile' | 'organisation' | 'notifications' | 'security' | 'billing'

interface SectionDef { id: SettingsSection; label: string; icon: React.ElementType }

const SECTIONS: SectionDef[] = [
  { id: 'profile',       label: 'Profile',       icon: UserIcon   },
  { id: 'organisation',  label: 'Organisation',  icon: Building2  },
  { id: 'notifications', label: 'Notifications', icon: Bell       },
  { id: 'security',      label: 'Security',      icon: Shield     },
  { id: 'billing',       label: 'Billing',       icon: CreditCard },
]

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Project Lead', label: 'Project Lead' },
  { value: 'M&E Officer',  label: 'M&E Officer'  },
  { value: 'Field Staff',  label: 'Field Staff'  },
  { value: 'Supervisor',   label: 'Supervisor'   },
  { value: 'Donor',        label: 'Donor'        },
  { value: 'Admin',        label: 'Admin'        },
  { value: 'Viewer',       label: 'Viewer'       },
]

// ── Settings view ─────────────────────────────────────────────────────────────

interface SettingsProps {
  user:    User
  setUser: (u: User) => void
}

export function Settings({ user, setUser }: SettingsProps) {
  const [section, setSection] = useState<SettingsSection>('profile')

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Settings</h2>
        <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>Manage your workspace preferences</p>
      </div>

      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Nav sidebar */}
        <div className="card" style={{ padding: 8, overflow: 'hidden' }}>
          {SECTIONS.map(s => {
            const Icon = s.icon
            const active = section === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, textAlign: 'left',
                  background: active ? COLORS.foam : 'transparent',
                  color: active ? COLORS.forest : COLORS.stone,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = COLORS.snow }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={14} style={{ flexShrink: 0, color: active ? COLORS.fern : COLORS.stone }} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="card" style={{ padding: 28 }}>
          {section === 'profile'       && <ProfileSection       user={user} setUser={setUser} />}
          {section === 'organisation'  && <OrganisationSection  user={user} />}
          {section === 'notifications' && <NotificationsSection />}
          {section === 'security'      && <ComingSoonSection label="Security" />}
          {section === 'billing'       && <ComingSoonSection label="Billing" />}
        </div>
      </div>
    </div>
  )
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const { success } = useToast()
  const [name,  setName]  = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role,  setRole]  = useState<UserRole>(user.role)

  function handleSave() {
    setUser({ ...user, name: name.trim() || user.name, email: email.trim() || user.email, role })
    success('Profile updated')
  }

  const dirty = name !== user.name || email !== user.email || role !== user.role

  return (
    <div>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 20 }}>Profile</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Full name" required htmlFor="sp-name">
          <Input id="sp-name" value={name} onChange={e => setName(e.target.value)} />
        </FormField>
        <FormField label="Email address" required htmlFor="sp-email">
          <Input id="sp-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Role" htmlFor="sp-role">
          <Select id="sp-role" options={ROLE_OPTIONS} value={role} onChange={e => setRole(e.target.value as UserRole)} />
        </FormField>
        <div style={{ paddingTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: dirty ? COLORS.moss : COLORS.mist,
              color: dirty ? '#fff' : COLORS.stone,
              cursor: dirty ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Organisation section ──────────────────────────────────────────────────────

function OrganisationSection({ user }: { user: User }) {
  const { success } = useToast()
  const [org, setOrg] = useState(user.org)

  return (
    <div>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 20 }}>Organisation</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Organisation name" required htmlFor="so-org">
          <Input id="so-org" value={org} onChange={e => setOrg(e.target.value)} />
        </FormField>
        <div style={{ paddingTop: 8 }}>
          <button
            onClick={() => success('Organisation updated')}
            style={{
              padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: COLORS.moss, color: '#fff', cursor: 'pointer',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Notifications section ─────────────────────────────────────────────────────

function NotificationsSection() {
  const { success } = useToast()
  const [prefs, setPrefs] = useState<NotifPrefs>({
    submissions:   true,
    weeklyDigest:  true,
    milestones:    true,
    teamActivity:  false,
    donorReports:  false,
  })

  const TOGGLES: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'submissions',  label: 'Data Submissions',   desc: 'Notify when new form submissions arrive'     },
    { key: 'weeklyDigest', label: 'Weekly Digest',      desc: 'Summary of program activity each Monday'     },
    { key: 'milestones',   label: 'Program Milestones', desc: 'Alerts for deadline and budget milestones'   },
    { key: 'teamActivity', label: 'Team Activity',      desc: 'When team members join or update records'    },
    { key: 'donorReports', label: 'Donor Reports Due',  desc: 'Reminders 7 days before report deadlines'   },
  ]

  function toggle(key: keyof NotifPrefs) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 20 }}>Notifications</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {TOGGLES.map((t, i) => (
          <div
            key={t.key}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0',
              borderTop: i > 0 ? `1px solid ${COLORS.mist}` : 'none',
            }}
          >
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.forest }}>{t.label}</p>
              <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{t.desc}</p>
            </div>
            <Toggle checked={prefs[t.key]} onChange={() => toggle(t.key)} />
          </div>
        ))}
      </div>
      <div style={{ paddingTop: 20 }}>
        <button
          onClick={() => success('Notification preferences saved')}
          style={{
            padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: COLORS.moss, color: '#fff', cursor: 'pointer',
          }}
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 40, height: 22, borderRadius: 11, padding: 2,
        background: checked ? COLORS.sage : COLORS.mist,
        display: 'flex', alignItems: 'center',
        cursor: 'pointer', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transform: checked ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}

// ── Coming soon ───────────────────────────────────────────────────────────────

function ComingSoonSection({ label }: { label: string }) {
  return (
    <div>
      <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.forest, marginBottom: 20 }}>{label}</h3>
      <EmptyState title="Coming soon" description={`${label} settings will be available in a future update.`} compact />
    </div>
  )
}
