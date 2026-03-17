'use client'

import React from 'react'
import {
  LayoutDashboard, FolderOpen,
  FileBarChart, RadioTower,
  Users, Settings, ChevronLeft, ChevronRight,
  HandCoins, Shield,
} from 'lucide-react'
import { COLORS, SPACING } from '@/lib/tokens'
import { OmanyeLogo, OmanyeSymbol } from '@/components/Logo'
import { Avatar } from '@/components/atoms/Avatar'
import type { ViewId, User, UserRole } from '@/lib/types'

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem {
  id:           ViewId
  label:        string
  icon:         React.ElementType
  allowedRoles: UserRole[]
}

const WORKSPACE_NAV: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,
    allowedRoles: ['Admin', 'Field Staff', 'M&E Officer', 'Supervisor', 'Viewer', 'Donor'],
  },
  {
    id: 'programs', label: 'Programs', icon: FolderOpen,
    allowedRoles: ['Admin', 'Field Staff', 'M&E Officer', 'Supervisor', 'Viewer'],
  },
  {
    id: 'fieldstatus', label: 'Field Data', icon: RadioTower,
    allowedRoles: ['Admin', 'Field Staff', 'M&E Officer', 'Supervisor'],
  },
  {
    id: 'donors', label: 'Donors', icon: HandCoins,
    allowedRoles: ['Admin'],
  },
  {
    id: 'reports', label: 'Reports', icon: FileBarChart,
    allowedRoles: ['Admin', 'Field Staff', 'M&E Officer', 'Supervisor', 'Viewer'],
  },
  {
    id: 'team', label: 'Team', icon: Users,
    allowedRoles: ['Admin', 'Field Staff', 'M&E Officer', 'Supervisor'],
  },
]

const SYSTEM_NAV: NavItem[] = [
  {
    id: 'audit', label: 'Audit Log', icon: Shield,
    allowedRoles: ['Admin'],
  },
  {
    id: 'settings', label: 'Settings', icon: Settings,
    allowedRoles: ['Admin'],
  },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  view:      ViewId
  onNav:     (v: ViewId) => void
  collapsed: boolean
  onToggle:  () => void
  user:      User
}

export function Sidebar({ view, onNav, collapsed, onToggle, user }: SidebarProps) {
  const w = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  const visibleWorkspace = WORKSPACE_NAV.filter(item => item.allowedRoles.includes(user.role))
  const visibleSystem    = SYSTEM_NAV.filter(item => item.allowedRoles.includes(user.role))

  return (
    <aside
      style={{
        width: w,
        minWidth: w,
        height: '100vh',
        background: COLORS.forest,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: SPACING.topbarH,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 12px' : '0 16px',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          flexShrink: 0,
        }}
      >
        {collapsed
          ? <OmanyeSymbol size={32} />
          : <OmanyeLogo size="sm" showTagline={false} variant="dark" />
        }
      </div>

      {/* Nav */}
      <nav
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}
        className="scrollbar-hidden"
      >
        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'rgba(212,175,92,0.40)',
            padding: '0 16px 8px',
          }}>
            Workspace
          </p>
        )}
        {visibleWorkspace.map(item => (
          <NavLink
            key={item.id}
            item={item}
            active={view === item.id || (view === 'program-detail' && item.id === 'programs')}
            collapsed={collapsed}
            onNav={onNav}
          />
        ))}

        {visibleSystem.length > 0 && (
          <>
            <div style={{ margin: '12px 0', borderTop: `1px solid rgba(255,255,255,0.06)` }} />
            {!collapsed && (
              <p style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'rgba(212,175,92,0.40)',
                padding: '0 16px 8px',
              }}>
                System
              </p>
            )}
            {visibleSystem.map(item => (
              <NavLink key={item.id} item={item} active={view === item.id} collapsed={collapsed} onNav={onNav} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, flexShrink: 0 }}>
        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '12px' : '12px 16px',
          overflow: 'hidden',
        }}>
          <Avatar name={user.name} size={30} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{
                fontSize: 12, fontWeight: 600, color: '#ffffff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user.name}
              </p>
              <p style={{
                fontSize: 10, color: COLORS.gold,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user.role}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: collapsed ? '10px 0' : '10px 16px',
            color: 'rgba(212,175,92,0.50)',
            fontSize: 11,
            cursor: 'pointer',
            borderTop: `1px solid rgba(255,255,255,0.04)`,
            transition: 'color 0.15s',
            background: 'transparent',
            border: 'none',
            borderTopStyle: 'solid',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.04)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = COLORS.mint)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(212,175,92,0.50)')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <><ChevronLeft size={14} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
  item, active, collapsed, onNav,
}: { item: NavItem; active: boolean; collapsed: boolean; onNav: (v: ViewId) => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onNav(item.id)}
      title={collapsed ? item.label : undefined}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center',
        gap: 10,
        padding: collapsed ? '9px 0' : '9px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderLeft: active ? `2px solid ${COLORS.sage}` : '2px solid transparent',
        background: active ? 'rgba(212,175,92,0.12)' : 'transparent',
        color: active ? COLORS.mint : '#A0AEC0',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        border: 'none',
        borderLeftStyle: 'solid',
        borderLeftWidth: active ? 2 : 2,
        borderLeftColor: active ? COLORS.sage : 'transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = '#1A2B4A'
          e.currentTarget.style.color = '#ffffff'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#A0AEC0'
        }
      }}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  )
}
