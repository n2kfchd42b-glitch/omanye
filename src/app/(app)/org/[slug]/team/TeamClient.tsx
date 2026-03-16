'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Mail, UserPlus, ChevronDown, X, Check, AlertTriangle } from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import { createClient } from '@/lib/supabase/client'
import type { TeamMemberDB, TeamInvitation } from '@/types/team'
import type { OmanyeRole } from '@/lib/supabase/database.types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  orgSlug:        string
  organizationId: string
  userRole:       OmanyeRole
  currentUserId:  string
  members:        TeamMemberDB[]
  invitations:    TeamInvitation[]
  programs:       { id: string; name: string; status: string }[]
}

// ── Role badge styles ─────────────────────────────────────────────────────────

const ROLE_STYLE: Record<OmanyeRole, { bg: string; text: string; label: string }> = {
  NGO_ADMIN:  { bg: COLORS.forest, text: '#ffffff',   label: 'Admin'  },
  NGO_STAFF:  { bg: '#FEF3C7',     text: '#78350F',   label: 'Staff'  },
  NGO_VIEWER: { bg: '#F1F5F9',     text: '#475569',   label: 'Viewer' },
  DONOR:      { bg: '#E0F2FE',     text: '#0369A1',   label: 'Donor'  },
}

const INV_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#78350F' },
  ACCEPTED: { bg: '#DCFCE7', text: '#166534' },
  EXPIRED:  { bg: '#F1F5F9', text: '#64748B' },
  REVOKED:  { bg: '#FEE2E2', text: '#991B1B' },
}

// ── Role descriptions ─────────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<string, string> = {
  NGO_ADMIN:  'Full access — manage team, settings, and donors',
  NGO_STAFF:  'Can create and edit programs, submit field data, generate reports',
  NGO_VIEWER: 'Read-only access — view programs and reports',
}

// ── Shared input style ────────────────────────────────────────────────────────

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

// ── TeamClient ────────────────────────────────────────────────────────────────

