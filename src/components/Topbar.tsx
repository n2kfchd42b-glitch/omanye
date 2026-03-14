'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, ChevronDown, User, Shield, LogOut } from 'lucide-react'
import { COLORS, SPACING, FONTS } from '@/lib/tokens'
import { Avatar } from '@/components/atoms/Avatar'
import type { ViewId, User as UserType } from '@/lib/types'

// ── View titles ───────────────────────────────────────────────────────────────

const VIEW_TITLE: Record<ViewId, string> = {
  dashboard:        'Dashboard',
  programs:         'Programs',
  'program-detail': 'Program Detail',
  'data-hub':       'Data Hub',
  analytics:        'Analytics',
  documents:        'Documents',
  team:             'Team',
  'field-map':      'Field Map',
  settings:         'Settings',
}

// ── Topbar ────────────────────────────────────────────────────────────────────

interface TopbarProps {
  view:       ViewId
  sidebarW:   number
  user:       UserType
  onSettings: () => void
  onSignOut:  () => void
}

export function Topbar({ view, sidebarW, user, onSettings, onSignOut }: TopbarProps) {
  const [query,       setQuery]       = useState('')
  const [dropOpen,    setDropOpen]    = useState(false)
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

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: sidebarW,
        height: SPACING.topbarH,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${COLORS.mist}`,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'left 0.2s ease',
      }}
    >
      {/* Page title */}
      <h1 style={{
        fontFamily: FONTS.heading,
        fontSize: 18,
        fontWeight: 600,
        color: COLORS.forest,
        lineHeight: 1,
      }}>
        {VIEW_TITLE[view]}
      </h1>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, color: COLORS.stone, pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              fontSize: 13,
              borderRadius: 8,
              border: `1px solid ${COLORS.mist}`,
              background: COLORS.snow,
              color: COLORS.forest,
              outline: 'none',
              width: 160,
              fontFamily: FONTS.body,
            }}
            onFocus={e => {
              e.target.style.width = '200px'
              e.target.style.borderColor = COLORS.sage
              e.target.style.boxShadow = `0 0 0 3px rgba(74,207,120,0.14)`
            }}
            onBlur={e => {
              e.target.style.width = '160px'
              e.target.style.borderColor = COLORS.mist
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Bell */}
        <button
          style={{
            position: 'relative',
            width: 34, height: 34,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.stone,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label="Notifications"
        >
          <Bell size={15} />
          {/* red dot */}
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 6, height: 6, borderRadius: '50%',
            background: COLORS.crimson,
            border: '1.5px solid #ffffff',
          }} />
        </button>

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
            }}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-haspopup="true"
            aria-expanded={dropOpen}
          >
            <Avatar name={user.name} size={28} />
            <ChevronDown size={12} style={{ color: COLORS.stone }} />
          </button>

          {dropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: '#ffffff',
              borderRadius: 10,
              border: `1px solid ${COLORS.mist}`,
              boxShadow: '0 8px 32px rgba(13,43,30,0.12)',
              minWidth: 180,
              zIndex: 50,
              overflow: 'hidden',
            }}>
              {/* User info */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${COLORS.mist}` }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{user.name}</p>
                <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}>{user.email}</p>
              </div>

              {/* Actions */}
              <DropItem icon={User} label="Account Settings" onClick={() => { setDropOpen(false); onSettings() }} />
              <DropItem icon={Shield} label="Permissions" onClick={() => { setDropOpen(false); onSettings() }} />
              <div style={{ margin: '4px 0', borderTop: `1px solid ${COLORS.mist}` }} />
              <DropItem icon={LogOut} label="Sign Out" onClick={() => { setDropOpen(false); onSignOut() }} danger />
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
        padding: '9px 14px',
        fontSize: 13,
        color: danger ? COLORS.crimson : COLORS.slate,
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}
