'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  HandCoins, Plus, ChevronRight, Users, Mail, Clock, AlertCircle,
  CheckCircle, XCircle, RotateCcw, Trash2, Eye, Loader2,
  MessageSquare, Calendar, Building2, Send,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import { FormField, Input, Select, Textarea } from '@/components/atoms/FormField'
import { AccessLevelBadge } from '@/components/AccessLevelBadge'
import { formatDate, todayISO } from '@/lib/utils'
import {
  inviteDonor,
  revokeInvitation,
  approveAccessRequest,
  denyAccessRequest,
  listAccessRequests,
} from '@/app/actions/donors'
import type { DonorRelationship, DonorInvitation } from '@/lib/donors'
import type { DonorAccessRequest } from '@/lib/auth/types'
import type { AccessLevel, OmanyeRole } from '@/lib/supabase/database.types'
import {
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_COLORS,
} from '@/lib/donors'
import { ACCESS_LEVEL_LABELS, ACCESS_LEVEL_DESCRIPTIONS } from '@/lib/auth/types'
import { createClient } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  orgSlug:             string
  organizationId:      string
  userRole:            OmanyeRole
  donors:              DonorRelationship[]
  invitations:         DonorInvitation[]
  accessRequests:      (DonorAccessRequest & { donor_name: string | null; donor_org: string | null; program_name: string | null })[]
  programs:            { id: string; name: string; status: string }[]
  pendingRequestCount: number
  currentUserId:       string
}

type TabId = 'donors' | 'invitations' | 'requests'