export default function TeamClient({
  orgSlug, organizationId, userRole, currentUserId, members: initialMembers,
  invitations: initialInvitations, programs,
}: Props) {
  const router      = useRouter()
  const [, startTransition] = useTransition()
  const supabase    = createClient()
  const isAdmin     = userRole === 'NGO_ADMIN'

  const [tab,         setTab]         = useState<'members' | 'invitations'>('members')
  const [members,     setMembers]     = useState(initialMembers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [assignOpen,  setAssignOpen]  = useState<TeamMemberDB | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<TeamMemberDB | null>(null)
  const [toast,       setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleRoleChange(memberId: string, role: OmanyeRole) {
    const res = await fetch(`/api/team/${memberId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setMembers(ms => ms.map(m => m.id === memberId ? { ...m, role } : m))
      showToast('Role updated')
    } else {
      const { error } = await res.json()
      showToast(error ?? 'Failed to update role', false)
    }
  }

  async function handleRemoveMember(member: TeamMemberDB) {
    const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(ms => ms.filter(m => m.id !== member.id))
      setConfirmRemove(null)
      showToast(`${member.full_name ?? 'Member'} removed from organization`)
    } else {
      const { error } = await res.json()
      showToast(error ?? 'Failed to remove member', false)
    }
  }

  async function handleRevokeInvitation(id: string) {
    const res = await fetch(`/api/team/invitations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitations(is => is.map(i => i.id === id ? { ...i, status: 'REVOKED' } : i))
      showToast('Invitation revoked')
    } else {
      const { error } = await res.json()
      showToast(error ?? 'Failed to revoke', false)
    }
  }

  async function handleResendInvitation(inv: TeamInvitation) {
    // Create a fresh invitation for the same email/role
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     inv.email,
        full_name: inv.full_name ?? '',
        role:      inv.role,
        message:   inv.message,
      }),
    })
    if (res.ok) {
      startTransition(() => router.refresh())
      showToast('Invitation resent')
    } else {
      const { error } = await res.json()
      showToast(error ?? 'Failed to resend', false)
    }
  }

  const pendingCount = invitations.filter(i => i.status === 'PENDING').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Toast */}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: FONTS.heading, fontSize: 26, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
            Team
          </h1>
          <p style={{ fontSize: 13, color: COLORS.stone, marginTop: 4 }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
            {pendingCount > 0 && ` · ${pendingCount} pending invitation${pendingCount > 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px',
              background: COLORS.forest, color: '#ffffff',
              border: 'none', borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: FONTS.body,
            }}
          >
            <UserPlus size={15} />
            Invite Member
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `2px solid ${COLORS.mist}`,
        marginBottom: 24,
      }}>
        {(['members', 'invitations'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px',
              fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? COLORS.forest : COLORS.stone,
              borderBottom: tab === t ? `2px solid ${COLORS.forest}` : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer',
              background: 'transparent',
              fontFamily: FONTS.body,
              transition: 'color 0.15s',
            }}
          >
            {t === 'members' ? 'Members' : `Invitations${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <MembersTab
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          programs={programs}
          onRoleChange={handleRoleChange}
          onManagePrograms={m => setAssignOpen(m)}
          onRemove={m => setConfirmRemove(m)}
        />
      )}

      {/* Invitations tab */}
      {tab === 'invitations' && (
        <InvitationsTab
          invitations={invitations}
          isAdmin={isAdmin}
          onRevoke={handleRevokeInvitation}
          onResend={handleResendInvitation}
        />
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <InviteModal
          organizationId={organizationId}
          programs={programs}
          onClose={() => setInviteOpen(false)}
          onSuccess={(inv) => {
            setInvitations(is => [inv, ...is])
            setInviteOpen(false)
            showToast('Invitation sent')
          }}
        />
      )}

      {/* Assign programs modal */}
      {assignOpen && (
        <AssignProgramsModal
          member={assignOpen}
          programs={programs}
          organizationId={organizationId}
          onClose={() => setAssignOpen(null)}
          onSuccess={(memberId, newAssignments) => {
            setMembers(ms => ms.map(m =>
              m.id === memberId ? { ...m, assignments: newAssignments } : m
            ))
            setAssignOpen(null)
            showToast('Program assignments saved')
          }}
        />
      )}

      {/* Confirm remove modal */}
      {confirmRemove && (
        <ConfirmModal
          title="Remove team member"
          description={`Are you sure you want to remove ${confirmRemove.full_name ?? confirmRemove.email} from the organization? This will also remove all their program assignments.`}
          confirmLabel="Remove"
          danger
          onConfirm={() => handleRemoveMember(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}

// ── MembersTab ────────────────────────────────────────────────────────────────

function MembersTab({
  members, currentUserId, isAdmin, programs, onRoleChange, onManagePrograms, onRemove,
}: {
  members:          TeamMemberDB[]
  currentUserId:    string
  isAdmin:          boolean
  programs:         { id: string; name: string; status: string }[]
  onRoleChange:     (id: string, role: OmanyeRole) => void
  onManagePrograms: (m: TeamMemberDB) => void
  onRemove:         (m: TeamMemberDB) => void
}) {
  if (members.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Users size={40} style={{ color: COLORS.mist, margin: '0 auto 16px' }} />
        <p style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.forest, marginBottom: 8 }}>
          No team members yet
        </p>
        <p style={{ fontSize: 14, color: COLORS.stone }}>
          Invite your first team member to get started
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {members.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          isCurrentUser={member.id === currentUserId}
          isAdmin={isAdmin}
          onRoleChange={role => onRoleChange(member.id, role)}
          onManagePrograms={() => onManagePrograms(member)}
          onRemove={() => onRemove(member)}
        />
      ))}
    </div>
  )
}

// ── MemberCard ────────────────────────────────────────────────────────────────

