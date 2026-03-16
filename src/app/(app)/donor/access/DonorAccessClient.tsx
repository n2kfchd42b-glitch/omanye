'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/tokens'
import { AccessLevelBadge } from '@/components/AccessLevelBadge'
import type { AccessLevel } from '@/lib/donors'
import type { DonorAccessRequest } from '@/lib/auth/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const REQUEST_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#78350F', dot: '#D97706' },
  APPROVED: { bg: '#E6F5EC', text: '#1A5C3A', dot: '#4CAF78' },
  DENIED:   { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Grant {
  id:                   unknown
  program_id:           unknown
  organization_id:      unknown
  access_level:         unknown
  can_download_reports: unknown
  granted_at:           unknown
  expires_at:           unknown
  active:               unknown
  last_viewed_at:       unknown
  view_count:           unknown
  program_name:         string | null
  org_name:             string | null
  org_slug:             string | null
}

interface Props {
  grants:   Grant[]
  requests: (DonorAccessRequest & { program_name: string | null; org_name: string | null })[]
}

export default function DonorAccessClient({ grants, requests }: Props) {
  const [tab, setTab] = useState<'access' | 'requests'>('access')

  const activeGrants  = grants.filter(g => g.active)
  const revokedGrants = grants.filter(g => !g.active)
  const pendingReqs   = requests.filter(r => r.status === 'PENDING')
  const resolvedReqs  = requests.filter(r => r.status !== 'PENDING')

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>

      {/* Top bar */}
      <div style={{
        background: COLORS.forest,
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href='/donor/dashboard' style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
          ← Dashboard
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>My Access</span>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, margin: '0 0 6px' }}>
          My Programme Access
        </h1>
        <p style={{ fontSize: 14, color: COLORS.stone, margin: '0 0 28px' }}>
          All programmes you have been granted access to by NGO partners.
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `2px solid ${COLORS.mist}` }}>
          {([
            { key: 'access', label: `Access (${activeGrants.length})` },
            { key: 'requests', label: `My Requests (${requests.length})${pendingReqs.length > 0 ? ` · ${pendingReqs.length} pending` : ''}` },
          ] as { key: 'access' | 'requests'; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                color: tab === t.key ? COLORS.forest : COLORS.stone,
                borderBottom: `2px solid ${tab === t.key ? COLORS.fern : 'transparent'}`,
                marginBottom: -2, transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Access Tab ─────────────────────────────────────────────────── */}
        {tab === 'access' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeGrants.length === 0 && revokedGrants.length === 0 && (
              <div style={{ background: '#fff', border: `1px solid ${COLORS.mist}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: COLORS.stone, margin: 0 }}>You don't have access to any programmes yet.</p>
              </div>
            )}

            {activeGrants.map(g => (
              <div
                key={g.id as string}
                style={{
                  background: '#fff',
                  border: `1px solid ${COLORS.mist}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest }}>
                      {g.program_name ?? 'Unknown programme'}
                    </span>
                    <AccessLevelBadge level={g.access_level as AccessLevel} size='sm' showTooltip />
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.stone, marginBottom: 8 }}>
                    {g.org_name ?? ''}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: COLORS.stone, flexWrap: 'wrap' }}>
                    <span>Granted {new Date(g.granted_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {(g.expires_at as string | null) && <span style={{ color: COLORS.amber }}>Expires {new Date(g.expires_at as string).toLocaleDateString()}</span>}
                    {(g.can_download_reports as boolean) && <span>· Downloads allowed</span>}
                    <span>· Viewed {relativeTime(g.last_viewed_at as string | null)}</span>
                    <span>· {g.view_count as number} views</span>
                  </div>
                </div>
                {g.org_slug && (
                  <Link
                    href={`/donor/programs/${g.program_id as string}`}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: COLORS.foam, color: COLORS.forest,
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      border: `1px solid ${COLORS.mist}`, whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    View Programme →
                  </Link>
                )}
              </div>
            ))}

            {revokedGrants.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8 }}>
                  Revoked Access
                </div>
                {revokedGrants.map(g => (
                  <div
                    key={g.id as string}
                    style={{
                      background: COLORS.snow,
                      border: `1px solid ${COLORS.mist}`,
                      borderRadius: 12,
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      opacity: 0.7,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.slate }}>{g.program_name ?? 'Unknown programme'}</div>
                      <div style={{ fontSize: 12, color: COLORS.stone }}>{g.org_name}</div>
                    </div>
                    <span style={{ fontSize: 12, background: '#FEE2E2', padding: '3px 10px', borderRadius: 10, fontWeight: 600, color: '#991B1B' }}>
                      Revoked
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Requests Tab ───────────────────────────────────────────────── */}
        {tab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.length === 0 && (
              <div style={{ background: '#fff', border: `1px solid ${COLORS.mist}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: COLORS.stone, margin: 0 }}>You haven't made any access requests yet.</p>
              </div>
            )}

            {requests.map(r => {
              const styles = REQUEST_STATUS_STYLES[r.status] ?? REQUEST_STATUS_STYLES.PENDING
              return (
                <div
                  key={r.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${COLORS.mist}`,
                    borderLeft: r.status === 'PENDING' ? `3px solid ${COLORS.gold}` : `1px solid ${COLORS.mist}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color: COLORS.forest }}>
                          {r.program_name ?? 'Unknown programme'}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: styles.bg, color: styles.text,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: styles.dot, display: 'inline-block' }} />
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.stone, marginBottom: 6 }}>
                        {r.org_name} · Requested {relativeTime(r.created_at)}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.slate }}>
                        Requested: {(r.requested_access_level as string).replace(/_/g, ' ')}
                        {r.message && ` · "${r.message}"`}
                      </div>
                      {r.status === 'DENIED' && r.response_message && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#FEE2E2', borderRadius: 8, fontSize: 12, color: '#991B1B' }}>
                          Response: {r.response_message as string}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
