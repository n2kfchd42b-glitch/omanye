'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Save, Upload, Key } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import { createClient } from '@/lib/supabase/client'

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

export default function ProfileSettingsPage() {
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [userId,    setUserId]    = useState<string | null>(null)
  const [email,     setEmail]     = useState('')
  const [fullName,  setFullName]  = useState('')
  const [jobTitle,  setJobTitle]  = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast,     setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, job_title, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName((profile as Record<string, unknown>).full_name as string ?? '')
        setJobTitle((profile as Record<string, unknown>).job_title as string ?? '')
        setAvatarUrl((profile as Record<string, unknown>).avatar_url as string | null ?? null)
      }
    }
    load()
  }, [])

  async function handleAvatarUpload(file: File) {
    if (!userId) return
    if (file.size > 2 * 1024 * 1024) { showToast('Avatar must be under 2 MB', false); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, and WebP images are supported', false); return
    }
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `avatars/${userId}/avatar.${ext}`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage: any = supabase.storage
      const { error: upErr } = await storage.from('user-assets').upload(path, file, { upsert: true })
      if (upErr) { showToast(upErr.message, false); return }
      const { data: { publicUrl } } = storage.from('user-assets').getPublicUrl(path)
      setAvatarUrl(publicUrl)
      showToast('Avatar updated')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!userId) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName || null, job_title: jobTitle || null, avatar_url: avatarUrl })
        .eq('id', userId)
      if (error) { showToast(error.message, false); return }
      showToast('Profile saved')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    if (!email) return
    setPwLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
      })
      if (error) { showToast(error.message, false); return }
      showToast('Password reset email sent — check your inbox')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
          Profile Settings
        </h1>
        <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>
          Manage your personal profile information
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Avatar */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 12 }}>
            Profile Picture
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${COLORS.mist}`,
              cursor: 'pointer',
            }} onClick={() => fileRef.current?.click()}>
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Avatar name={fullName || email} size={72} />
              }
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', border: `1px solid ${COLORS.mist}`, borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: COLORS.slate,
                  background: '#ffffff', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
                }}
              >
                <Upload size={13} />
                {uploading ? 'Uploading…' : 'Upload Photo'}
              </button>
              <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 6 }}>
                Max 2 MB · JPG, PNG, or WebP
              </p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f) }} />
        </div>

        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Full Name
          </label>
          <input
            style={inputStyle}
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        {/* Job Title */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Job Title
          </label>
          <input
            style={inputStyle}
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="e.g. Program Manager"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
            Email Address
            <span style={{ marginLeft: 8, fontSize: 11, color: COLORS.stone, fontWeight: 400 }}>(cannot be changed here)</span>
          </label>
          <input
            style={{ ...inputStyle, background: COLORS.foam, color: COLORS.stone }}
            value={email}
            disabled
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            alignSelf: 'flex-start',
            padding: '10px 22px',
            background: loading ? COLORS.mist : COLORS.forest,
            color: loading ? COLORS.stone : '#ffffff',
            border: 'none', borderRadius: 9,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONTS.body,
          }}
        >
          <Save size={14} />
          {loading ? 'Saving…' : 'Save Changes'}
        </button>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${COLORS.mist}`, paddingTop: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 8 }}>
            Password
          </p>
          <p style={{ fontSize: 13, color: COLORS.stone, marginBottom: 16 }}>
            We&apos;ll send a reset link to your email address.
          </p>
          <button
            onClick={handlePasswordReset}
            disabled={pwLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px',
              background: COLORS.foam, color: COLORS.forest,
              border: `1px solid ${COLORS.mist}`, borderRadius: 9,
              fontSize: 14, fontWeight: 600,
              cursor: pwLoading ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.body,
            }}
          >
            <Key size={14} />
            {pwLoading ? 'Sending…' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