function MemberCard({
  member, isCurrentUser, isAdmin, onRoleChange, onManagePrograms, onRemove,
}: {
  member:           TeamMemberDB
  isCurrentUser:    boolean
  isAdmin:          boolean
  onRoleChange:     (role: OmanyeRole) => void
  onManagePrograms: () => void
  onRemove:         () => void
}) {
  const [roleDropOpen, setRoleDropOpen] = useState(false)
  const roleStyle = ROLE_STYLE[member.role] ?? ROLE_STYLE.NGO_VIEWER
  const visibleAssignments = member.assignments.slice(0, 3)
  const extraCount = member.assignments.length - 3

  return (
    <div style={{
      background: isCurrentUser ? COLORS.foam : '#ffffff',
      border: `1px solid ${isCurrentUser ? COLORS.sage : COLORS.mist}`,
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: SHADOW.card,
    }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar name={member.full_name ?? member.email} size={44} />
      </div>

      {/* Name + info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: COLORS.forest }}>
            {member.full_name ?? '—'}
          </span>
          {isCurrentUser && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px',
              background: COLORS.sage, color: '#ffffff', borderRadius: 20,
            }}>You</span>
          )}
          <RoleBadge role={member.role} />
        </div>
        {member.job_title && (
          <p style={{ fontSize: 12, color: COLORS.stone, margin: '0 0 4px' }}>{member.job_title}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: COLORS.stone }}>
          <Mail size={12} />
          {member.email || '—'}
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Since {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>
        {/* Program assignments */}
        {member.assignments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {visibleAssignments.map(a => (
              <span key={a.id} style={{
                fontSize: 11, padding: '2px 8px',
                background: COLORS.foam, color: COLORS.slate,
                border: `1px solid ${COLORS.mist}`, borderRadius: 20,
              }}>
                {a.program_name ?? 'Program'}
              </span>
            ))}
            {extraCount > 0 && (
              <span style={{
                fontSize: 11, padding: '2px 8px',
                background: COLORS.foam, color: COLORS.stone, borderRadius: 20,
              }}>+{extraCount}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions (admin only) */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Role dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleDropOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px',
                border: `1px solid ${COLORS.mist}`, borderRadius: 7,
                fontSize: 12, fontWeight: 500, color: COLORS.slate,
                background: '#ffffff', cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Change Role <ChevronDown size={12} />
            </button>
            {roleDropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                background: '#ffffff', border: `1px solid ${COLORS.mist}`,
                borderRadius: 10, boxShadow: SHADOW.modal, minWidth: 220, zIndex: 50,
                overflow: 'hidden',
              }}>
                {(['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'] as OmanyeRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => { onRoleChange(role); setRoleDropOpen(false) }}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '10px 14px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, color: COLORS.slate,
                      background: member.role === role ? COLORS.foam : 'transparent',
                      cursor: 'pointer', fontFamily: FONTS.body,
                    }}
                  >
                    {member.role === role && <Check size={13} style={{ color: COLORS.sage }} />}
                    {member.role !== role && <span style={{ width: 13 }} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{ROLE_STYLE[role].label}</div>
                      <div style={{ fontSize: 11, color: COLORS.stone }}>{ROLE_DESCRIPTIONS[role]}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onManagePrograms}
            style={{
              padding: '6px 10px', border: `1px solid ${COLORS.mist}`, borderRadius: 7,
              fontSize: 12, fontWeight: 500, color: COLORS.slate,
              background: '#ffffff', cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Programs
          </button>

          {!isCurrentUser && (
            <button
              onClick={onRemove}
              style={{
                padding: '6px 10px', border: `1px solid ${COLORS.crimson}20`, borderRadius: 7,
                fontSize: 12, fontWeight: 500, color: COLORS.crimson,
                background: '#ffffff', cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── InvitationsTab ────────────────────────────────────────────────────────────

function InvitationsTab({
  invitations, isAdmin, onRevoke, onResend,
}: {
  invitations: TeamInvitation[]
  isAdmin:     boolean
  onRevoke:    (id: string) => void
  onResend:    (inv: TeamInvitation) => void
}) {
  if (invitations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Mail size={40} style={{ color: COLORS.mist, margin: '0 auto 16px' }} />
        <p style={{ fontFamily: FONTS.heading, fontSize: 18, color: COLORS.forest }}>
          No invitations sent yet
        </p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.mist}` }}>
            {['Name', 'Email', 'Role', 'Invited By', 'Sent', 'Expires', 'Status', ''].map(h => (
              <th key={h} style={{
                textAlign: 'left', padding: '8px 12px',
                fontSize: 11, fontWeight: 700, color: COLORS.stone,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invitations.map(inv => {
            const statusStyle = INV_STATUS_STYLE[inv.status] ?? INV_STATUS_STYLE.PENDING
            return (
              <tr key={inv.id} style={{ borderBottom: `1px solid ${COLORS.foam}` }}>
                <td style={{ padding: '12px 12px' }}>{inv.full_name ?? '—'}</td>
                <td style={{ padding: '12px 12px', color: COLORS.stone }}>{inv.email}</td>
                <td style={{ padding: '12px 12px' }}>
                  <RoleBadge role={inv.role} />
                </td>
                <td style={{ padding: '12px 12px', color: COLORS.stone }}>{inv.inviter_name ?? '—'}</td>
                <td style={{ padding: '12px 12px', color: COLORS.stone }}>
                  {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '12px 12px', color: COLORS.stone }}>
                  {new Date(inv.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px',
                    background: statusStyle.bg, color: statusStyle.text,
                    borderRadius: 20,
                  }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {isAdmin && (inv.status === 'PENDING' || inv.status === 'EXPIRED') && (
                      <button
                        onClick={() => onResend(inv)}
                        style={{
                          fontSize: 12, padding: '4px 10px',
                          border: `1px solid ${COLORS.mist}`, borderRadius: 6,
                          color: COLORS.slate, background: '#ffffff',
                          cursor: 'pointer', fontFamily: FONTS.body,
                        }}
                      >
                        Resend
                      </button>
                    )}
                    {isAdmin && inv.status === 'PENDING' && (
                      <button
                        onClick={() => onRevoke(inv.id)}
                        style={{
                          fontSize: 12, padding: '4px 10px',
                          border: `1px solid ${COLORS.crimson}20`, borderRadius: 6,
                          color: COLORS.crimson, background: '#ffffff',
                          cursor: 'pointer', fontFamily: FONTS.body,
                        }}
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── InviteModal ───────────────────────────────────────────────────────────────

function InviteModal({
  organizationId, programs, onClose, onSuccess,
}: {
  organizationId: string
  programs:       { id: string; name: string; status: string }[]
  onClose:        () => void
  onSuccess:      (inv: TeamInvitation) => void
}) {
  const [step, setStep]       = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [role,       setRole]       = useState<OmanyeRole>('NGO_STAFF')
  const [message,    setMessage]    = useState('')
  const [assignNow,  setAssignNow]  = useState(false)
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])

  const activePrograms = programs.filter(p => p.status !== 'COMPLETED')

  function toggleProgram(id: string) {
    setSelectedPrograms(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id])
  }

  async function handleSend() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: fullName,
          role,
          message:   message || null,
          program_ids: assignNow ? selectedPrograms : [],
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to send invitation'); return }
      onSuccess(json.data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 28, maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
              Invite Team Member
            </h2>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 4 }}>
              Step {step} of 2
            </p>
          </div>
          <button onClick={onClose} style={{ color: COLORS.stone, cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2', color: COLORS.crimson,
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <FormField label="Full Name">
              <input
                style={inputStyle} value={fullName} placeholder="Jane Doe"
                onChange={e => setFullName(e.target.value)}
              />
            </FormField>

            <FormField label="Email Address">
              <input
                style={inputStyle} value={email} type="email" placeholder="jane@org.org"
                onChange={e => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Role">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'] as OmanyeRole[]).map(r => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px',
                    border: `1px solid ${role === r ? COLORS.sage : COLORS.mist}`,
                    borderRadius: 9, cursor: 'pointer',
                    background: role === r ? COLORS.foam : '#ffffff',
                  }}>
                    <input
                      type="radio" checked={role === r} onChange={() => setRole(r)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.forest }}>
                        {ROLE_STYLE[r].label}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>
                        {ROLE_DESCRIPTIONS[r]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="Personal Message (optional)">
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={message} placeholder="Add a personal note…"
                onChange={e => setMessage(e.target.value)}
              />
            </FormField>

            <button
              onClick={() => {
                if (!email || !fullName) { setError('Name and email are required'); return }
                setError(null)
                setStep(2)
              }}
              style={{
                width: '100%', padding: '11px 0',
                background: COLORS.forest, color: '#ffffff',
                border: 'none', borderRadius: 9,
                fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
              }}
            >
              Next: Program Access →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={assignNow} onChange={e => setAssignNow(e.target.checked)} />
              <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.forest }}>
                Assign to programs now?
              </span>
            </label>

            {assignNow && activePrograms.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activePrograms.map(p => (
                  <label key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    border: `1px solid ${selectedPrograms.includes(p.id) ? COLORS.sage : COLORS.mist}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: selectedPrograms.includes(p.id) ? COLORS.foam : '#ffffff',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedPrograms.includes(p.id)}
                      onChange={() => toggleProgram(p.id)}
                    />
                    <span style={{ fontSize: 13, color: COLORS.forest }}>{p.name}</span>
                  </label>
                ))}
              </div>
            )}

            <p style={{ fontSize: 12, color: COLORS.stone, margin: 0 }}>
              You can always assign programs later from the team member&apos;s card.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: '11px 0',
                  background: COLORS.foam, color: COLORS.forest,
                  border: `1px solid ${COLORS.mist}`, borderRadius: 9,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
                }}
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  flex: 2, padding: '11px 0',
                  background: loading ? COLORS.mist : COLORS.forest,
                  color: loading ? COLORS.stone : '#ffffff',
                  border: 'none', borderRadius: 9,
                  fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: FONTS.body,
                }}
              >
                {loading ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}

// ── AssignProgramsModal ───────────────────────────────────────────────────────

function AssignProgramsModal({
  member, programs, organizationId, onClose, onSuccess,
}: {
  member:         TeamMemberDB
  programs:       { id: string; name: string; status: string }[]
  organizationId: string
  onClose:        () => void
  onSuccess:      (memberId: string, assignments: TeamMemberDB['assignments']) => void
}) {
  const currentAssigned = new Set(member.assignments.map(a => a.program_id))
  const [selected,  setSelected]  = useState<Set<string>>(new Set(currentAssigned))
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  function toggle(id: string) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const toAdd    = Array.from(selected).filter(id => !currentAssigned.has(id))
      const toRemove = member.assignments.filter(a => !selected.has(a.program_id))

      // Add new assignments
      for (const programId of toAdd) {
        await fetch('/api/team/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ program_id: programId, profile_id: member.id }),
        })
      }

      // Remove unselected assignments
      for (const a of toRemove) {
        await fetch(`/api/team/assignments/${a.id}`, { method: 'DELETE' })
      }

      // Build updated assignment list for optimistic UI
      const progMap = Object.fromEntries(programs.map(p => [p.id, p]))
      const newAssignments: TeamMemberDB['assignments'] = Array.from(selected).map(pid => {
        const existing = member.assignments.find(a => a.program_id === pid)
        if (existing) return existing
        return {
          id:              `temp-${pid}`,
          program_id:      pid,
          profile_id:      member.id,
          organization_id: organizationId,
          assigned_by:     '',
          assigned_at:     new Date().toISOString(),
          program_name:    progMap[pid]?.name ?? null,
          program_status:  progMap[pid]?.status ?? null,
        }
      })

      onSuccess(member.id, newAssignments)
    } catch {
      setError('Failed to save assignments')
    } finally {
      setLoading(false)
    }
  }

  const roleStyle = ROLE_STYLE[member.role] ?? ROLE_STYLE.NGO_VIEWER

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ padding: 28, maxWidth: 440, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
            Manage Programs
          </h2>
          <button onClick={onClose} style={{ color: COLORS.stone, cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Avatar name={member.full_name ?? member.email} size={28} />
          <span style={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
            {member.full_name ?? member.email}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            background: roleStyle.bg, color: roleStyle.text,
          }}>
            {roleStyle.label}
          </span>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: COLORS.crimson, padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
          {programs.map(p => (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              border: `1px solid ${selected.has(p.id) ? COLORS.sage : COLORS.mist}`,
              borderRadius: 8, cursor: 'pointer',
              background: selected.has(p.id) ? COLORS.foam : '#ffffff',
            }}>
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
              />
              <span style={{ fontSize: 13, color: COLORS.forest, flex: 1 }}>{p.name}</span>
              <span style={{
                fontSize: 11, padding: '2px 6px', borderRadius: 10,
                background: p.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                color: p.status === 'ACTIVE' ? '#166534' : '#64748B',
              }}>
                {p.status}
              </span>
            </label>
          ))}
          {programs.length === 0 && (
            <p style={{ fontSize: 13, color: COLORS.stone, textAlign: 'center', padding: '20px 0' }}>
              No programs yet
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 0',
              background: COLORS.foam, color: COLORS.forest,
              border: `1px solid ${COLORS.mist}`, borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 2, padding: '10px 0',
              background: loading ? COLORS.mist : COLORS.forest,
              color: loading ? COLORS.stone : '#ffffff',
              border: 'none', borderRadius: 9,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.body,
            }}
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: OmanyeRole }) {
  const s = ROLE_STYLE[role] ?? ROLE_STYLE.NGO_VIEWER
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.text,
    }}>
      {s.label}
    </span>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.charcoal, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(13,43,30,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: '#ffffff', borderRadius: 16,
        boxShadow: SHADOW.modal,
        maxHeight: '90vh', overflowY: 'auto',
        width: '100%',
      }}>
        {children}
      </div>
    </div>
  )
}

function ConfirmModal({
  title, description, confirmLabel, danger, onConfirm, onCancel,
}: {
  title:         string
  description:   string
  confirmLabel:  string
  danger?:       boolean
  onConfirm:     () => void
  onCancel:      () => void
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ padding: 28, maxWidth: 420, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {danger && <AlertTriangle size={20} style={{ color: COLORS.crimson, flexShrink: 0 }} />}
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
            {title}
          </h2>
        </div>
        <p style={{ fontSize: 14, color: COLORS.slate, lineHeight: 1.6, marginBottom: 24 }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0',
              background: COLORS.foam, color: COLORS.forest,
              border: `1px solid ${COLORS.mist}`, borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0',
              background: danger ? COLORS.crimson : COLORS.forest,
              color: '#ffffff', border: 'none', borderRadius: 9,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONTS.body,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
