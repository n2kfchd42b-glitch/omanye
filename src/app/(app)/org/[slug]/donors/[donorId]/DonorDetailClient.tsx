'use client'

import React, { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/tokens'
import { AccessLevelBadge } from '@/components/AccessLevelBadge'
import type { AccessLevel } from '@/lib/donors'
import type { DonorProgramAccessExtended, DonorRelationship } from '@/lib/donors'
import {
  updateDonorAccess,
  revokeDonorAccess,
  updateDonorNotes,
  grantProgramAccess,
} from '@/app/actions/donors'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = 56 }: { name: string | null; url: string | null; size?: number }) {
  const initials = name
    ? name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'Donor'}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.mist}` }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: COLORS.fern, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONTS.heading, fontSize: size * 0.33, fontWeight: 700,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const ACCESS_LEVELS: AccessLevel[] = ['SUMMARY_ONLY', 'INDICATORS', 'INDICATORS_AND_BUDGET', 'FULL']
const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  SUMMARY_ONLY:          'Summary Only',
  INDICATORS:            'Indicators',
  INDICATORS_AND_BUDGET: 'Indicators & Budget',
  FULL:                  'Full Access',
}
const ACCESS_LEVEL_DESC: Record<AccessLevel, string> = {
  SUMMARY_ONLY:          'Program overview and narrative updates only.',
  INDICATORS:            'Overview, narratives, and KPI progress tracking.',
  INDICATORS_AND_BUDGET: 'All indicators plus budget summary and burn rate.',
  FULL:                  'Everything including funding tranches and all reports.',
}

// ── Add Program Access Modal ──────────────────────────────────────────────────

interface AddAccessModalProps {
  organizationId: string
  donorId:        string
  programs:       { id: string; name: string; status: string }[]
  existingIds:    Set<string>
  onClose:        () => void
  onSuccess:      (dpa: DonorProgramAccessExtended) => void
}

function AddAccessModal({ organizationId, donorId, programs, existingIds, onClose, onSuccess }: AddAccessModalProps) {
  const [programId, setProgramId]     = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('SUMMARY_ONLY')
  const [canDownload, setCanDownload] = useState(false)
  const [message, setMessage]         = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const available = programs.filter(p => !existingIds.has(p.id))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!programId) { setError('Please select a program'); return }
    setSaving(true); setError(null)
    const result = await grantProgramAccess(organizationId, {
      donor_id:             donorId,
      program_id:           programId,
      access_level:         accessLevel,
      can_download_reports: canDownload,
      message:              message || undefined,
    })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onSuccess(result.data!)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1A2B4A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 20, fontWeight: 700, color: COLORS.forest, margin: 0 }}>
            Add Program Access
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: COLORS.stone }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Program selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Program
            </label>
            {available.length === 0 ? (
              <p style={{ fontSize: 14, color: COLORS.stone, margin: 0 }}>This donor already has access to all available programs.</p>
            ) : (
              <select
                value={programId}
                onChange={e => setProgramId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 14, color: COLORS.charcoal, background: '#1A2B4A', outline: 'none' }}
              >
                <option value=''>Select a program…</option>
                {available.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Access Level */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Access Level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACCESS_LEVELS.map(level => (
                <label
                  key={level}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1.5px solid ${accessLevel === level ? COLORS.fern : COLORS.mist}`,
                    background: accessLevel === level ? COLORS.foam : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <input type='radio' name='accessLevel' value={level} checked={accessLevel === level} onChange={() => setAccessLevel(level)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{ACCESS_LEVEL_LABELS[level]}</div>
                    <div style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{ACCESS_LEVEL_DESC[level]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Download toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type='checkbox' checked={canDownload} onChange={e => setCanDownload(e.target.checked)} />
            <span style={{ fontSize: 14, color: COLORS.charcoal }}>Allow report downloads</span>
          </label>

          {/* Optional message */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.slate, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='A personal note to include in the access notification…'
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, fontSize: 14, color: COLORS.charcoal, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type='button' onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#1A2B4A', fontSize: 14, color: COLORS.slate, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving || available.length === 0}
              style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? COLORS.stone : COLORS.gold, color: COLORS.forest, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Granting…' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Program Access Card ───────────────────────────────────────────────────────

interface AccessCardProps {
  access:         DonorProgramAccessExtended
  organizationId: string
  donorId:        string
  initialNotes:   string | null
  canEdit:        boolean
  onRevoke:       (programId: string) => void
  onUpdate:       (programId: string, updates: Partial<DonorProgramAccessExtended>) => void
}

function AccessCard({ access, organizationId, donorId, initialNotes, canEdit, onRevoke, onUpdate }: AccessCardProps) {
  const [accessLevel, setAccessLevel]   = useState<AccessLevel>(access.access_level)
  const [canDownload, setCanDownload]   = useState(access.can_download_reports)
  const [notes, setNotes]               = useState(initialNotes ?? '')
  const [notesSaving, setNotesSaving]   = useState(false)
  const [notesSaved, setNotesSaved]     = useState(false)
  const [levelSaving, setLevelSaving]   = useState(false)
  const [revoking, setRevoking]         = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [, startTransition]             = useTransition()

  async function handleLevelChange(newLevel: AccessLevel) {
    if (newLevel === accessLevel || !canEdit) return
    setLevelSaving(true); setError(null)
    const result = await updateDonorAccess(organizationId, donorId, access.program_id, { access_level: newLevel })
    setLevelSaving(false)
    if (result.error) { setError(result.error); return }
    setAccessLevel(newLevel)
    onUpdate(access.program_id, { access_level: newLevel })
  }

  async function handleDownloadToggle(val: boolean) {
    if (!canEdit) return
    setCanDownload(val)
    startTransition(async () => {
      await updateDonorAccess(organizationId, donorId, access.program_id, { can_download_reports: val })
      onUpdate(access.program_id, { can_download_reports: val })
    })
  }

  async function handleNotesBlur() {
    if (notes === (initialNotes ?? '') || !canEdit) return
    setNotesSaving(true)
    await updateDonorNotes(organizationId, donorId, access.program_id, notes)
    setNotesSaving(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  async function handleRevoke() {
    setRevoking(true); setError(null)
    const result = await revokeDonorAccess(organizationId, donorId, access.program_id)
    setRevoking(false)
    if (result.error) { setError(result.error); return }
    onRevoke(access.program_id)
  }

  const statusDot = access.active ? COLORS.sage : COLORS.stone

  return (
    <div style={{
      border: `1px solid ${COLORS.mist}`,
      borderRadius: 12,
      overflow: 'hidden',
      background: access.active ? '#fff' : COLORS.snow,
    }}>
      {/* Card header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.mist}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot, flexShrink: 0 }} />
            <span style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 700, color: COLORS.forest, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {access.program_name ?? access.program_id}
            </span>
            {access.program_status && (
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, background: COLORS.snow, padding: '2px 7px', borderRadius: 10, border: `1px solid ${COLORS.mist}`, whiteSpace: 'nowrap' }}>
                {access.program_status}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: COLORS.stone }}>
            <span>Granted {new Date(access.granted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {access.granter_name && <span>by {access.granter_name}</span>}
            {access.expires_at && <span style={{ color: COLORS.amber }}>Expires {new Date(access.expires_at).toLocaleDateString()}</span>}
          </div>
        </div>
        <AccessLevelBadge level={accessLevel} size='sm' />
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Activity row */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Last Viewed</div>
            <div style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>{relativeTime(access.last_viewed_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total Views</div>
            <div style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>{access.view_count}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Downloads</div>
            <div style={{ fontSize: 13, color: COLORS.charcoal, fontWeight: 500 }}>{canDownload ? 'Allowed' : 'Disabled'}</div>
          </div>
        </div>

        {canEdit && access.active && (
          <>
            {/* Access Level selector */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Access Level {levelSaving && <span style={{ color: COLORS.stone, fontWeight: 400 }}>— saving…</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ACCESS_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
                    disabled={levelSaving}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${accessLevel === level ? COLORS.fern : COLORS.mist}`,
                      background: accessLevel === level ? COLORS.foam : '#fff',
                      color: accessLevel === level ? COLORS.forest : COLORS.slate,
                      transition: 'all 0.15s',
                    }}
                  >
                    {ACCESS_LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Download toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type='checkbox'
                checked={canDownload}
                onChange={e => handleDownloadToggle(e.target.checked)}
                style={{ accentColor: COLORS.fern, width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13, color: COLORS.charcoal }}>Allow report downloads</span>
            </label>

            {/* Internal notes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Internal Notes</span>
                <span style={{ fontSize: 11, color: COLORS.amber, fontWeight: 500 }}>Never visible to donor</span>
                {notesSaving && <span style={{ fontSize: 11, color: COLORS.stone }}>Saving…</span>}
                {notesSaved  && <span style={{ fontSize: 11, color: COLORS.fern }}>Saved ✓</span>}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder='Add internal context about this access grant…'
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 12px',
                  borderRadius: 8, border: `1px solid ${COLORS.mist}`,
                  fontSize: 13, color: COLORS.charcoal, resize: 'vertical', outline: 'none',
                  background: COLORS.snow, fontFamily: FONTS.body,
                }}
              />
            </div>

            {/* Revoke */}
            {error && <p style={{ fontSize: 13, color: COLORS.crimson, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {!confirmRevoke ? (
                <button
                  onClick={() => setConfirmRevoke(true)}
                  style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid #FECACA`, background: '#FEF2F2', color: COLORS.crimson, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Revoke Access
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: COLORS.crimson }}>Revoke access to this program?</span>
                  <button
                    onClick={() => setConfirmRevoke(false)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.mist}`, background: '#1A2B4A', fontSize: 13, cursor: 'pointer', color: COLORS.slate }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRevoke}
                    disabled={revoking}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: COLORS.crimson, color: '#fff', fontSize: 13, fontWeight: 700, cursor: revoking ? 'not-allowed' : 'pointer' }}
                  >
                    {revoking ? 'Revoking…' : 'Confirm Revoke'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!access.active && (
          <p style={{ fontSize: 13, color: COLORS.stone, margin: 0, fontStyle: 'italic' }}>Access has been revoked.</p>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  orgSlug:        string
  organizationId: string
  userRole:       string
  donor:          DonorRelationship & { internal_notes_per_program: Record<string, string | null> }
  programs:       { id: string; name: string; status: string }[]
  currentUserId:  string
}

export default function DonorDetailClient({
  orgSlug,
  organizationId,
  userRole,
  donor,
  programs,
  currentUserId,
}: Props) {
  const router = useRouter()
  const canEdit = ['NGO_ADMIN', 'NGO_STAFF'].includes(userRole)

  const [accessList, setAccessList] = useState<DonorProgramAccessExtended[]>(donor.access)
  const [showAddModal, setShowAddModal] = useState(false)

  const existingProgramIds = new Set(accessList.filter(a => a.active).map(a => a.program_id))

  const handleRevoke = useCallback((programId: string) => {
    setAccessList(prev => prev.map(a => a.program_id === programId ? { ...a, active: false } : a))
  }, [])

  const handleUpdate = useCallback((programId: string, updates: Partial<DonorProgramAccessExtended>) => {
    setAccessList(prev => prev.map(a => a.program_id === programId ? { ...a, ...updates } : a))
  }, [])

  const handleAddSuccess = useCallback((dpa: DonorProgramAccessExtended) => {
    setAccessList(prev => {
      const existing = prev.findIndex(a => a.program_id === dpa.program_id)
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = dpa
        return next
      }
      return [dpa, ...prev]
    })
    setShowAddModal(false)
  }, [])

  const activeCount  = accessList.filter(a => a.active).length
  const revokedCount = accessList.filter(a => !a.active).length

  return (
    <div>

      {/* Top bar */}
      <div style={{
        padding: '4px 0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: `1px solid ${COLORS.mist}`,
      }}>
        <Link
          href={`/org/${orgSlug}/donors`}
          style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← All Donors
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
          {donor.full_name ?? donor.email}
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── Left panel: Donor profile ─────────────────────────────────────── */}
        <div style={{
          width: 280,
          flexShrink: 0,
          background: '#1A2B4A',
          borderRadius: 14,
          border: `1px solid ${COLORS.mist}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <Avatar name={donor.full_name} url={donor.avatar_url} size={72} />
            <div>
              <div style={{ fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.forest }}>
                {donor.full_name ?? 'Unnamed Donor'}
              </div>
              {donor.organization_name && (
                <div style={{ fontSize: 13, color: COLORS.stone, marginTop: 3 }}>{donor.organization_name}</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Email</div>
              <div style={{ fontSize: 13, color: COLORS.charcoal, wordBreak: 'break-all' }}>{donor.email || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Member Since</div>
              <div style={{ fontSize: 13, color: COLORS.charcoal }}>
                {donor.joined_at ? new Date(donor.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Program Access</div>
              <div style={{ fontSize: 13, color: COLORS.charcoal }}>{activeCount} active{revokedCount > 0 ? `, ${revokedCount} revoked` : ''}</div>
            </div>
          </div>

          {/* Donor ID (for internal reference) */}
          <div style={{ paddingTop: 12, borderTop: `1px solid ${COLORS.mist}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.stone, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Donor ID</div>
            <div style={{ fontSize: 11, color: COLORS.stone, fontFamily: FONTS.mono, wordBreak: 'break-all' }}>{donor.donor_id}</div>
          </div>
        </div>

        {/* ── Right panel: Program Access ───────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 700, color: COLORS.forest, margin: '0 0 4px' }}>
                Program Access
              </h2>
              <p style={{ fontSize: 13, color: COLORS.stone, margin: 0 }}>
                Manage which programs this donor can view and at what level.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: COLORS.gold, color: COLORS.forest,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                + Add Program Access
              </button>
            )}
          </div>

          {/* Access cards */}
          {accessList.length === 0 ? (
            <div style={{
              background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderRadius: 12,
              padding: 48, textAlign: 'center',
            }}>
              <p style={{ fontSize: 15, color: COLORS.stone, margin: '0 0 16px' }}>No program access yet.</p>
              {canEdit && (
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: COLORS.gold, color: COLORS.forest, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Grant First Access
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Active access first */}
              {accessList.filter(a => a.active).map(access => (
                <AccessCard
                  key={access.program_id}
                  access={access}
                  organizationId={organizationId}
                  donorId={donor.donor_id}
                  initialNotes={donor.internal_notes_per_program[access.program_id] ?? null}
                  canEdit={canEdit}
                  onRevoke={handleRevoke}
                  onUpdate={handleUpdate}
                />
              ))}
              {/* Revoked access collapsed */}
              {accessList.filter(a => !a.active).map(access => (
                <AccessCard
                  key={access.program_id}
                  access={access}
                  organizationId={organizationId}
                  donorId={donor.donor_id}
                  initialNotes={donor.internal_notes_per_program[access.program_id] ?? null}
                  canEdit={false}
                  onRevoke={handleRevoke}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Access Modal */}
      {showAddModal && (
        <AddAccessModal
          organizationId={organizationId}
          donorId={donor.donor_id}
          programs={programs}
          existingIds={existingProgramIds}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  )
}
