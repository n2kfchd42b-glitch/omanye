'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Upload, AlertTriangle, X, CreditCard, TrendingUp, ExternalLink } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { PlanBadge } from '@/components/billing/PlanBadge'
import type { SubscriptionResponse, Subscription } from '@/types/billing'
import type { SubscriptionTier } from '@/lib/supabase/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgRow {
  id:                  string
  name:                string
  slug:                string
  logo_url:            string | null
  country:             string | null
  registration_number: string | null
  website:             string | null
  description:         string | null
  subscription_tier:   string
  created_at:          string
  updated_at:          string
}

interface Props {
  org:           OrgRow
  userRole:      'NGO_ADMIN' | 'NGO_STAFF' | 'NGO_VIEWER'
  currentUserId: string
  orgSlug:       string
  memberCount:   number
  programCount:  number
  teamMembers:   { id: string; full_name: string | null; role: string }[]
}


const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '9px 12px',
  border:       `1px solid ${COLORS.mist}`,
  borderRadius: 8,
  fontSize:     14,
  color:        COLORS.ink,
  background:   '#ffffff',
  outline:      'none',
  boxSizing:    'border-box',
  fontFamily:   FONTS.body,
}

// ── OrgSettingsClient ─────────────────────────────────────────────────────────

export default function OrgSettingsClient({
  org, userRole, currentUserId, orgSlug, memberCount, programCount, teamMembers,
}: Props) {
  const router  = useRouter()
  const isAdmin = userRole === 'NGO_ADMIN'

  const [tab, setTab] = useState<'general' | 'profile' | 'billing' | 'danger'>('general')
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          background: toast.ok ? COLORS.forest : COLORS.crimson,
          color: '#ffffff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 500, boxShadow: SHADOW.toast,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
          Organization Settings
        </h1>
        <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>{org.name}</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.mist}`, marginBottom: 32 }}>
        {(isAdmin
          ? ['general', 'profile', 'billing', 'danger'] as const
          : ['general', 'profile', 'billing'] as const
        ).map(t => (
          <button
            key={t}
            onClick={() => setTab(t as typeof tab)}
            style={{
              padding: '10px 20px',
              fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? COLORS.forest : COLORS.stone,
              borderBottom: tab === t
                ? (t === 'danger' ? `2px solid ${COLORS.crimson}` : `2px solid ${COLORS.forest}`)
                : '2px solid transparent',
              marginBottom: -2, cursor: 'pointer',
              background: 'transparent', fontFamily: FONTS.body,
              textTransform: 'capitalize',
              color2: t === 'danger' ? COLORS.crimson : (tab === t ? COLORS.forest : COLORS.stone),
            } as React.CSSProperties}
          >
            <span style={{ color: t === 'danger' ? COLORS.crimson : undefined }}>
              {t === 'danger' ? 'Danger Zone' : t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <GeneralTab org={org} isAdmin={isAdmin} onSave={() => { router.refresh(); showToast('Settings saved') }} onError={showToast} />
      )}
      {tab === 'profile' && (
        <ProfileTab org={org} isAdmin={isAdmin} onSave={() => { router.refresh(); showToast('Profile saved') }} onError={showToast} />
      )}
      {tab === 'billing' && (
        <BillingTab org={org} orgSlug={orgSlug} />
      )}
      {tab === 'danger' && isAdmin && (
        <DangerTab
          org={org}
          currentUserId={currentUserId}
          teamMembers={teamMembers}
          onTransferSuccess={() => { router.refresh(); showToast('Ownership transferred') }}
          onDeleteSuccess={() => router.replace('/login')}
          onError={showToast}
        />
      )}
    </div>
  )
}

// ── GeneralTab ────────────────────────────────────────────────────────────────

function GeneralTab({ org, isAdmin, onSave, onError }: {
  org:     OrgRow; isAdmin: boolean
  onSave:  () => void
  onError: (msg: string, ok?: boolean) => void
}) {
  const supabase = createClient()
  const [name,    setName]    = useState(org.name)
  const [slug,    setSlug]    = useState(org.slug)
  const [country, setCountry] = useState(org.country ?? '')
  const [regNum,  setRegNum]  = useState(org.registration_number ?? '')
  const [website, setWebsite] = useState(org.website ?? '')
  const [loading, setLoading] = useState(false)
  const slugChanged = slug !== org.slug

  async function handleSave() {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = supabase
      const { error } = await db
        .from('organizations')
        .update({ name, slug, country: country || null, registration_number: regNum || null, website: website || null })
        .eq('id', org.id)
      if (error) { onError(error.message, false); return }
      onSave()
      if (slugChanged) {
        window.location.href = `/org/${slug}/settings`
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SettingsField label="Organization Name" disabled={!isAdmin}>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} disabled={!isAdmin} />
      </SettingsField>

      <SettingsField
        label="Organization Slug"
        hint={slugChanged ? '⚠️ Changing the slug will update your URL. Bookmarks and shared links will break.' : 'Used in your organization URL: /org/[slug]'}
        disabled={!isAdmin}
      >
        <input
          style={{
            ...inputStyle,
            borderColor: slugChanged ? COLORS.amber : COLORS.mist,
            background: !isAdmin ? COLORS.foam : '#ffffff',
          }}
          value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
          disabled={!isAdmin}
        />
      </SettingsField>

      <SettingsField label="Country" disabled={!isAdmin}>
        <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} disabled={!isAdmin} placeholder="e.g. Kenya" />
      </SettingsField>

      <SettingsField label="Registration Number" disabled={!isAdmin}>
        <input style={inputStyle} value={regNum} onChange={e => setRegNum(e.target.value)} disabled={!isAdmin} placeholder="e.g. NGO-2024-001" />
      </SettingsField>

      <SettingsField label="Website URL" disabled={!isAdmin}>
        <input style={inputStyle} value={website} onChange={e => setWebsite(e.target.value)} disabled={!isAdmin} placeholder="https://yourorg.org" />
      </SettingsField>

      {isAdmin && (
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', background: loading ? COLORS.mist : COLORS.forest,
            color: loading ? COLORS.stone : '#ffffff', border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
          }}
        >
          <Save size={14} />
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      )}
    </div>
  )
}

// ── ProfileTab ────────────────────────────────────────────────────────────────

function ProfileTab({ org, isAdmin, onSave, onError }: {
  org:     OrgRow; isAdmin: boolean
  onSave:  () => void
  onError: (msg: string, ok?: boolean) => void
}) {
  const supabase    = createClient()
  const fileRef     = useRef<HTMLInputElement>(null)
  const [logoUrl,   setLogoUrl]   = useState(org.logo_url ?? '')
  const [desc,      setDesc]      = useState(org.description ?? '')
  const [twitter,   setTwitter]   = useState('')
  const [linkedin,  setLinkedin]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleLogoUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) { onError('Logo must be under 2 MB', false); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onError('Only JPG, PNG, and WebP images are supported', false); return
    }
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `orgs/${org.id}/logo.${ext}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage: any = supabase.storage
      const { error: upErr } = await storage.from('org-assets').upload(path, file, { upsert: true })
      if (upErr) { onError(upErr.message, false); return }
      const { data: { publicUrl } } = storage.from('org-assets').getPublicUrl(path)
      setLogoUrl(publicUrl)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = supabase
      const { error } = await db
        .from('organizations')
        .update({ logo_url: logoUrl || null, description: desc || null })
        .eq('id', org.id)
      if (error) { onError(error.message, false); return }
      onSave()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Logo upload */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
          Organization Logo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 12,
            border: `2px dashed ${COLORS.mist}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', background: COLORS.foam,
            cursor: isAdmin ? 'pointer' : 'default',
          }}
            onClick={() => isAdmin && fileRef.current?.click()}
          >
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: FONTS.heading, fontSize: 28, fontWeight: 700, color: COLORS.gold }}>
                  {org.name.charAt(0).toUpperCase()}
                </span>
            }
          </div>
          {isAdmin && (
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', border: `1px solid ${COLORS.mist}`, borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: COLORS.slate,
                  background: '#1A2B4A', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
                }}
              >
                <Upload size={13} />
                {uploading ? 'Uploading…' : 'Upload Logo'}
              </button>
              <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 6 }}>
                Max 2 MB · JPG, PNG, or WebP
              </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
        </div>
      </div>

      <SettingsField label="Organization Description" disabled={!isAdmin}>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
          value={desc} onChange={e => setDesc(e.target.value)} disabled={!isAdmin}
          placeholder="Tell donors and partners about your organization…"
        />
      </SettingsField>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
          Social Links
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inputStyle} value={twitter} onChange={e => setTwitter(e.target.value)}
            placeholder="Twitter / X URL" disabled={!isAdmin} />
          <input style={inputStyle} value={linkedin} onChange={e => setLinkedin(e.target.value)}
            placeholder="LinkedIn URL" disabled={!isAdmin} />
        </div>
      </div>

      {isAdmin && (
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', background: loading ? COLORS.mist : COLORS.forest,
            color: loading ? COLORS.stone : '#ffffff', border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
          }}
        >
          <Save size={14} />
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      )}
    </div>
  )
}

// ── BillingTab ────────────────────────────────────────────────────────────────

function BillingTab({ org, orgSlug }: {
  org:     OrgRow
  orgSlug: string
}) {
  const router = useRouter()
  const [subData,  setSubData]  = useState<SubscriptionResponse | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const tier = (subData?.subscription?.plan ?? org.subscription_tier ?? 'FREE') as SubscriptionTier

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then(r => r.json())
      .then((d: SubscriptionResponse) => setSubData(d))
      .catch(() => {/* silently ignore */})
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCheckout(priceId: string) {
    setActionLoading(true)
    try {
      const res  = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, organizationId: org.id }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else showToast(json.message ?? 'Failed to start checkout', false)
    } catch {
      showToast('Failed to start checkout', false)
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePortal() {
    setActionLoading(true)
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else showToast(json.message ?? 'Failed to open portal', false)
    } catch {
      showToast('Failed to open billing portal', false)
    } finally {
      setActionLoading(false)
    }
  }

  const sub         = subData?.subscription
  const plan        = subData?.plan
  const usage       = subData?.usage
  const limits      = subData?.limits
  const isPastDue   = sub?.status === 'PAST_DUE'
  const isCancelled = sub?.status === 'CANCELLED'
  const isTrialing  = sub?.status === 'TRIALING'
  const cancelSoon  = sub?.cancel_at_period_end
  const periodEnd   = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null
  const trialEnd    = sub?.trial_ends_at
    ? new Date(sub.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const hasStripeSubscription = !!sub?.stripe_subscription_id
  const isEnterprise          = tier === 'ENTERPRISE'
  const isFree                = tier === 'FREE'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 64, background: COLORS.foam, borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 100,
          background: toast.ok ? COLORS.forest : COLORS.crimson,
          color: '#ffffff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 500, boxShadow: SHADOW.toast,
        }}>{toast.msg}</div>
      )}

      {/* Payment failed warning */}
      {isPastDue && (
        <div style={{
          background: '#FEF2F2', border: `1px solid ${COLORS.crimson}40`,
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.crimson, margin: '0 0 2px' }}>
              Your last payment failed
            </p>
            <p style={{ fontSize: 13, color: COLORS.slate, margin: 0 }}>
              Update your payment method to avoid losing access.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={actionLoading}
            style={{
              flexShrink: 0, padding: '8px 16px', background: COLORS.crimson,
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Update Payment
          </button>
        </div>
      )}

      {/* Cancel-at-period-end warning */}
      {cancelSoon && !isPastDue && (
        <div style={{
          background: '#FFFBEB', border: `1px solid ${COLORS.amber}40`,
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <p style={{ fontSize: 13, color: COLORS.charcoal, margin: 0 }}>
            Your subscription will cancel on <strong>{periodEnd}</strong>.
          </p>
          <button
            onClick={handlePortal}
            disabled={actionLoading}
            style={{
              flexShrink: 0, padding: '8px 16px', background: COLORS.amber,
              color: '#ffffff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Resume Subscription
          </button>
        </div>
      )}

      {/* Current plan card */}
      <div style={{ background: COLORS.foam, border: `1px solid ${COLORS.mist}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Current Plan
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PlanBadge tier={tier} size="lg" />
            {isTrialing && trialEnd && (
              <span style={{ fontSize: 12, color: COLORS.amber, fontWeight: 500 }}>
                Trial ends {trialEnd}
              </span>
            )}
            {sub?.status && !isTrialing && (
              <StatusPill status={sub.status} />
            )}
          </div>

          {/* Pricing info */}
          {plan && plan.price_monthly !== null && plan.price_monthly > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
                ${sub?.billing_cycle === 'ANNUAL' ? plan.price_annual : plan.price_monthly}
                <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.stone }}>/mo</span>
              </p>
              {sub?.billing_cycle === 'ANNUAL' && (
                <p style={{ fontSize: 11, color: COLORS.stone, margin: '2px 0 0' }}>Billed annually</p>
              )}
              {periodEnd && (
                <p style={{ fontSize: 11, color: COLORS.stone, margin: '2px 0 0' }}>
                  Next billing: {periodEnd}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Plan features */}
        {plan?.features && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {plan.features.map((f, i) => (
              <li key={i} style={{ fontSize: 13, color: COLORS.slate, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: COLORS.sage }}>✓</span> {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Usage bars */}
      {usage && limits && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal, marginBottom: 12 }}>
            Usage
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <UsageStat label="Programs"            value={usage.programs_used}      max={limits.programs}          />
            <UsageStat label="Team Members"        value={usage.members_used}       max={limits.team_members}      />
            <UsageStat label="Donor Connections"   value={usage.donors_used}        max={limits.donors}            />
            <UsageStat label="Reports This Month"  value={usage.reports_this_month} max={limits.reports_per_month} />
            <UsageStat label="Field Forms"         value={usage.field_forms_used}   max={limits.field_forms}       />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {hasStripeSubscription && (
          <button
            onClick={handlePortal}
            disabled={actionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', background: COLORS.forest,
              color: '#ffffff', border: 'none', borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.body, opacity: actionLoading ? 0.7 : 1,
            }}
          >
            <CreditCard size={14} />
            Manage Billing
            <ExternalLink size={12} />
          </button>
        )}

        {!isEnterprise && (isFree || isCancelled) && (
          <button
            onClick={() => router.push('/pricing')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', background: COLORS.gold,
              color: COLORS.forest, border: 'none', borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            <TrendingUp size={14} />
            Upgrade Plan
          </button>
        )}

        {isEnterprise && (
          <a
            href="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', background: COLORS.gold,
              color: COLORS.forest, borderRadius: 9, textDecoration: 'none',
              fontSize: 14, fontWeight: 600, fontFamily: FONTS.body,
            }}
          >
            Contact Sales
          </a>
        )}
      </div>

      {/* Plan comparison mini-table */}
      <PlanComparisonTable currentTier={tier} orgId={org.id} onCheckout={handleCheckout} actionLoading={actionLoading} />
    </div>
  )
}

