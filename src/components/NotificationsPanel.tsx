'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, X, CheckCheck, TrendingDown, DollarSign, FileBarChart,
  Users, HandCoins, AlertTriangle, Activity, Settings,
} from 'lucide-react'
import { COLORS, FONTS, SHADOW } from '@/lib/tokens'
import type { Notification, NotificationType, NotificationPriority } from '@/types/audit'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dateGroup(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return 'This Week'
  return 'Earlier'
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier']

function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {}
  for (const n of notifications) {
    const g = dateGroup(n.created_at)
    if (!groups[g]) groups[g] = []
    groups[g].push(n)
  }
  return groups
}

// ── Notification icon by type ─────────────────────────────────────────────────

function NotifIcon({ type }: { type: NotificationType }) {
  const iconProps = { size: 14, style: { flexShrink: 0 } }
  switch (type) {
    case 'INDICATOR_OFF_TRACK':   return <TrendingDown {...iconProps} color={COLORS.crimson} />
    case 'BUDGET_WARNING':        return <DollarSign   {...iconProps} color={COLORS.amber} />
    case 'EXPENDITURE_SUBMITTED':
    case 'EXPENDITURE_APPROVED':
    case 'EXPENDITURE_REJECTED':  return <DollarSign   {...iconProps} color={COLORS.sage} />
    case 'REPORT_GENERATED':
    case 'REPORT_SUBMITTED':      return <FileBarChart {...iconProps} color={COLORS.sky} />
    case 'FIELD_SUBMISSION_FLAGGED': return <AlertTriangle {...iconProps} color={COLORS.amber} />
    case 'TEAM_MEMBER_JOINED':
    case 'TEAM_MEMBER_REMOVED':   return <Users        {...iconProps} color={COLORS.slate} />
    case 'DONOR_ACCESS_REQUESTED':
    case 'DONOR_ACCESS_GRANTED':  return <HandCoins    {...iconProps} color={COLORS.gold} />
    case 'PROGRAM_CREATED':
    case 'PROGRAM_UPDATED':
    case 'PROGRAM_STATUS_CHANGED': return <Activity    {...iconProps} color={COLORS.fern} />
    default:                       return <Bell        {...iconProps} color={COLORS.stone} />
  }
}

// ── Priority border ───────────────────────────────────────────────────────────

const PRIORITY_BORDER: Record<NotificationPriority, string> = {
  HIGH:   COLORS.crimson,
  MEDIUM: COLORS.gold,
  LOW:    'transparent',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  orgSlug?: string
}

