'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lock, TrendingUp, MapPin, Calendar, Eye,
  ChevronRight, AlertCircle, Loader2, BarChart3,
} from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, GenericBadge } from '@/components/atoms/Badge'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { EmptyState } from '@/components/atoms/EmptyState'
import { FormField, Select, Textarea } from '@/components/atoms/FormField'
import { formatCurrency, pct } from '@/lib/utils'
import { submitAccessRequest } from '@/app/actions/programs'
import type { DonorProgramView } from '@/lib/programs'
import { ACCESS_LEVEL_LABELS, ACCESS_LEVEL_DESCRIPTIONS } from '@/lib/auth/types'
import type { AccessLevel } from '@/lib/supabase/database.types'

type EnrichedView = DonorProgramView & {
  organization:         { name: string; slug: string } | null
  organization_id:      string
  can_download_reports: boolean
  expires_at:           string | null
  pending_request:      { requested_access_level: AccessLevel; created_at: string } | null
}

interface Props {
  programs:  EnrichedView[]
  donorName: string
}

const ACCESS_LEVEL_OPTIONS: { value: AccessLevel; label: string }[] = [
  { value: 'INDICATORS',            label: ACCESS_LEVEL_LABELS.INDICATORS },
  { value: 'INDICATORS_AND_BUDGET', label: ACCESS_LEVEL_LABELS.INDICATORS_AND_BUDGET },
  { value: 'FULL',                  label: ACCESS_LEVEL_LABELS.FULL },
]

export default function DonorProgramsClient({ programs, donorName }: Props) {
  const router = useRouter()
  const [requestModal, setRequestModal] = useState<EnrichedView | null>(null)

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 4px' }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
          Programs You Support
        </h1>
        <p style={{ fontSize: 13, color: COLORS.stone }}>
          {programs.length > 0
            ? `Access to ${programs.length} program${programs.length !== 1 ? 's' : ''}`
            : 'No programs yet — NGOs will grant you access as they onboard you as a funder.'}
        </p>
      </div>

      {programs.length === 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <EmptyState
            icon={<BarChart3 size={24} />}
            title="No programme access yet"
            description="NGOs will grant you access as they onboard you as a funder. Once granted, you'll see programme data here based on your access level."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {programs.map(p => (
            <DonorProgramCard
              key={p.id}
              program={p}
              onClick={() => router.push(`/donor/programs/${p.id}`)}
              onRequestAccess={() => setRequestModal(p)}
            />
          ))}
        </div>
      )}

      {requestModal && (
        <RequestAccessModal
          program={requestModal}
          onClose={() => setRequestModal(null)}
        />
      )}
    </div>
  )
}

// ── DonorProgramCard ──────────────────────────────────────────────────────────

