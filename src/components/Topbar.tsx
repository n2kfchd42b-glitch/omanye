'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, User, Settings, LogOut, Building2, Menu } from 'lucide-react'
import { COLORS, SPACING, FONTS } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import type { ViewId, User as UserType } from '@/lib/types'

// ── View titles ───────────────────────────────────────────────────────────────

const VIEW_TITLE: Record<ViewId, string> = {
  dashboard:        'Dashboard',
  programs:         'Programs',
  'program-detail': 'Program Detail',
  'data-hub':       'Data Hub',
  analytics:        'Analytics',
  reports:          'Donor Reports',
  documents:        'Documents',
  fieldstatus:      'Field Status',
  audit:            'Audit Trail',
  team:             'Team',
  map:              'Field Map',
  settings:         'Settings',
  donors:           'Donors',
}

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  Admin:         { bg: '#0F1B33',  text: '#D4AF5C'  },
  'Field Staff': { bg: '#1A3A5C',  text: '#60A5FA'  },
  'M&E Officer': { bg: '#1A2B4A',  text: '#A0AEC0'  },
  Supervisor:    { bg: '#1A2B4A',  text: '#A0AEC0'  },
  Viewer:        { bg: '#243352',  text: '#6B7A99'  },
  Donor:         { bg: '#1A3A5C',  text: '#60A5FA'  },
}

// ── Topbar ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  view:         ViewId
  sidebarW:     number
  user:         UserType
  orgSlug?:     string
  isMobile:     boolean
  onHamburger:  () => void
  onSettings:   () => void
  onSignOut:    () => void
}

export function Topbar({
  view, sidebarW, user, orgSlug,
  isMobile, onHamburger,
  onSettings, onSignOut,
}: TopbarProps) {
  const router = useRouter()
  const [query,    setQuery]    = useState('')
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const roleStyle = ROLE_BADGE[user.role] ?? ROLE_BADGE.Viewer
  const isAdmin   = user.role === 'Admin'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarW,
        height: SPACING.topbarH,
        background: '#0F1B33',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${COLORS.mist}`,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        transition: 'left 0.2s ease',
      }}
    >
      {/* Left: hamburger (mobile) or page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onHamburger}
            aria-label="Open menu"
            style={{
              display:        'flex', alignItems: 'center', justifyContent: 'center',
              width:           40, height: 40,
              borderRadius:    8,
              background:     'transparent',
              border:         'none',
              color:          COLORS.slate,
              cursor:         'pointer',
              flexShrink:      0,
            }}
          >
            <Menu size={20} />
          </button>
        )}
        <h1 style={{
          fontFamily: FONTS.heading,
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {VIEW_TITLE[view]}
        </h1>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, flexShrink: 0 }}>
        {/* Search — desktop only */}
        {!isMobile && (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{
              position: 'absolute', left: 10, color: COLORS.stone, pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search…"
              aria-label="Search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                fontSize: 13,
                borderRadius: 8,
                border: `1px solid ${COLORS.mist}`,
                background: '#1A2B4A',
                color: '#FFFFFF',
                outline: 'none',
                width: 160,
                fontFamily: FONTS.body,
              }}
              onFocus={e => {
                e.target.style.width = '200px'
                e.target.style.borderColor = COLORS.sage
                e.target.style.boxShadow = `0 0 0 3px rgba(212,175,92,0.15)`
              }}
              onBlur={e => {
                e.target.style.width = '160px'
                e.target.style.borderColor = COLORS.mist
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )}

        {/* Notifications */}
        <NotificationsPanel orgSlug={orgSlug} />

        {/* Avatar + dropdown */}
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s',
              background: 'transparent',
              border: 'none',
              minHeight: 40,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-haspopup="true"
            aria-expanded={dropOpen}
          >
            <Avatar name={user.name} size={28} />
            {!isMobile && <ChevronDown size={12} style={{ color: COLORS.stone }} />}
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: '#1A2B4A',
              borderRadius: 10,
              border: `1px solid ${COLORS.mist}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: 220,
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${COLORS.mist}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{user.name}</p>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: roleStyle.bg, color: roleStyle.text,
                  }}>
                    {user.role}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: COLORS.stone, margin: 0 }}>{user.email}</p>
                {user.org && (
                  <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>{user.org}</p>
                )}
              </div>

              {/* Actions */}
              <DropItem
                icon={User}
                label="Profile Settings"
                onClick={() => {
                  setDropOpen(false)
                  router.push('/settings/profile')
                }}
              />

              {isAdmin && orgSlug && (
                <DropItem
                  icon={Building2}
                  label="Org Settings"
                  onClick={() => {
                    setDropOpen(false)
                    router.push(`/org/${orgSlug}/settings`)
                  }}
                />
              )}

              <DropItem
                icon={Settings}
                label="Account Settings"
                onClick={() => { setDropOpen(false); onSettings() }}
              />

              <div style={{ margin: '4px 0', borderTop: `1px solid ${COLORS.mist}` }} />
              <DropItem
                icon={LogOut}
                label="Sign Out"
                onClick={() => { setDropOpen(false); onSignOut() }}
                danger
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ── DropItem ──────────────────────────────────────────────────────────────────

function DropItem({ icon: Icon, label, onClick, danger }: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px',
        fontSize: 13,
        color: danger ? COLORS.crimson : COLORS.slate,
        cursor: 'pointer',
        transition: 'background 0.12s',
        background: 'transparent',
        border: 'none',
        fontFamily: FONTS.body,
        minHeight: 44,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}
