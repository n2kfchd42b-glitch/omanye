'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { createClient } from '@/lib/supabase/client'
import { OmanyeLogo } from '@/components/Logo'
import Link from 'next/link'

// ── Role label helpers ────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  NGO_ADMIN:  'Admin',
  NGO_STAFF:  'Staff',
  NGO_VIEWER: 'Viewer',
}

const ROLE_DESCRIPTION: Record<string, string> = {
  NGO_ADMIN:  'Full access — manage team, settings, and donors',
  NGO_STAFF:  'Can create and edit programs, submit field data, generate reports',
  NGO_VIEWER: 'Read-only access — view programs and reports',
}

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '10px 14px',
  border:       `1px solid #C8EDD8`,
  borderRadius: 8,
  fontSize:     15,
  color:        COLORS.ink,
  background:   '#ffffff',
  outline:      'none',
  boxSizing:    'border-box',
  fontFamily:   FONTS.body,
}

// ── InvitationData ────────────────────────────────────────────────────────────

interface InvitationData {
  id:           string
  email:        string
  full_name:    string | null
  role:         string
  status:       string
  expires_at:   string
  message:      string | null
  org_name:     string
  org_logo_url: string | null
  org_slug:     string | null
  inviter_name: string | null
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamJoinPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const supabase = createClient()
  const token = params.token

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [authState,  setAuthState]  = useState<'loading' | 'none' | 'same' | 'different'>('loading')
  const [userEmail,  setUserEmail]  = useState('')
  const [accepting,  setAccepting]  = useState(false)
  const [accepted,   setAccepted]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Signup form
  const [signupName,     setSignupName]     = useState('')
  const [signupEmail,    setSignupEmail]    = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading,  setSignupLoading]  = useState(false)
  const [signupError,    setSignupError]    = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      // Fetch invitation
      const res = await fetch(`/api/team/invitations/${token}`)
      if (!res.ok) { setLoading(false); return }
      const { data } = await res.json()
      setInvitation(data)
      if (data?.full_name) setSignupName(data.full_name)
      if (data?.email)     setSignupEmail(data.email)

      // Check auth state
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthState('none')
      } else if (user.email === data?.email) {
        setAuthState('same')
        setUserEmail(user.email ?? '')
      } else {
        setAuthState('different')
        setUserEmail(user.email ?? '')
      }
      setLoading(false)
    }
    load()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch(`/api/team/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to accept invitation'); return }
      setAccepted(true)
      setTimeout(() => {
        const slug = json.org_slug
        router.replace(slug ? `/org/${slug}/dashboard` : '/onboarding')
      }, 2000)
    } finally {
      setAccepting(false)
    }
  }

  async function handleSignupAndAccept() {
    setSignupLoading(true)
    setSignupError(null)
    try {
      // Create account
      const { error: signupErr } = await supabase.auth.signUp({
        email:    signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupName },
        },
      })
      if (signupErr) { setSignupError(signupErr.message); return }

      // Wait briefly for auth to settle then accept
      await new Promise(resolve => setTimeout(resolve, 800))

      // Accept invitation
      const res = await fetch(`/api/team/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail }),
      })
      const json = await res.json()
      if (!res.ok) { setSignupError(json.error ?? 'Failed to accept invitation'); return }
      setAccepted(true)
      setTimeout(() => {
        const slug = json.org_slug
        router.replace(slug ? `/org/${slug}/dashboard` : '/onboarding')
      }, 2000)
    } finally {
      setSignupLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return <PageShell><LoadingState /></PageShell>
  }

  if (!invitation) {
    return (
      <PageShell>
        <ErrorState
          icon={<AlertTriangle size={40} style={{ color: COLORS.crimson }} />}
          title="Invitation Not Found"
          message="This invitation link is invalid or has already been used."
        />
      </PageShell>
    )
  }

  if (invitation.status === 'EXPIRED') {
    return (
      <PageShell>
        <ErrorState
          icon={<Clock size={40} style={{ color: COLORS.stone }} />}
          title="Invitation Expired"
          message="This invitation has expired. Contact your team admin to send a new one."
        />
      </PageShell>
    )
  }

  if (invitation.status === 'REVOKED') {
    return (
      <PageShell>
        <ErrorState
          icon={<AlertTriangle size={40} style={{ color: COLORS.crimson }} />}
          title="Invitation Revoked"
          message="This invitation has been revoked. Contact your team admin for a new invitation."
        />
      </PageShell>
    )
  }

  if (invitation.status === 'ACCEPTED') {
    return (
      <PageShell>
        <ErrorState
          icon={<CheckCircle size={40} style={{ color: COLORS.sage }} />}
          title="Already Accepted"
          message="This invitation has already been accepted."
          action={<Link href="/login" style={{ color: COLORS.fern, fontWeight: 600, fontSize: 14 }}>Sign in →</Link>}
        />
      </PageShell>
    )
  }

  if (accepted) {
    return (
      <PageShell>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: COLORS.sage, margin: '0 auto 16px' }} />
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.forest, marginBottom: 8 }}>
            Welcome to {invitation.org_name}!
          </h2>
          <p style={{ fontSize: 14, color: COLORS.stone }}>Redirecting you to your dashboard…</p>
        </div>
      </PageShell>
    )
  }

  const roleLabel = ROLE_LABEL[invitation.role] ?? invitation.role
  const roleDesc  = ROLE_DESCRIPTION[invitation.role] ?? ''

  return (
    <PageShell>
      {/* Invitation details */}
      <div style={{ marginBottom: 28 }}>
        {invitation.org_logo_url ? (
          <img src={invitation.org_logo_url} alt={invitation.org_name}
            style={{ height: 40, borderRadius: 8, marginBottom: 12 }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: COLORS.gold, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONTS.heading, fontWeight: 700, fontSize: 22, color: COLORS.forest,
            marginBottom: 12,
          }}>
            {invitation.org_name.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, margin: '0 0 8px' }}>
          You&apos;ve been invited to join {invitation.org_name}
        </h1>
        <p style={{ fontSize: 14, color: COLORS.stone, margin: 0 }}>
          {invitation.inviter_name && <><strong>{invitation.inviter_name}</strong> invited you as </>}
          <span style={{
            fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontSize: 12,
            background: COLORS.forest, color: '#ffffff',
          }}>
            {roleLabel}
          </span>
        </p>
        {roleDesc && <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 6 }}>{roleDesc}</p>}

        {invitation.message && (
          <div style={{
            background: COLORS.foam, borderLeft: `3px solid ${COLORS.gold}`,
            borderRadius: '0 8px 8px 0', padding: '12px 16px', marginTop: 16,
          }}>
            <p style={{ fontSize: 14, color: COLORS.charcoal, margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>
              &ldquo;{invitation.message}&rdquo;
            </p>
            {invitation.inviter_name && (
              <p style={{ fontSize: 12, color: COLORS.stone, margin: '6px 0 0' }}>— {invitation.inviter_name}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: COLORS.crimson, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Auth state: loading */}
      {authState === 'loading' && <LoadingState />}

      {/* Auth state: already logged in with matching email */}
      {authState === 'same' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: COLORS.slate, margin: 0 }}>
            You&apos;re signed in as <strong>{userEmail}</strong>
          </p>
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              width: '100%', padding: '13px 0',
              background: accepting ? COLORS.mist : COLORS.forest,
              color: accepting ? COLORS.stone : '#ffffff',
              border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: accepting ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
            }}
          >
            {accepting ? 'Accepting…' : `Accept Invitation →`}
          </button>
        </div>
      )}

      {/* Auth state: logged in with different email */}
      {authState === 'different' && (
        <div style={{ background: '#FEF3C7', border: `1px solid #D97706`, borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#78350F', margin: 0, lineHeight: 1.6 }}>
            <strong>You&apos;re signed in as {userEmail}.</strong><br />
            This invitation was sent to <strong>{invitation.email}</strong>.
            Please sign out and sign in with the correct account, or create a new account.
          </p>
        </div>
      )}

      {/* Auth state: not logged in — show signup form */}
      {authState === 'none' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: COLORS.stone, margin: 0 }}>
            Create your OMANYE account to accept this invitation.
          </p>

          {signupError && (
            <div style={{ background: '#FEE2E2', color: COLORS.crimson, padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {signupError}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E35', marginBottom: 6 }}>Full Name</label>
            <input style={inputStyle} value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E35', marginBottom: 6 }}>Email Address</label>
            <input style={{ ...inputStyle, background: COLORS.foam }} value={signupEmail} disabled />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#2C3E35', marginBottom: 6 }}>Password</label>
            <input
              style={inputStyle} type="password" value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              placeholder="Create a strong password"
            />
          </div>

          <button
            onClick={handleSignupAndAccept}
            disabled={signupLoading || !signupPassword}
            style={{
              width: '100%', padding: '13px 0',
              background: signupLoading || !signupPassword ? COLORS.mist : COLORS.forest,
              color: signupLoading || !signupPassword ? COLORS.stone : '#ffffff',
              border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
              cursor: signupLoading || !signupPassword ? 'not-allowed' : 'pointer', fontFamily: FONTS.body,
            }}
          >
            {signupLoading ? 'Creating account…' : 'Create Account & Accept →'}
          </button>

          <p style={{ fontSize: 13, color: COLORS.stone, textAlign: 'center', margin: 0 }}>
            Already have an account?{' '}
            <Link href={`/login?next=/team/join/${token}`} style={{ color: COLORS.fern, fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      )}
    </PageShell>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <OmanyeLogo size="sm" showTagline={false} />
        </div>
        {/* Card */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '32px 36px', boxShadow: SHADOW.modal }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontSize: 14, color: COLORS.stone }}>Loading invitation…</p>
    </div>
  )
}

function ErrorState({ icon, title, message, action }: {
  icon:     React.ReactNode
  title:    string
  message:  string
  action?:  React.ReactNode
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, color: COLORS.forest, marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: 14, color: COLORS.stone, marginBottom: action ? 20 : 0 }}>{message}</p>
      {action}
    </div>
  )
}
