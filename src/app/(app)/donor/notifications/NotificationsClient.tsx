'use client'

import React, { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { COLORS, FONTS } from '@/lib/tokens'
import type { DonorNotification, DonorNotificationType } from '@/lib/donors'
import { NOTIFICATION_TYPE_LABELS } from '@/lib/donors'
import { markNotificationRead, markAllNotificationsRead } from '@/app/actions/notifications'
import { createClient } from '@/lib/supabase/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_ICON: Record<DonorNotificationType, string> = {
  ACCESS_GRANTED:   '🔓',
  ACCESS_UPDATED:   '✏️',
  ACCESS_REVOKED:   '🔒',
  NEW_UPDATE:       '📋',
  NEW_REPORT:       '📄',
  REQUEST_APPROVED: '✅',
  REQUEST_DENIED:   '❌',
  TRANCHE_REMINDER: '💰',
}

const TYPE_COLOR: Record<DonorNotificationType, string> = {
  ACCESS_GRANTED:   '#38A16920',
  ACCESS_UPDATED:   '#1A3A5C',
  ACCESS_REVOKED:   '#E53E3E20',
  NEW_UPDATE:       '#1A2B4A',
  NEW_REPORT:       '#1A2B4A',
  REQUEST_APPROVED: '#38A16920',
  REQUEST_DENIED:   '#FEE2E2',
  TRANCHE_REMINDER: '#FEF9EC',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  notifications: DonorNotification[]
}

export default function NotificationsClient({ notifications: initial }: Props) {
  const [notifications, setNotifications] = useState<DonorNotification[]>(initial)
  const [, startTransition] = useTransition()

  const unreadCount = notifications.filter(n => !n.read).length

  // ── Realtime subscription for new notifications ──────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('donor-notifications')
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'donor_notifications',
          // RLS on the server ensures the donor only sees their own rows
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as unknown as DonorNotification
            setNotifications(prev => [newNotif, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as unknown as DonorNotification
            setNotifications(prev =>
              prev.map(n => n.id === updated.id ? updated : n)
            )
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setNotifications(prev => prev.filter(n => n.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    startTransition(async () => {
      await markNotificationRead(id)
    })
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>

      {/* Top bar */}
      <div style={{
        background: COLORS.forest,
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href='/donor/dashboard' style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{
              background: '#EF4444', color: '#fff',
              fontSize: 11, fontWeight: 700,
              padding: '1px 7px', borderRadius: 10,
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'none', border: `1px solid rgba(255,255,255,0.25)`,
              color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600,
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontFamily: FONTS.heading, fontSize: 24, fontWeight: 700, color: COLORS.forest, margin: '0 0 6px' }}>
          Notifications
        </h1>
        <p style={{ fontSize: 14, color: COLORS.stone, margin: '0 0 28px' }}>
          Updates from your NGO partners about your programme access.
        </p>

        {notifications.length === 0 ? (
          <div style={{
            background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderRadius: 14,
            padding: 48, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 15, color: COLORS.stone, margin: 0 }}>No notifications yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: '#1A2B4A', border: `1px solid ${COLORS.mist}`, borderRadius: 14, overflow: 'hidden' }}>
            {notifications.map((n, i) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: i < notifications.length - 1 ? `1px solid ${COLORS.mist}` : 'none',
                  background: n.read ? '#fff' : TYPE_COLOR[n.type] ?? COLORS.foam,
                  cursor: n.read ? 'default' : 'pointer',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: n.read ? COLORS.snow : '#fff',
                  border: `1px solid ${COLORS.mist}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {TYPE_ICON[n.type] ?? '📌'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: COLORS.forest }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.stone, marginLeft: 8, background: COLORS.snow, padding: '1px 6px', borderRadius: 6, border: `1px solid ${COLORS.mist}` }}>
                        {NOTIFICATION_TYPE_LABELS[n.type]}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: COLORS.stone, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.slate, margin: '4px 0 0', lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                  {n.org_name && (
                    <p style={{ fontSize: 12, color: COLORS.stone, margin: '4px 0 0' }}>
                      {n.org_name}{n.program_name ? ` · ${n.program_name}` : ''}
                    </p>
                  )}
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, color: COLORS.fern, fontWeight: 600, marginTop: 6, display: 'inline-block', textDecoration: 'none' }}
                    >
                      View →
                    </Link>
                  )}
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.fern, flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