const ACCESS_LEVEL_ORDER: Record<AccessLevel, number> = {
  SUMMARY_ONLY: 0, INDICATORS: 1, INDICATORS_AND_BUDGET: 2, FULL: 3,
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DonorsClient({
  orgSlug, organizationId, userRole, donors, invitations, accessRequests,
  programs, pendingRequestCount, currentUserId,
}: Props) {
  const router     = useRouter()
  const isAdmin    = userRole === 'NGO_ADMIN'
  const [tab, setTab]       = useState<TabId>('donors')
  const [showInvite, setShowInvite] = useState(false)
  const [livePendingCount, setLivePendingCount] = useState(pendingRequestCount)

  // ── Realtime: pending access request badge ─────────────────────────────────
  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
    try {
      supabase = createClient()
      channel = supabase
        .channel('ngo-access-requests-' + organizationId)
        .on(
          'postgres_changes',
          {
            event:  '*',
            schema: 'public',
            table:  'donor_access_requests',
            filter: `organization_id=eq.${organizationId}`,
          },
          async () => {
            if (!supabase) return
            const { count } = await supabase
              .from('donor_access_requests')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', organizationId)
              .eq('status', 'PENDING')
            setLivePendingCount(count ?? 0)
          }
        )
        .subscribe()
    } catch { /* Realtime unavailable (e.g. insecure WebSocket in dev) */ }

    return () => {
      if (supabase && channel) supabase.removeChannel(channel)
    }
  }, [organizationId])

  const totalDonors      = donors.length
  const activeAccess     = donors.reduce((acc, d) => acc + d.access.filter(a => a.active).length, 0)
  const pendingInvites   = invitations.filter(i => i.status === 'PENDING').length

  return (
    <div>
      {/* Header */}
      <div style={{
        background: COLORS.forest, borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: 24, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HandCoins size={20} color={COLORS.gold} />
              <h1 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
                Donor Management
              </h1>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowInvite(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                  background: COLORS.gold, color: COLORS.forest,
                  border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} /> Invite Donor
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Donors',       value: totalDonors,      icon: <Users size={14} /> },
              { label: 'Active Access',       value: activeAccess,     icon: <CheckCircle size={14} /> },
              { label: 'Pending Invites',     value: pendingInvites,   icon: <Mail size={14} /> },
              { label: 'Pending Requests',    value: livePendingCount, icon: <AlertCircle size={14} />, highlight: livePendingCount > 0 },
            ].map(card => (
              <div key={card.label} style={{
                flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10,
                padding: '12px 16px', border: card.highlight ? `1px solid ${COLORS.gold}55` : '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ color: card.highlight ? COLORS.gold : 'rgba(255,255,255,0.4)' }}>{card.icon}</span>
                  {card.label}
                  {card.highlight && card.value > 0 && (
                    <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{card.value}</span>
                  )}
                </div>
                <div style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: '#fff' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              { id: 'donors',      label: 'All Donors',       count: totalDonors },
              { id: 'invitations', label: 'Invitations',      count: invitations.length },
              { id: 'requests',    label: 'Access Requests',  count: livePendingCount, badge: livePendingCount > 0 },
            ] as { id: TabId; label: string; count: number; badge?: boolean }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                  color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t.id ? COLORS.gold : 'transparent'}`,
                  cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                {t.label}
                <span style={{
                  background: tab === t.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                  color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderRadius: 10, padding: '1px 7px', fontSize: 11,
                }}>
                  {t.count}
                </span>
                {t.badge && t.count > 0 && (
                  <span style={{ background: '#EF4444', color: '#fff', borderRadius: '50%', width: 8, height: 8, display: 'inline-block' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
        {tab === 'donors' && (
          <DonorsTab
            donors={donors}
            orgSlug={orgSlug}
            isAdmin={isAdmin}
          />
        )}
        {tab === 'invitations' && (
          <InvitationsTab
            invitations={invitations}
            isAdmin={isAdmin}
            onRevoke={async (id) => {
              await revokeInvitation(id)
              router.refresh()
            }}
          />
        )}
        {tab === 'requests' && (
          <RequestsTab
            requests={accessRequests}
            organizationId={organizationId}
            isAdmin={isAdmin}
            onRefresh={() => router.refresh()}
          />
        )}
      </div>

      {/* Invite Donor Modal */}
      {showInvite && (
        <InviteDonorModal
          organizationId={organizationId}
          programs={programs}
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); router.refresh() }}
        />
      )}
    </div>
  )
}

// ── All Donors Tab ────────────────────────────────────────────────────────────

function DonorsTab({ donors, orgSlug, isAdmin }: {
  donors:   DonorRelationship[]
  orgSlug:  string
  isAdmin:  boolean
}) {
  const router = useRouter()

  if (donors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <div style={{ marginBottom: 20, opacity: 0.12 }}>
          <svg viewBox="0 0 80 80" width={80} style={{ margin: '0 auto', display: 'block' }} fill="none">
            <circle cx="40" cy="40" r="38" stroke={COLORS.forest} strokeWidth="1.5"/>
            <circle cx="40" cy="40" r="26" stroke={COLORS.forest} strokeWidth="1.5"/>
            <circle cx="40" cy="40" r="12" stroke={COLORS.forest} strokeWidth="1.5"/>
          </svg>
        </div>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 8 }}>
          No donors yet
        </h3>
        <p style={{ fontSize: 13, color: COLORS.slate, maxWidth: 340, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Invite your first donor to share program progress securely.
        </p>
      </div>
    )
  }

  function relativeTime(dateStr: string | null): string {
    if (!dateStr) return 'Never accessed'
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Viewed today'
    if (days === 1) return 'Viewed yesterday'
    if (days < 30) return `Viewed ${days} days ago`
    const months = Math.floor(days / 30)
    return `Viewed ${months}mo ago`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {donors.map(donor => {
        const lastViewed = donor.access.reduce((latest, a) => {
          if (!a.last_viewed_at) return latest
          if (!latest) return a.last_viewed_at
          return a.last_viewed_at > latest ? a.last_viewed_at : latest
        }, null as string | null)

        return (
          <div key={donor.donor_id} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={donor.full_name ?? donor.email} size={40} style={{ flexShrink: 0 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.charcoal }}>
                  {donor.full_name ?? donor.email}
                </span>
                {donor.organization_name && (
                  <span style={{ fontSize: 12, color: COLORS.stone, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building2 size={11} /> {donor.organization_name}
                  </span>
                )}
              </div>

              {/* Program access pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {donor.access.slice(0, 3).map(a => (
                  <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: COLORS.slate }}>
                    <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.program_name ?? 'Program'}
                    </span>
                    <AccessLevelBadge level={a.access_level} size="sm" showTooltip />
                  </span>
                ))}
                {donor.access.length > 3 && (
                  <span style={{ fontSize: 11, color: COLORS.stone }}>+{donor.access.length - 3} more</span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: 12, color: COLORS.stone, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 4 }}>
                <Clock size={11} />
                {relativeTime(lastViewed)}
              </div>
            </div>

            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => router.push(`/org/${orgSlug}/donors/${donor.donor_id}/templates`)}
                  style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: COLORS.foam, color: COLORS.slate, border: `1px solid ${COLORS.mist}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <MessageSquare size={12} /> Templates
                </button>
                <button
                  onClick={() => router.push(`/org/${orgSlug}/donors/${donor.donor_id}`)}
                  style={{
                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: COLORS.foam, color: COLORS.fern, border: `1px solid ${COLORS.mist}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  Manage <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Invitations Tab ───────────────────────────────────────────────────────────

function InvitationsTab({ invitations, isAdmin, onRevoke }: {
  invitations: DonorInvitation[]
  isAdmin:     boolean
  onRevoke:    (id: string) => Promise<void>
}) {
  const [revoking, setRevoking] = useState<string | null>(null)

  if (invitations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
        No invitations sent yet.
      </div>
    )
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this invitation?')) return
    setRevoking(id)
    await onRevoke(id)
    setRevoking(null)
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: COLORS.snow }}>
            {['Donor', 'Email', 'Organization', 'Program', 'Access', 'Sent', 'Status', ...(isAdmin ? [''] : [])].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: COLORS.slate, borderBottom: `1px solid ${COLORS.mist}` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv, i) => {
            const sc = INVITATION_STATUS_COLORS[inv.status]
            return (
              <tr key={inv.id} style={{ borderBottom: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#1A2B4A' : COLORS.snow }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{inv.donor_name ?? '—'}</td>
                <td style={{ padding: '10px 14px', color: COLORS.slate }}>{inv.email}</td>
                <td style={{ padding: '10px 14px', color: COLORS.slate }}>{inv.organization_name ?? '—'}</td>
                <td style={{ padding: '10px 14px', color: COLORS.slate }}>{inv.program_name ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <AccessLevelBadge level={inv.access_level} size="sm" />
                </td>
                <td style={{ padding: '10px 14px', color: COLORS.stone, whiteSpace: 'nowrap' }}>{formatDate(inv.created_at)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                    {INVITATION_STATUS_LABELS[inv.status]}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          disabled={revoking === inv.id}
                          style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, background: '#FEE2E2', color: COLORS.crimson, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {revoking === inv.id ? <Loader2 size={11} /> : <XCircle size={11} />} Revoke
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Access Requests Tab ───────────────────────────────────────────────────────

function RequestsTab({ requests, organizationId, isAdmin, onRefresh }: {
  requests:       (DonorAccessRequest & { donor_name: string | null; donor_org: string | null; program_name: string | null })[]
  organizationId: string
  isAdmin:        boolean
  onRefresh:      () => void
}) {
  const [approveId, setApproveId]   = useState<string | null>(null)
  const [denyId, setDenyId]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState<string | null>(null)

  const pending  = requests.filter(r => r.status === 'PENDING')
  const resolved = requests.filter(r => r.status !== 'PENDING')

  if (requests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: COLORS.stone, fontSize: 14 }}>
        No access requests yet.
      </div>
    )
  }

  function RequestCard({ req }: { req: typeof requests[0] }) {
    const isPendingCard = req.status === 'PENDING'
    return (
      <div className="card" style={{
        padding: '18px 22px', borderLeft: isPendingCard ? `3px solid ${COLORS.gold}` : `3px solid transparent`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar name={req.donor_name ?? req.donor_id} size={36} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.charcoal }}>
                {req.donor_name ?? 'Unknown donor'}
              </span>
              {req.donor_org && (
                <span style={{ fontSize: 12, color: COLORS.stone }}>· {req.donor_org}</span>
              )}
              <span style={{ fontSize: 11, color: COLORS.stone, marginLeft: 'auto' }}>
                {formatDate(req.created_at)}
              </span>
            </div>
            <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 8 }}>
              Requesting access to: <strong>{req.program_name ?? 'Unknown program'}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: req.message ? 10 : 0 }}>
              <span style={{ fontSize: 12, color: COLORS.stone }}>Requested level:</span>
              <AccessLevelBadge level={req.requested_access_level} size="sm" showTooltip />
            </div>
            {req.message && (
              <div style={{ background: COLORS.foam, border: `1px solid ${COLORS.mist}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: COLORS.charcoal, lineHeight: 1.6, marginTop: 8 }}>
                <MessageSquare size={11} style={{ display: 'inline', marginRight: 5, color: COLORS.stone }} />
                {req.message}
              </div>
            )}
            {req.response_message && req.status !== 'PENDING' && (
              <div style={{ marginTop: 10, fontSize: 12, color: COLORS.slate, background: COLORS.snow, borderRadius: 6, padding: '8px 12px' }}>
                <strong>NGO response:</strong> {req.response_message}
              </div>
            )}
          </div>
          {isAdmin && isPendingCard && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setDenyId(req.id)}
                style={{ padding: '7px 14px', fontSize: 12, borderRadius: 7, background: '#FEE2E2', color: COLORS.crimson, border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <XCircle size={13} /> Deny
              </button>
              <button
                onClick={() => setApproveId(req.id)}
                style={{ padding: '7px 14px', fontSize: 12, borderRadius: 7, background: COLORS.fern, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <CheckCircle size={13} /> Approve
              </button>
            </div>
          )}
          {!isPendingCard && (
            <span style={{
              padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
              background: req.status === 'APPROVED' ? '#38A16920' : '#FEE2E2',
              color: req.status === 'APPROVED' ? '#38A169' : '#991B1B',
              flexShrink: 0,
            }}>
              {req.status}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Pending · {pending.length}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Resolved · {resolved.length}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resolved.map(r => <RequestCard key={r.id} req={r} />)}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveId && (() => {
        const req = requests.find(r => r.id === approveId)!
        return (
          <ApproveModal
            req={req}
            organizationId={organizationId}
            onClose={() => setApproveId(null)}
            onSuccess={() => { setApproveId(null); onRefresh() }}
            setError={setError}
          />
        )
      })()}

      {/* Deny Modal */}
      {denyId && (() => {
        const req = requests.find(r => r.id === denyId)!
        return (
          <DenyModal
            req={req}
            organizationId={organizationId}
            onClose={() => setDenyId(null)}
            onSuccess={() => { setDenyId(null); onRefresh() }}
            setError={setError}
          />
        )
      })()}
    </div>
  )
}

// ── Approve Modal ─────────────────────────────────────────────────────────────

function ApproveModal({ req, organizationId, onClose, onSuccess, setError }: {
  req:            DonorAccessRequest & { donor_name: string | null; program_name: string | null }
  organizationId: string
  onClose:        () => void
  onSuccess:      () => void
  setError:       (e: string | null) => void
}) {
  const [level, setLevel] = useState<AccessLevel>(req.requested_access_level)
  const [isPending, startTransition] = useTransition()

  const levelOptions = (Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]).map(l => ({
    value: l, label: ACCESS_LEVEL_LABELS[l],
  }))

  function handleApprove() {
    startTransition(async () => {
      setError(null)
      const { error } = await approveAccessRequest(req.id, organizationId, { access_level: level })
      if (error) { setError(error); return }
      onSuccess()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 28, boxShadow: SHADOW.modal }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>Approve Access Request</h3>
        <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 20 }}>
          {req.donor_name ?? 'Donor'} · {req.program_name ?? 'Program'}
        </p>
        <FormField label="Grant access level">
          <Select options={levelOptions} value={level} onChange={e => setLevel(e.target.value as AccessLevel)} />
        </FormField>
        <div style={{ padding: '10px 14px', borderRadius: 8, background: COLORS.foam, border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.slate, marginTop: 10, marginBottom: 20 }}>
          {ACCESS_LEVEL_DESCRIPTIONS[level]}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#1A2B4A', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleApprove} disabled={isPending} style={{ padding: '9px 20px', borderRadius: 8, background: COLORS.fern, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isPending && <Loader2 size={13} className="animate-spin" />}
            <CheckCircle size={13} /> Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deny Modal ────────────────────────────────────────────────────────────────

function DenyModal({ req, organizationId, onClose, onSuccess, setError }: {
  req:            DonorAccessRequest & { donor_name: string | null; program_name: string | null }
  organizationId: string
  onClose:        () => void
  onSuccess:      () => void
  setError:       (e: string | null) => void
}) {
  const [message, setMessage]        = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDeny() {
    if (!message.trim()) return
    startTransition(async () => {
      setError(null)
      const { error } = await denyAccessRequest(req.id, organizationId, { response_message: message })
      if (error) { setError(error); return }
      onSuccess()
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 28, boxShadow: SHADOW.modal }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>Deny Access Request</h3>
        <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 20 }}>
          {req.donor_name ?? 'Donor'} · {req.program_name ?? 'Program'}
        </p>
        <FormField label="Response to donor (required)" required>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Explain why the request is being denied…"
          />
        </FormField>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#1A2B4A', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleDeny} disabled={isPending || !message.trim()} style={{ padding: '9px 20px', borderRadius: 8, background: '#FEE2E2', color: COLORS.crimson, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !message.trim() ? 0.5 : 1 }}>
            {isPending && <Loader2 size={13} />}
            <XCircle size={13} /> Deny Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Invite Donor Modal ────────────────────────────────────────────────────────

function InviteDonorModal({ organizationId, programs, onClose, onSuccess }: {
  organizationId: string
  programs:       { id: string; name: string; status: string }[]
  onClose:        () => void
  onSuccess:      () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    email:             '',
    donor_name:        '',
    organization_name: '',
    message:           '',
    program_id:        '',
    access_level:      'SUMMARY_ONLY' as AccessLevel,
    can_download_reports: false,
    expires_at:        '',
    use_expiry:        false,
  })

  function set(key: string, val: unknown) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const progOptions = [
    { value: '', label: 'Select a program…' },
    ...programs.map(p => ({ value: p.id, label: p.name })),
  ]
  const levelOptions = (Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]).map(l => ({
    value: l, label: ACCESS_LEVEL_LABELS[l],
  }))

  function validateStep1() {
    if (!form.email.trim())   { setError('Email is required'); return false }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email'); return false }
    return true
  }

  function validateStep2() {
    if (!form.program_id) { setError('Select a program'); return false }
    return true
  }

  function handleNext() {
    setError(null)
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  function handleSend() {
    startTransition(async () => {
      setError(null)
      const { error } = await inviteDonor(organizationId, {
        email:                form.email.trim(),
        donor_name:           form.donor_name.trim() || undefined,
        organization_name:    form.organization_name.trim() || undefined,
        message:              form.message.trim() || undefined,
        program_id:           form.program_id,
        access_level:         form.access_level,
        can_download_reports: form.can_download_reports,
        expires_at:           form.use_expiry && form.expires_at ? form.expires_at : undefined,
      })
      if (error) { setError(error); return }
      onSuccess()
    })
  }

  const selectedProgram = programs.find(p => p.id === form.program_id)

  const STEP_LABELS = ['Donor Details', 'Program & Access', 'Review & Send']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: 0, boxShadow: SHADOW.modal, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal header */}
        <div style={{ background: COLORS.forest, padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
              Invite Donor
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6 }}>
            {STEP_LABELS.map((label, i) => {
              const s = (i + 1) as 1 | 2 | 3
              const active = s === step
              const done   = s < step
              return (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: active ? COLORS.gold : done ? COLORS.fern : 'rgba(255,255,255,0.15)', color: active ? COLORS.forest : '#fff', flexShrink: 0 }}>
                      {done ? '✓' : s}
                    </span>
                    <span style={{ fontSize: 11, color: active ? COLORS.gold : done ? COLORS.sage : 'rgba(255,255,255,0.4)', fontWeight: active ? 700 : 400 }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ height: 2, background: done ? COLORS.fern : 'rgba(255,255,255,0.1)', borderRadius: 1 }} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>{error}</div>}

          {step === 1 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <FormField label="Email address" required>
                <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="donor@organization.org" />
              </FormField>
              <FormField label="Full name">
                <Input value={form.donor_name} onChange={e => set('donor_name', e.target.value)} placeholder="e.g. Sarah Mensah" />
              </FormField>
              <FormField label="Organization (e.g. GIZ, USAID, Wellcome Trust)">
                <Input value={form.organization_name} onChange={e => set('organization_name', e.target.value)} placeholder="Donor's organization" />
              </FormField>
              <FormField label="Personal message (optional)">
                <Textarea
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  rows={3}
                  placeholder={`Hi ${form.donor_name?.split(' ')[0] || '[name]'}, we'd like to share progress on our community program with you…`}
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <FormField label="Program" required>
                <Select options={progOptions} value={form.program_id} onChange={e => set('program_id', e.target.value)} />
              </FormField>
              <FormField label="Access level" required>
                <Select options={levelOptions} value={form.access_level} onChange={e => set('access_level', e.target.value as AccessLevel)} />
              </FormField>
              <div style={{ padding: '12px 14px', borderRadius: 8, background: COLORS.foam, border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.slate }}>
                {ACCESS_LEVEL_DESCRIPTIONS[form.access_level]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="download" checked={form.can_download_reports} onChange={e => set('can_download_reports', e.target.checked)} style={{ width: 15, height: 15 }} />
                <label htmlFor="download" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                  Allow donor to download reports
                </label>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: form.use_expiry ? 10 : 0 }}>
                  <input type="checkbox" id="expiry" checked={form.use_expiry} onChange={e => set('use_expiry', e.target.checked)} style={{ width: 15, height: 15 }} />
                  <label htmlFor="expiry" style={{ fontSize: 13, color: COLORS.charcoal, cursor: 'pointer' }}>
                    Set access expiry date
                  </label>
                </div>
                {form.use_expiry && (
                  <FormField label="Expiry date">
                    <Input type="date" value={form.expires_at} min={todayISO()} onChange={e => set('expires_at', e.target.value)} />
                  </FormField>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              {/* Email preview card */}
              <div style={{ background: '#0F1B33', border: `1px solid ${COLORS.mist}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ background: COLORS.forest, padding: '16px 20px' }}>
                  <span style={{ fontFamily: 'Palatino,Georgia,serif', fontSize: 16, fontWeight: 700, color: COLORS.gold }}>OMANYE</span>
                </div>
                <div style={{ padding: '20px 20px' }}>
                  <p style={{ fontSize: 13, color: COLORS.charcoal, marginBottom: 10, lineHeight: 1.6 }}>
                    {form.donor_name ? `Hi ${form.donor_name.split(' ')[0]},` : 'Hello,'}
                  </p>
                  {form.message && (
                    <div style={{ background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderLeft: `3px solid ${COLORS.gold}`, padding: '10px 14px', borderRadius: '0 6px 6px 0', marginBottom: 12, fontSize: 13, color: COLORS.charcoal, fontStyle: 'italic' }}>
                      "{form.message}"
                    </div>
                  )}
                  <div style={{ background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Program</div>
                    <div style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color: COLORS.forest }}>{selectedProgram?.name ?? '—'}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: COLORS.stone, marginBottom: 6 }}>Access level:</div>
                    <AccessLevelBadge level={form.access_level} size="md" showTooltip />
                  </div>
                  <div style={{ background: COLORS.gold, color: COLORS.forest, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: 'center', display: 'inline-block' }}>
                    Accept Invitation →
                  </div>
                  <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 12 }}>
                    Expires in 14 days. An account will be created if they don't have one.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', fontSize: 13, color: COLORS.slate, marginBottom: 8 }}>
                <div><strong style={{ color: COLORS.charcoal }}>To:</strong> {form.email}</div>
                <div><strong style={{ color: COLORS.charcoal }}>Program:</strong> {selectedProgram?.name ?? '—'}</div>
                <div><strong style={{ color: COLORS.charcoal }}>Access:</strong> {ACCESS_LEVEL_LABELS[form.access_level]}</div>
                {form.can_download_reports && <div style={{ color: COLORS.fern }}>✓ Can download reports</div>}
                {form.use_expiry && form.expires_at && <div><strong style={{ color: COLORS.charcoal }}>Expires:</strong> {formatDate(form.expires_at)}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${COLORS.mist}`, display: 'flex', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
          <button
            onClick={step === 1 ? onClose : () => setStep((step - 1) as 1 | 2 | 3)}
            style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#1A2B4A', color: COLORS.slate, fontSize: 13, cursor: 'pointer' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button onClick={handleNext} style={{ padding: '9px 20px', borderRadius: 8, background: COLORS.forest, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Next →
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isPending}
              style={{ padding: '9px 20px', borderRadius: 8, background: COLORS.gold, color: COLORS.forest, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send Invitation
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
