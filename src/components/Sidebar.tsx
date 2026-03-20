'use client'

import React from 'react'
import {
  LayoutDashboard, FolderOpen,
  FileBarChart, RadioTower,
  Users, Settings, ChevronLeft, ChevronRight, X,
  HandCoins, Shield, Database, BarChart2, Landmark, PenLine,
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
    id: 'data-hub', label: 'Data Hub', icon: Database,
    allowedRoles: ['Admin', 'M&E Officer', 'Supervisor'],
  },
  {
    id: 'analytics', label: 'Analysis', icon: BarChart2,
    allowedRoles: ['Admin', 'M&E Officer', 'Supervisor'],
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

const FUNDING_NAV: NavItem[] = [
  {
    id: 'funders', label: 'Funders', icon: Landmark,
    allowedRoles: ['Admin', 'Field Staff'],
  },
  {
    id: 'grants', label: 'Grants', icon: PenLine,
    allowedRoles: ['Admin', 'Field Staff'],
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
  view:          ViewId
  onNav:         (v: ViewId) => void
  collapsed:     boolean
  onToggle:      () => void
  user:          User
  isMobile:      boolean
  mobileOpen:    boolean
  onMobileClose: () => void
  pendingNav?:   ViewId | null
}

export function Sidebar({
  view, onNav, collapsed, onToggle, user,
  isMobile, mobileOpen, onMobileClose, pendingNav,
}: SidebarProps) {
  const desktopW = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  const visibleWorkspace = WORKSPACE_NAV.filter(item => item.allowedRoles.includes(user.role))
  const visibleFunding   = FUNDING_NAV.filter(item => item.allowedRoles.includes(user.role))
  const visibleSystem    = SYSTEM_NAV.filter(item => item.allowedRoles.includes(user.role))

  // On mobile: fixed overlay drawer that slides in/out
  // On desktop: static flex column
  const mobileStyle: React.CSSProperties = isMobile ? {
    position:   'fixed',
    top:         0,
    left:        0,
    height:     '100vh',
    width:       SPACING.sidebarW,
    zIndex:      200,
    transform:  mobileOpen ? 'translateX(0)' : `translateX(-${SPACING.sidebarW}px)`,
    transition: 'transform 0.25s ease',
    boxShadow:  mobileOpen ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
  } : {
    width:      desktopW,
    minWidth:   desktopW,
    height:     '100vh',
    transition: 'width 0.2s ease, min-width 0.2s ease',
    flexShrink:  0,
  }

  // On mobile nav click: close drawer then navigate
  function handleNav(v: ViewId) {
    if (isMobile) onMobileClose()
    onNav(v)
  }

  return (
    <aside
      style={{
        background:      COLORS.forest,
        display:         'flex',
        flexDirection:   'column',
        overflow:        'hidden',
        ...mobileStyle,
      }}
    >
      {/* Logo row */}
      <div
        style={{
          height:       SPACING.topbarH,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      '0 16px',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          flexShrink:   0,
        }}
      >
        {/* Desktop collapsed shows symbol; otherwise full logo */}
        {!isMobile && collapsed
          ? <OmanyeSymbol size={32} />
          : <OmanyeLogo size="sm" showTagline={false} variant="dark" />
        }

        {/* Mobile: close button */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            aria-label="Close menu"
            style={{
              display:        'flex', alignItems: 'center', justifyContent: 'center',
              width:           36, height: 36,
              borderRadius:    8,
              background:     'transparent',
              border:         'none',
              color:          COLORS.stone,
              cursor:         'pointer',
              flexShrink:      0,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}
        className="scrollbar-hidden"
      >
        {/* On desktop collapsed, hide labels */}
        {!((!isMobile) && collapsed) && (
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
            pending={pendingNav === item.id}
            collapsed={!isMobile && collapsed}
            onNav={handleNav}
          />
        ))}

        {visibleFunding.length > 0 && (
          <>
            <div style={{ margin: '12px 0', borderTop: `1px solid rgba(255,255,255,0.06)` }} />
            {!((!isMobile) && collapsed) && (
              <p style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'rgba(212,175,92,0.40)',
                padding: '0 16px 8px',
              }}>
                Funding
              </p>
            )}
            {visibleFunding.map(item => (
              <NavLink
                key={item.id}
                item={item}
                active={view === item.id}
                pending={pendingNav === item.id}
                collapsed={!isMobile && collapsed}
                onNav={handleNav}
              />
            ))}
          </>
        )}

        {visibleSystem.length > 0 && (
          <>
            <div style={{ margin: '12px 0', borderTop: `1px solid rgba(255,255,255,0.06)` }} />
            {!((!isMobile) && collapsed) && (
              <p style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: 'rgba(212,175,92,0.40)',
                padding: '0 16px 8px',
              }}>
                System
              </p>
            )}
            {visibleSystem.map(item => (
              <NavLink
                key={item.id}
                item={item}
                active={view === item.id}
                pending={pendingNav === item.id}
                collapsed={!isMobile && collapsed}
                onNav={handleNav}
              />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, flexShrink: 0 }}>
        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: (!isMobile && collapsed) ? '12px' : '12px 16px',
          overflow: 'hidden',
        }}>
          <Avatar name={user.name} size={30} style={{ flexShrink: 0 }} />
          {(isMobile || !collapsed) && (
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

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
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
              background: 'transparent',
              border: 'none',
              borderTop: `1px solid rgba(255,255,255,0.04)`,
              transition: 'color 0.15s',
              minHeight: 40,
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
        )}
      </div>
    </aside>
  )
}

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
  item, active, pending, collapsed, onNav,
}: { item: NavItem; active: boolean; pending: boolean; collapsed: boolean; onNav: (v: ViewId) => void }) {
  const Icon = item.icon
  const isActive = active || pending
  return (
    <button
      onClick={() => onNav(item.id)}
      title={collapsed ? item.label : undefined}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center',
        gap: 10,
        padding: collapsed ? '11px 0' : '11px 16px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderLeft: isActive ? `2px solid ${COLORS.sage}` : '2px solid transparent',
        background: isActive ? 'rgba(212,175,92,0.12)' : 'transparent',
        color: isActive ? COLORS.mint : '#A0AEC0',
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        cursor: pending ? 'wait' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        border: 'none',
        borderLeftStyle: 'solid',
        borderLeftWidth: 2,
        borderLeftColor: isActive ? COLORS.sage : 'transparent',
        minHeight: 44,
        opacity: pending && !active ? 0.85 : 1,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = '#1A2B4A'
          e.currentTarget.style.color = '#ffffff'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#A0AEC0'
        }
      }}
      aria-current={active ? 'page' : undefined}
      aria-busy={pending}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && pending && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: COLORS.gold,
          flexShrink: 0,
          animation: 'pulse 1s ease-in-out infinite',
        }} />
      )}
    </button>
  )
}