// ── StatusPill ─────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    ACTIVE:     { bg: '#38A16920', text: COLORS.moss },
    PAST_DUE:   { bg: '#FEE2E2', text: COLORS.crimson },
    CANCELLED:  { bg: '#F1F5F9', text: '#64748B' },
    TRIALING:   { bg: '#DBEAFE', text: '#1E40AF' },
    INCOMPLETE: { bg: '#FEF3C7', text: '#92400E' },
  }
  const s = styles[status] ?? styles.ACTIVE
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 12, background: s.bg, color: s.text,
      fontFamily: FONTS.body, letterSpacing: '0.04em',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── UsageStat ─────────────────────────────────────────────────────────────────

function UsageStat({ label, value, max }: { label: string; value: number; max: number }) {
  const unlimited = max === -1
  const pct       = unlimited ? 0 : Math.min((value / max) * 100, 100)
  const color     = pct >= 90 ? COLORS.crimson : pct >= 70 ? COLORS.amber : COLORS.sage

  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${COLORS.foam}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: COLORS.slate }}>{label}</span>
        <span style={{ fontSize: 13, color: pct >= 90 ? COLORS.crimson : COLORS.stone, fontWeight: pct >= 90 ? 600 : 400 }}>
          {value} / {unlimited ? 'Unlimited' : max}
        </span>
      </div>
      {!unlimited && (
        <div style={{ height: 4, background: COLORS.mist, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: color, borderRadius: 4,
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
    </div>
  )
}

// ── PlanComparisonTable ───────────────────────────────────────────────────────

import { PLANS } from '@/lib/billing/plans'
import type { LimitType } from '@/types/billing'

const ALL_TIERS: SubscriptionTier[] = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']
const LIMIT_ROWS: { key: LimitType; label: string; format: (v: number) => string }[] = [
  { key: 'programs',          label: 'Programs',       format: v => v === -1 ? 'Unlimited' : String(v) },
  { key: 'team_members',      label: 'Team Members',   format: v => v === -1 ? 'Unlimited' : String(v) },
  { key: 'donors',            label: 'Donors',         format: v => v === -1 ? 'Unlimited' : String(v) },
  { key: 'reports_per_month', label: 'Reports/mo',     format: v => v === -1 ? 'Unlimited' : String(v) },
  { key: 'field_forms',       label: 'Field Forms',    format: v => v === -1 ? 'Unlimited' : String(v) },
]

function PlanComparisonTable({ currentTier, orgId, onCheckout, actionLoading }: {
  currentTier:   SubscriptionTier
  orgId:         string
  onCheckout:    (priceId: string) => void
  actionLoading: boolean
}) {
  const thStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 12, fontWeight: 700,
    color: COLORS.stone, textAlign: 'center', fontFamily: FONTS.body,
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: 12, color: COLORS.slate,
    textAlign: 'center', fontFamily: FONTS.body,
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.charcoal, marginBottom: 12 }}>
        Plan Comparison
      </p>
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.mist}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: COLORS.forest }}>
              <th style={{ ...thStyle, textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>Feature</th>
              {ALL_TIERS.map(t => (
                <th
                  key={t}
                  style={{
                    ...thStyle,
                    color: t === currentTier ? COLORS.gold : 'rgba(255,255,255,0.7)',
                    background: t === currentTier ? 'rgba(212,175,92,0.12)' : undefined,
                  }}
                >
                  {PLANS[t].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price row */}
            <tr style={{ background: COLORS.foam }}>
              <td style={{ ...tdStyle, textAlign: 'left', color: COLORS.charcoal, fontWeight: 600 }}>Price/mo</td>
              {ALL_TIERS.map(t => (
                <td key={t} style={{ ...tdStyle, background: t === currentTier ? `${COLORS.gold}08` : undefined }}>
                  {PLANS[t].price_monthly === null
                    ? 'Custom'
                    : PLANS[t].price_monthly === 0
                      ? 'Free'
                      : `$${PLANS[t].price_monthly}`}
                </td>
              ))}
            </tr>
            {/* Limit rows */}
            {LIMIT_ROWS.map(({ key, label, format }, ri) => (
              <tr
                key={key}
                style={{ background: ri % 2 === 0 ? '#ffffff' : COLORS.foam }}
              >
                <td style={{ ...tdStyle, textAlign: 'left', color: COLORS.slate }}>{label}</td>
                {ALL_TIERS.map(t => (
                  <td key={t} style={{ ...tdStyle, background: t === currentTier ? `${COLORS.gold}08` : undefined }}>
                    {format(PLANS[t].limits[key])}
                  </td>
                ))}
              </tr>
            ))}
            {/* CTA row */}
            <tr style={{ background: COLORS.foam }}>
              <td style={tdStyle} />
              {ALL_TIERS.map(t => {
                const isCurrent = t === currentTier
                const plan      = PLANS[t]
                const isHigher  = ALL_TIERS.indexOf(t) > ALL_TIERS.indexOf(currentTier)
                const priceId   = plan.stripe_price_id_monthly

                if (isCurrent) {
                  return <td key={t} style={{ ...tdStyle, fontWeight: 600, color: COLORS.sage }}>Current</td>
                }
                if (t === 'ENTERPRISE') {
                  return (
                    <td key={t} style={tdStyle}>
                      <a href="/contact" style={{ fontSize: 12, color: COLORS.sky, fontFamily: FONTS.body, textDecoration: 'none' }}>
                        Contact
                      </a>
                    </td>
                  )
                }
                if (isHigher && priceId) {
                  return (
                    <td key={t} style={tdStyle}>
                      <button
                        onClick={() => onCheckout(priceId)}
                        disabled={actionLoading}
                        style={{
                          padding: '5px 12px', background: COLORS.gold,
                          color: COLORS.forest, border: 'none', borderRadius: 6,
                          fontSize: 11, fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontFamily: FONTS.body,
                        }}
                      >
                        Upgrade
                      </button>
                    </td>
                  )
                }
                return <td key={t} style={{ ...tdStyle, color: COLORS.stone }}>—</td>
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── DangerTab ─────────────────────────────────────────────────────────────────

function DangerTab({ org, currentUserId, teamMembers, onTransferSuccess, onDeleteSuccess, onError }: {
  org:                OrgRow
  currentUserId:      string
  teamMembers:        { id: string; full_name: string | null; role: string }[]
  onTransferSuccess:  () => void
  onDeleteSuccess:    () => void
  onError:            (msg: string, ok?: boolean) => void
}) {
  const [transferOpen, setTransferOpen] = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Transfer Ownership */}
      <DangerAction
        title="Transfer Ownership"
        description="Assign the NGO_ADMIN role to another team member. You will become a Staff member."
        actionLabel="Transfer Ownership"
        onAction={() => setTransferOpen(true)}
      />

      {/* Delete Organization */}
      <DangerAction
        title="Delete Organization"
        description="Permanently delete this organization and all its data. This cannot be undone."
        actionLabel="Delete Organization"
        onAction={() => setDeleteOpen(true)}
      />

      {transferOpen && (
        <TransferOwnershipModal
          org={org}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          onClose={() => setTransferOpen(false)}
          onSuccess={onTransferSuccess}
          onError={onError}
        />
      )}

      {deleteOpen && (
        <DeleteOrgModal
          org={org}
          onClose={() => setDeleteOpen(false)}
          onSuccess={onDeleteSuccess}
          onError={onError}
        />
      )}
    </div>
  )
}

function DangerAction({ title, description, actionLabel, onAction }: {
  title:       string
  description: string
  actionLabel: string
  onAction:    () => void
}) {
  return (
    <div style={{
      border: `1px solid ${COLORS.crimson}30`,
      borderRadius: 12, padding: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      background: '#FFF5F5',
    }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: 14, color: COLORS.crimson, margin: '0 0 4px' }}>{title}</p>
        <p style={{ fontSize: 13, color: COLORS.slate, margin: 0 }}>{description}</p>
      </div>
      <button
        onClick={onAction}
        style={{
          flexShrink: 0, padding: '9px 18px',
          background: 'transparent', color: COLORS.crimson,
          border: `1px solid ${COLORS.crimson}`, borderRadius: 9,
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
          whiteSpace: 'nowrap',
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}

// ── TransferOwnershipModal ────────────────────────────────────────────────────

function TransferOwnershipModal({ org, teamMembers, currentUserId, onClose, onSuccess, onError }: {
  org:           OrgRow
  teamMembers:   { id: string; full_name: string | null; role: string }[]
  currentUserId: string
  onClose:       () => void
  onSuccess:     () => void
  onError:       (msg: string, ok?: boolean) => void
}) {
  const supabase   = createClient()
  const [selectedId, setSelectedId] = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [loading,    setLoading]    = useState(false)

  const canConfirm = selectedId && confirm === org.name

  async function handleTransfer() {
    if (!canConfirm) return
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = supabase
      // Make selected user admin
      const { error: e1 } = await db.from('profiles').update({ role: 'NGO_ADMIN' }).eq('id', selectedId)
      if (e1) { onError(e1.message, false); return }
      // Demote current user to staff
      const { error: e2 } = await db.from('profiles').update({ role: 'NGO_STAFF' }).eq('id', currentUserId)
      if (e2) { onError(e2.message, false); return }
      onSuccess()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 28, maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
            Transfer Ownership
          </h2>
          <button onClick={onClose} style={{ color: COLORS.stone, cursor: 'pointer', background: 'none', border: 'none' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
              Transfer admin to
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              <option value="">Select a team member…</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name ?? m.id} ({m.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
              Type <strong>{org.name}</strong> to confirm
            </label>
            <input
              style={{ ...inputStyle, borderColor: confirm === org.name ? COLORS.sage : COLORS.mist }}
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder={org.name}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '10px 0', background: COLORS.foam, color: COLORS.forest,
              border: `1px solid ${COLORS.mist}`, borderRadius: 9, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONTS.body,
            }}>Cancel</button>
            <button
              onClick={handleTransfer}
              disabled={!canConfirm || loading}
              style={{
                flex: 1, padding: '10px 0',
                background: canConfirm && !loading ? COLORS.crimson : COLORS.mist,
                color: canConfirm && !loading ? '#ffffff' : COLORS.stone,
                border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600,
                cursor: canConfirm && !loading ? 'pointer' : 'not-allowed', fontFamily: FONTS.body,
              }}
            >
              {loading ? 'Transferring…' : 'Transfer'}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ── DeleteOrgModal ────────────────────────────────────────────────────────────

function DeleteOrgModal({ org, onClose, onSuccess, onError }: {
  org:       OrgRow
  onClose:   () => void
  onSuccess: () => void
  onError:   (msg: string, ok?: boolean) => void
}) {
  const supabase  = createClient()
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const canDelete  = confirm === org.name

  async function handleDelete() {
    if (!canDelete) return
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db: any = supabase
      const { error } = await db.from('organizations').delete().eq('id', org.id)
      if (error) { onError(error.message, false); return }
      await supabase.auth.signOut()
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 28, maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={20} style={{ color: COLORS.crimson, flexShrink: 0 }} />
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.crimson, margin: 0 }}>
            Delete Organization
          </h2>
          <button onClick={onClose} style={{ marginLeft: 'auto', color: COLORS.stone, cursor: 'pointer', background: 'none', border: 'none' }}><X size={18} /></button>
        </div>

        <p style={{ fontSize: 14, color: COLORS.slate, lineHeight: 1.6, marginBottom: 20 }}>
          This will permanently delete <strong>{org.name}</strong> and all associated data including programs, indicators, budgets, reports, and team members. <strong>This action cannot be undone.</strong>
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Type <strong>{org.name}</strong> to confirm
          </label>
          <input
            style={{ ...inputStyle, borderColor: canDelete ? COLORS.crimson : COLORS.mist }}
            value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder={org.name}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 0', background: COLORS.foam, color: COLORS.forest,
            border: `1px solid ${COLORS.mist}`, borderRadius: 9, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONTS.body,
          }}>Cancel</button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || loading}
            style={{
              flex: 1, padding: '10px 0',
              background: canDelete && !loading ? COLORS.crimson : COLORS.mist,
              color: canDelete && !loading ? '#ffffff' : COLORS.stone,
              border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600,
              cursor: canDelete && !loading ? 'pointer' : 'not-allowed', fontFamily: FONTS.body,
            }}
          >
            {loading ? 'Deleting…' : 'Delete Organization'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function SettingsField({ label, hint, disabled, children }: {
  label:    string
  hint?:    string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
        {label}
        {disabled && <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.stone, fontWeight: 400 }}>(read-only)</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: '#1A2B4A', borderRadius: 16, boxShadow: SHADOW.modal,
        maxHeight: '90vh', overflowY: 'auto', width: '100%',
      }}>
        {children}
      </div>
    </div>
  )
}
