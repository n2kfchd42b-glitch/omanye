'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/tokens'
import { AccessLevelBadge } from '@/components/AccessLevelBadge'
import type { DonorInvitation, AccessLevel } from '@/lib/donors'
import { acceptInvitation } from '@/app/actions/donors'

// ── Bullet descriptions per access level ─────────────────────────────────────

const ACCESS_BULLETS: Record<AccessLevel, string[]> = {
  SUMMARY_ONLY:          ['Programme overview and key objectives', 'Narrative updates from the field'],
  INDICATORS:            ['Programme overview and key objectives', 'Narrative updates', 'KPI progress and target tracking'],
  INDICATORS_AND_BUDGET: ['Programme overview', 'Narrative updates', 'KPI progress tracking', 'Budget summary and burn rate'],
  FULL:                  ['Everything above', 'Funding tranches and financial reports', 'All shared documents'],
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  invitation:   (DonorInvitation & { program_name: string | null; org_name: string | null }) | null
  token:        string
  isLoggedIn:   boolean
  userRole:     string | null
  errorMessage: string | null
}

export default function InviteAcceptClient({ invitation, token, isLoggedIn, userRole, errorMessage }: Props) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [accepted, setAccepted]   = useState(false)

  const redirectParam = encodeURIComponent(`/invite/${token}`)

  async function handleAccept() {
    setAccepting(true); setError(null)
    const result = await acceptInvitation(token)
    setAccepting(false)
    if (result.error) { setError(result.error); return }
    setAccepted(true)
    // Redirect to the program after a short delay
    setTimeout(() => {
      if (result.data?.program_id) {
        router.push(`/donor/programs/${result.data.program_id}`)
      } else {
        router.push('/donor/dashboard')
      }
    }, 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1B33', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: COLORS.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.gold,
          }}>O</div>
          <span style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0.5 }}>
            OMANYE
          </span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.stone, marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          NGO Donor Transparency Platform
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#1A2B4A',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 520,
        overflow: 'hidden',
      }}>

        {/* ── Error state ─────────────────────────────────────────────── */}
        {errorMessage && (
          <div style={{ padding: '48px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
              Invitation Unavailable
            </h1>
            <p style={{ fontSize: 15, color: COLORS.slate, lineHeight: 1.6, margin: '0 0 28px' }}>
              {errorMessage}
            </p>
            <Link href='/' style={{ fontSize: 14, color: COLORS.fern, fontWeight: 600, textDecoration: 'none' }}>
              Go to OMANYE →
            </Link>
          </div>
        )}

        {/* ── Accepted state ───────────────────────────────────────────── */}
        {accepted && (
          <div style={{ padding: '48px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '0 0 12px' }}>
              Access Granted!
            </h1>
            <p style={{ fontSize: 15, color: COLORS.slate, margin: 0 }}>
              Redirecting you to the programme…
            </p>
          </div>
        )}

        {/* ── Main state ──────────────────────────────────────────────── */}
        {!errorMessage && !accepted && invitation && (
          <>
            {/* Header */}
            <div style={{ background: COLORS.forest, padding: '28px 36px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {invitation.org_name ?? 'An NGO'}
              </div>
              <h1 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                You've been invited to view a programme
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                Accept this invitation to start viewing programme data on OMANYE.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Personal message */}
              {invitation.message && (
                <div style={{ background: COLORS.foam, borderLeft: `3px solid ${COLORS.gold}`, borderRadius: '0 8px 8px 0', padding: '12px 16px' }}>
                  <p style={{ fontSize: 14, color: COLORS.charcoal, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                    "{invitation.message}"
                  </p>
                  <p style={{ fontSize: 12, color: COLORS.stone, margin: '6px 0 0' }}>
                    — {invitation.org_name ?? 'The organisation'}
                  </p>
                </div>
              )}

              {/* Programme card */}
              <div style={{ background: '#243352', border: `1px solid ${COLORS.mist}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Programme
                </div>
                <div style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                  {invitation.program_name ?? 'Programme'}
                </div>
                <AccessLevelBadge level={invitation.access_level} size='sm' showTooltip />
              </div>

              {/* Access bullets */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate, marginBottom: 10 }}>
                  With this access you'll be able to see:
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {ACCESS_BULLETS[invitation.access_level].map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: COLORS.charcoal }}>
                      <span style={{ color: COLORS.fern, fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Expiry notice */}
              <p style={{ fontSize: 12, color: COLORS.stone, margin: 0, paddingTop: 12, borderTop: `1px solid ${COLORS.mist}` }}>
                This invitation expires on {new Date(invitation.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>

              {/* Actions */}
              {error && <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>{error}</p>}

              {isLoggedIn && userRole === 'DONOR' ? (
                // Already logged in as donor — accept directly
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                    background: accepting ? COLORS.stone : COLORS.gold,
                    color: COLORS.forest, fontWeight: 700, fontSize: 16,
                    cursor: accepting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {accepting ? 'Accepting…' : 'Accept Invitation →'}
                </button>
              ) : isLoggedIn && userRole !== 'DONOR' ? (
                // Logged in as NGO staff — can't accept
                <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#78350F' }}>
                  You're currently signed in as an NGO team member. To accept this invitation, sign in with a donor account.
                </div>
              ) : (
                // Not logged in — redirect to auth
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link
                    href={`/login?redirect=${redirectParam}`}
                    style={{
                      display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
                      padding: '13px 0', borderRadius: 12, border: 'none',
                      background: COLORS.gold, color: COLORS.forest, fontWeight: 700, fontSize: 15,
                      textDecoration: 'none', transition: 'opacity 0.15s',
                    }}
                  >
                    Sign in to accept →
                  </Link>
                  <Link
                    href={`/register?redirect=${redirectParam}`}
                    style={{
                      display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
                      padding: '12px 0', borderRadius: 12,
                      border: `1.5px solid ${COLORS.mist}`,
                      background: '#1A2B4A', color: '#FFFFFF', fontWeight: 600, fontSize: 15,
                      textDecoration: 'none',
                    }}
                  >
                    Create a free account
                  </Link>
                  <p style={{ fontSize: 12, color: COLORS.stone, textAlign: 'center', margin: 0 }}>
                    No credit card required. A donor account is completely free.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
