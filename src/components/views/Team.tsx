'use client'

import React, { useState } from 'react'
import { Plus, Users, Mail, CheckCircle2, Clock } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { RoleBadge }  from '@/components/atoms/Badge'
import { Avatar }     from '@/components/atoms/Avatar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField, Input, Select } from '@/components/atoms/FormField'
import { useModal, ModalFooter } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { nextId, todayISO } from '@/lib/utils'
import type { TeamMember, UserRole } from '@/lib/types'

// ── Invite form ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'Project Lead', label: 'Project Lead' },
  { value: 'M&E Officer',  label: 'M&E Officer'  },
  { value: 'Field Staff',  label: 'Field Staff'  },
  { value: 'Supervisor',   label: 'Supervisor'   },
  { value: 'Donor',        label: 'Donor'        },
  { value: 'Viewer',       label: 'Viewer'       },
  { value: 'Admin',        label: 'Admin'        },
]

function InviteForm({ onSave }: { onSave: (m: TeamMember) => void }) {
  const { close } = useModal()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState<UserRole>('Field Staff')
  const [org,   setOrg]   = useState('')

  function handleInvite() {
    if (!name.trim() || !email.trim()) return
    onSave({
      id: nextId(),
      name: name.trim(),
      email: email.trim(),
      role,
      org: org.trim(),
      status: 'pending',
      joined: todayISO(),
    })
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Full name" required htmlFor="inv-name">
        <Input id="inv-name" placeholder="e.g. Kofi Mensah" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <FormField label="Email address" required htmlFor="inv-email">
        <Input id="inv-email" type="email" placeholder="kofi@org.org" value={email} onChange={e => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Role" htmlFor="inv-role">
        <Select id="inv-role" options={ROLE_OPTIONS} value={role} onChange={e => setRole(e.target.value as UserRole)} />
      </FormField>
      <FormField label="Organisation" htmlFor="inv-org">
        <Input id="inv-org" placeholder="Their organisation (optional)" value={org} onChange={e => setOrg(e.target.value)} />
      </FormField>
      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleInvite}
          disabled={!name.trim() || !email.trim()}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: name.trim() && email.trim() ? COLORS.moss : COLORS.mist,
            color: name.trim() && email.trim() ? COLORS.forest : COLORS.stone,
            cursor: name.trim() && email.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send Invite
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Role permissions legend ───────────────────────────────────────────────────

const ROLE_PERMISSIONS: { role: UserRole; read: boolean; write: boolean; manage: boolean }[] = [
  { role: 'Admin',        read: true,  write: true,  manage: true  },
  { role: 'Project Lead', read: true,  write: true,  manage: true  },
  { role: 'M&E Officer',  read: true,  write: true,  manage: false },
  { role: 'Supervisor',   read: true,  write: true,  manage: false },
  { role: 'Field Staff',  read: true,  write: true,  manage: false },
  { role: 'Donor',        read: true,  write: false, manage: false },
  { role: 'Viewer',       read: true,  write: false, manage: false },
]

function PermissionDot({ has }: { has: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, borderRadius: '50%',
      background: has ? COLORS.foam : 'transparent',
    }}>
      {has
        ? <CheckCircle2 size={13} style={{ color: COLORS.sage }} />
        : <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.mist, display: 'block' }} />
      }
    </span>
  )
}

// ── Team view ─────────────────────────────────────────────────────────────────

interface TeamProps {
  team:    TeamMember[]
  setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>
}

export function Team({ team, setTeam }: TeamProps) {
  const { open }    = useModal()
  const { success } = useToast()

  function openInvite() {
    open({
      title: 'Invite Team Member',
      content: (
        <InviteForm
          onSave={(m) => {
            setTeam(prev => [...prev, m])
            success(`Invite sent to ${m.email}`)
          }}
        />
      ),
    })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Team</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{team.length} member{team.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openInvite}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: COLORS.moss, color: COLORS.forest, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Invite Member
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Members */}
        <div className="fade-up-1">
          {team.length === 0 ? (
            <div className="card" style={{ padding: 0 }}>
              <EmptyState
                icon={<Users size={24} />}
                title="No team members yet"
                description="Invite colleagues to collaborate on programs, data, and documents."
                action={
                  <button
                    onClick={openInvite}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 18px', borderRadius: 8,
                      background: COLORS.moss, color: COLORS.forest, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Invite First Member
                  </button>
                }
              />
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: COLORS.snow }}>
                    {['Member', 'Role', 'Status', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: COLORS.stone, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.map((m, i) => (
                    <tr key={m.id} style={{ borderTop: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? COLORS.pearl : COLORS.snow }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={m.name} size={32} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{m.name}</p>
                            <p style={{ fontSize: 11, color: COLORS.stone }}>{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><RoleBadge role={m.role} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          {m.status === 'active'
                            ? <><CheckCircle2 size={12} style={{ color: COLORS.sage }} /><span style={{ color: COLORS.fern }}>Active</span></>
                            : <><Clock size={12} style={{ color: COLORS.amber }} /><span style={{ color: COLORS.amber }}>Pending</span></>
                          }
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.stone }}>{m.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role permissions legend */}
        <div className="card fade-up-2" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: FONTS.heading, fontSize: 14, fontWeight: 600, color: COLORS.forest, marginBottom: 14 }}>
            Role Permissions
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textAlign: 'left', paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</th>
                  <th style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textAlign: 'center', paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Read</th>
                  <th style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textAlign: 'center', paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Write</th>
                  <th style={{ fontSize: 10, fontWeight: 700, color: COLORS.stone, textAlign: 'center', paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manage</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_PERMISSIONS.map(rp => (
                  <tr key={rp.role} style={{ borderTop: `1px solid ${COLORS.mist}` }}>
                    <td style={{ padding: '8px 0', fontSize: 12, fontWeight: 500, color: COLORS.slate }}>{rp.role}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center' }}><PermissionDot has={rp.read} /></td>
                    <td style={{ padding: '8px 0', textAlign: 'center' }}><PermissionDot has={rp.write} /></td>
                    <td style={{ padding: '8px 0', textAlign: 'center' }}><PermissionDot has={rp.manage} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