export function NotificationsPanel({ orgSlug }: NotificationsPanelProps) {
  const router = useRouter()
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Fetch unread count (polls every 30s) ──────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const { count } = await res.json()
        setUnreadCount(count ?? 0)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // ── Fetch notifications when panel opens ──────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) {
        const { data } = await res.json()
        setNotifications(data ?? [])
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  // ── Close on outside click ────────────────────────────────────────────────

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Mark single as read ───────────────────────────────────────────────────

  const markRead = useCallback(async (id: string, link: string | null) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch { /* silent */ }
    if (link) {
      setOpen(false)
      router.push(link)
    }
  }, [router])

  // ── Mark all as read ──────────────────────────────────────────────────────

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' })
    } catch { /* silent */ }
  }, [])

  const unread = notifications.filter(n => !n.read)
  const groups = groupByDate(notifications)

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:   'relative',
          width:       34, height: 34,
          borderRadius: 8,
          display:     'flex', alignItems: 'center', justifyContent: 'center',
          color:       open ? '#D4AF5C' : '#A0AEC0',
          cursor:      'pointer',
          transition:  'background 0.15s',
          background:  open ? COLORS.foam : 'transparent',
          border:      'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
        onMouseLeave={e => (e.currentTarget.style.background = open ? COLORS.foam : 'transparent')}
        aria-label="Notifications"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{
            position:     'absolute', top: 6, right: 6,
            minWidth:      16, height: 16,
            borderRadius:  8,
            background:    COLORS.crimson,
            border:       '1.5px solid #ffffff',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:      9, fontWeight: 700, color: '#fff',
            padding:      '0 3px',
            fontFamily:   FONTS.body,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <div style={{
          position:     'fixed',
          top:           58,
          right:         0,
          width:         'min(380px, 100vw)',
          height:        'calc(100vh - 58px)',
          background:    '#0A1628',
          borderLeft:   `1px solid ${COLORS.mist}`,
          boxShadow:    '-4px 0 24px rgba(0,0,0,0.5)',
          zIndex:        100,
          display:      'flex',
          flexDirection: 'column',
          overflowY:    'auto',
        }}>
          {/* Header */}
          <div style={{
            display:      'flex', alignItems: 'center', justifyContent: 'space-between',
            padding:      '16px 20px',
            borderBottom: `1px solid ${COLORS.mist}`,
            flexShrink:   0,
          }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF', fontFamily: FONTS.heading }}>
              Notifications
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    display:     'flex', alignItems: 'center', gap: 5,
                    fontSize:     12, color: COLORS.sage,
                    cursor:      'pointer', background: 'none', border: 'none',
                    fontFamily:  FONTS.body, fontWeight: 600,
                  }}
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 6,
                  cursor: 'pointer', background: 'none', border: 'none',
                  color: COLORS.stone,
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: COLORS.stone, fontSize: 13, fontFamily: FONTS.body }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: '60px 24px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <Bell size={36} color={COLORS.mist} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: COLORS.slate, fontFamily: FONTS.body }}>
                  You&apos;re all caught up
                </p>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.stone, fontFamily: FONTS.body }}>
                  No notifications to show
                </p>
              </div>
            ) : (
              DATE_GROUP_ORDER.filter(g => groups[g]?.length).map(group => (
                <div key={group}>
                  <div style={{
                    padding:    '8px 20px 4px',
                    fontSize:    10, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color:      COLORS.stone, fontFamily: FONTS.body,
                  }}>
                    {group}
                  </div>
                  {(groups[group] ?? []).map(n => (
                    <NotifItem key={n.id} notification={n} onRead={markRead} />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            borderTop:  `1px solid ${COLORS.mist}`,
            padding:    '12px 20px',
            flexShrink:  0,
          }}>
            <button
              onClick={() => {
                setOpen(false)
                router.push('/settings/notifications')
              }}
              style={{
                display:    'flex', alignItems: 'center', gap: 6,
                fontSize:    12, color: COLORS.slate,
                cursor:     'pointer', background: 'none', border: 'none',
                fontFamily: FONTS.body,
              }}
            >
              <Settings size={12} /> Notification Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── NotifItem ─────────────────────────────────────────────────────────────────

function NotifItem({
  notification: n,
  onRead,
}: {
  notification: Notification
  onRead: (id: string, link: string | null) => void
}) {
  return (
    <button
      onClick={() => onRead(n.id, n.link)}
      style={{
        width:          '100%',
        display:        'flex',
        gap:            12,
        padding:        '12px 20px',
        background:     n.read ? 'transparent' : COLORS.foam,
        borderLeft:    `3px solid ${PRIORITY_BORDER[n.priority]}`,
        cursor:         n.link ? 'pointer' : 'default',
        transition:     'background 0.12s',
        border:         'none',
        borderLeftStyle: 'solid',
        borderLeftWidth:  3,
        borderLeftColor: PRIORITY_BORDER[n.priority],
        textAlign:      'left',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#1A2B4A')}
      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : '#243352')}
    >
      <div style={{
        marginTop:    2,
        width:        28, height: 28, borderRadius: 7,
        background:   '#1A2B4A',
        display:      'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink:   0,
        border:      `1px solid #2D3F5C`,
      }}>
        <NotifIcon type={n.type} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:      0,
          fontSize:    13,
          fontWeight:  n.read ? 400 : 600,
          color:       n.read ? '#6B7A99' : '#FFFFFF',
          fontFamily:  FONTS.body,
          lineHeight:  1.4,
          wordBreak:  'break-word',
        }}>
          {n.title}
        </p>
        {n.body && (
          <p style={{
            margin:   '2px 0 0',
            fontSize:  11, color: COLORS.stone,
            fontFamily: FONTS.body, lineHeight: 1.4,
          }}>
            {n.body}
          </p>
        )}
        <p style={{
          margin:    '4px 0 0',
          fontSize:   10, color: COLORS.stone,
          fontFamily: FONTS.body,
        }}>
          {timeAgo(n.created_at)}
        </p>
      </div>
      {!n.read && (
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: COLORS.sage, flexShrink: 0, marginTop: 5,
        }} />
      )}
    </button>
  )
}