function DonorProgramCard({
  program: p, onClick, onRequestAccess,
}: {
  program:          EnrichedView
  onClick:          () => void
  onRequestAccess:  () => void
}) {
  const accessLevel = p.access_level
  const canSeeIndicators = accessLevel !== 'SUMMARY_ONLY'

  return (
    <div className="card card-hover" style={{ padding: '22px 24px', cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={p.status.toLowerCase()} />
            <span style={{
              padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: '#E0F2FE', color: '#0369A1',
            }}>
              {ACCESS_LEVEL_LABELS[accessLevel]}
            </span>
            {p.expires_at && (
              <span style={{ fontSize: 11, color: COLORS.stone }}>
                Expires {new Date(p.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
            {p.name}
          </h3>

          {p.organization && (
            <div style={{ fontSize: 12, color: COLORS.stone, marginBottom: 8 }}>
              {p.organization.name}
            </div>
          )}

          {p.objective && (
            <p style={{ fontSize: 13, color: COLORS.slate, marginBottom: 10, lineHeight: 1.5 }}>{p.objective}</p>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: COLORS.stone, marginBottom: 12 }}>
            {p.primary_funder && (
              <GenericBadge label={p.primary_funder} bg={COLORS.gold + '22'} text={COLORS.gold} />
            )}
            {(p.location_country || p.location_region) && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} />
                {[p.location_region, p.location_country].filter(Boolean).join(', ')}
              </span>
            )}
            {p.total_budget && (
              <span style={{ fontWeight: 700, color: COLORS.charcoal }}>
                {formatCurrency(p.total_budget, p.currency ?? 'USD')}
              </span>
            )}
          </div>

          {/* Key indicators preview (if accessible) */}
          {canSeeIndicators && p.indicators && p.indicators.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {p.indicators.slice(0, 3).map(ind => (
                <div key={ind.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 11 }}>
                    <span style={{ color: COLORS.charcoal, fontWeight: 600 }}>{ind.name}</span>
                    <span style={{ color: COLORS.stone }}>
                      {ind.current_value.toLocaleString()}
                      {ind.target_value ? ` / ${ind.target_value.toLocaleString()}` : ''}
                      {ind.unit ? ` ${ind.unit}` : ''}
                    </span>
                  </div>
                  <ProgressBar value={pct(ind.current_value, ind.target_value ?? 0)} size="xs" />
                </div>
              ))}
            </div>
          )}

          {/* Locked state prompt */}
          {!canSeeIndicators && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
              padding: '8px 12px', borderRadius: 8,
              background: '#F8FAFC', border: `1px solid ${COLORS.mist}`,
            }}>
              <Lock size={12} color={COLORS.stone} />
              <span style={{ fontSize: 12, color: COLORS.stone }}>
                Indicators locked — request higher access to unlock.
              </span>
            </div>
          )}

          {/* Pending request badge */}
          {p.pending_request && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
              padding: '5px 10px', borderRadius: 8,
              background: '#FEF3C7', border: '1px solid #FCD34D',
              fontSize: 11, color: '#78350F',
            }}>
              <AlertCircle size={11} />
              Access request pending: {ACCESS_LEVEL_LABELS[p.pending_request.requested_access_level]}
            </div>
          )}
        </div>

        {/* Right column: actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '7px 14px', borderRadius: 8,
            background: COLORS.foam, border: `1px solid ${COLORS.mist}`,
            fontSize: 12, fontWeight: 600, color: COLORS.fern,
          }}>
            View <ChevronRight size={13} />
          </div>
          {!p.pending_request && (
            <button
              onClick={e => { e.stopPropagation(); onRequestAccess() }}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: '#fff', border: `1px solid ${COLORS.mist}`,
                color: COLORS.slate, cursor: 'pointer',
              }}
            >
              Request Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── RequestAccessModal ────────────────────────────────────────────────────────

function RequestAccessModal({
  program, onClose,
}: {
  program: EnrichedView
  onClose: () => void
}) {
  const [level,   setLevel]   = useState<AccessLevel>('INDICATORS')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error,  setError]    = useState<string | null>(null)
  const [success,setSuccess]  = useState(false)

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const res = await submitAccessRequest({
        program_id:             program.id,
        organization_id:        program.organization_id,
        requested_access_level: level,
        message:                message.trim() || undefined,
      })
      if (res.error) { setError(res.error); return }
      setSuccess(true)
      setTimeout(onClose, 1500)
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(13,43,30,0.55)',
    }} onClick={onClose}>
      <div
        className="card"
        style={{ width: 460, maxWidth: '95vw', padding: '26px 28px' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 17, fontWeight: 700, color: COLORS.forest, marginBottom: 4 }}>
          Request Additional Access
        </h3>
        <p style={{ fontSize: 12, color: COLORS.stone, marginBottom: 20, lineHeight: 1.5 }}>
          {program.name} · {program.organization?.name}
        </p>

        {success ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ fontSize: 14, color: COLORS.fern, fontWeight: 700 }}>Request submitted!</p>
            <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 4 }}>
              The NGO team will review your request and respond.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="Access level requested" htmlFor="ra-level">
                <Select
                  id="ra-level"
                  options={ACCESS_LEVEL_OPTIONS}
                  value={level}
                  onChange={e => setLevel(e.target.value as AccessLevel)}
                />
              </FormField>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: COLORS.foam, border: `1px solid ${COLORS.mist}`, fontSize: 12, color: COLORS.slate }}>
                {ACCESS_LEVEL_DESCRIPTIONS[level]}
              </div>
              <FormField label="Message to NGO (optional)" htmlFor="ra-msg">
                <Textarea
                  id="ra-msg"
                  rows={3}
                  placeholder="Explain why you need this level of access…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </FormField>
            </div>
            {error && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 7, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, background: '#fff', border: `1px solid ${COLORS.mist}`, cursor: 'pointer', color: COLORS.slate }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700,
                  background: isPending ? COLORS.mist : COLORS.moss,
                  color: isPending ? COLORS.stone : '#fff',
                  border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Submit Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
