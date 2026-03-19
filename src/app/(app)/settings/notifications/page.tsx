'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Save, Loader2, AlertTriangle, Check } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import type { NotificationPreferences } from '@/types/audit'

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width:        40, height: 22,
        borderRadius: 11,
        background:   checked ? COLORS.sage : COLORS.mist,
        border:      'none',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        position:    'relative',
        transition:  'background 0.2s',
        flexShrink:   0,
        opacity:      disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position:   'absolute',
        top:         2, left: checked ? 20 : 2,
        width:       18, height: 18,
        borderRadius: 9,
        background:  '#fff',
        transition: 'left 0.2s',
        boxShadow:  '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── Preference row ────────────────────────────────────────────────────────────

function PrefRow({
  label, hint, checked, onChange, disabled, highPriority,
}: {
  label:        string
  hint?:        string
  checked:      boolean
  onChange:     (v: boolean) => void
  disabled?:    boolean
  highPriority?: boolean
}) {
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      justifyContent: 'space-between',
      padding:       '12px 0',
      borderBottom:  `1px solid ${COLORS.mist}`,
      gap:           12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: COLORS.forest, fontFamily: FONTS.body }}>
            {label}
          </p>
          {highPriority && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
              background: '#FEE2E2', color: COLORS.crimson, fontFamily: FONTS.body,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              HIGH
            </span>
          )}
        </div>
        {hint && (
          <p style={{ margin: '2px 0 0', fontSize: 11, color: COLORS.stone, fontFamily: FONTS.body }}>
            {hint}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p style={{
      margin: '20px 0 0',
      fontSize: 10, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      color: COLORS.stone, fontFamily: FONTS.body,
    }}>
      {title}
    </p>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

type PrefsState = Omit<NotificationPreferences,
  'id' | 'profile_id' | 'created_at' | 'updated_at'>

const DEFAULTS: PrefsState = {
  email_notifications:      true,
  notify_program_updates:   true,
  notify_indicator_updates: true,
  notify_expenditures:      true,
  notify_reports:           true,
  notify_field_submissions: false,
  notify_team_changes:      true,
  notify_donor_activity:    true,
  notify_budget_warnings:   true,
}

export default function NotificationPreferencesPage() {
  const [prefs,      setPrefs]      = useState<PrefsState>(DEFAULTS)
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const fetchPrefs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const { data } = await res.json()
        if (data) {
          const { id, profile_id, created_at, updated_at, ...rest } = data
          setPrefs(rest)
        }
      } else {
        setLoadError(true)
      }
    } catch { setLoadError(true) } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrefs() }, [fetchPrefs])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/notifications/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(prefs),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const { error: e } = await res.json()
        setError(e ?? 'Failed to save preferences')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof PrefsState) => (v: boolean) =>
    setPrefs(p => ({ ...p, [key]: v }))

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bell size={22} color={COLORS.forest} />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.forest, fontFamily: FONTS.heading }}>
            Notification Preferences
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.stone, fontFamily: FONTS.body }}>
            Choose which events send you in-app notifications.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: COLORS.stone, fontSize: 13, fontFamily: FONTS.body }}>
          Loading…
        </div>
      ) : loadError ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 14, color: COLORS.crimson, fontFamily: FONTS.body, marginBottom: 12 }}>
            Failed to load your notification preferences.
          </p>
          <button
            onClick={fetchPrefs}
            style={{
              padding: '9px 20px', fontSize: 13, borderRadius: 8,
              border: `1px solid ${COLORS.mist}`, background: '#1A2B4A',
              color: COLORS.slate, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{
          background: '#1A2B4A', borderRadius: 12,
          border: `1px solid ${COLORS.mist}`,
          padding: '4px 24px 24px',
          boxShadow: SHADOW.card,
        }}>
          {/* Programs & Indicators */}
          <SectionHeader title="Programs & Indicators" />
          <PrefRow
            label="Program updates and status changes"
            checked={prefs.notify_program_updates}
            onChange={set('notify_program_updates')}
          />
          <PrefRow
            label="Indicator value updates"
            checked={prefs.notify_indicator_updates}
            onChange={set('notify_indicator_updates')}
          />
          <PrefRow
            label="Indicators falling off track"
            hint="Notified when an indicator drops below 50% of target"
            checked={true}
            onChange={() => {}}
            disabled
            highPriority
          />

          {/* Budget & Finance */}
          <SectionHeader title="Budget & Finance" />
          <PrefRow
            label="Expenditure submissions and approvals"
            checked={prefs.notify_expenditures}
            onChange={set('notify_expenditures')}
          />
          <PrefRow
            label="Budget category warnings"
            hint="Notified when a category exceeds 80% of allocation"
            checked={true}
            onChange={() => {}}
            disabled
            highPriority
          />

          {/* Reports & Field */}
          <SectionHeader title="Reports & Field Data" />
          <PrefRow
            label="Report generation and submissions"
            checked={prefs.notify_reports}
            onChange={set('notify_reports')}
          />
          <PrefRow
            label="Field submission flags"
            hint="When field submissions are flagged for follow-up"
            checked={prefs.notify_field_submissions}
            onChange={set('notify_field_submissions')}
          />

          {/* Team & Donors */}
          <SectionHeader title="Team & Donors" />
          <PrefRow
            label="Team member changes"
            hint="When members join or are removed"
            checked={prefs.notify_team_changes}
            onChange={set('notify_team_changes')}
          />
          <PrefRow
            label="Donor access requests"
            hint="When donors request access to a program"
            checked={true}
            onChange={() => {}}
            disabled
            highPriority
          />

          {/* Email */}
          <SectionHeader title="Email" />
          <PrefRow
            label="Also receive notifications by email"
            hint="Sent via your registered email address"
            checked={prefs.email_notifications}
            onChange={set('email_notifications')}
          />

          {/* High priority note */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '10px 14px',
            background: '#FEF3C7', borderRadius: 8,
            border: `1px solid #FDE68A`,
          }}>
            <AlertTriangle size={14} color={COLORS.amber} style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#78350F', fontFamily: FONTS.body }}>
              HIGH priority notifications cannot be disabled — they alert you to critical issues.
            </p>
          </div>

          {/* Save */}
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 8,
                background: COLORS.forest, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                border: 'none', fontFamily: FONTS.body, opacity: saving ? 0.7 : 1,
              }}
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save Preferences</>
              }
            </button>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: COLORS.sage, fontFamily: FONTS.body }}>
                <Check size={14} /> Saved
              </div>
            )}
            {error && (
              <p style={{ margin: 0, fontSize: 13, color: COLORS.crimson, fontFamily: FONTS.body }}>
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
