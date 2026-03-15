'use client'

import React from 'react'
import {
  LayoutDashboard, FolderOpen, Database, BarChart2,
  FileBarChart, FileText, RadioTower, ShieldCheck,
  Users, Map, Settings, ChevronLeft, ChevronRight,
  HandCoins,
} from 'lucide-react'
import { COLORS, SPACING } from '@/lib/tokens'
import { OmanyeLogo, OmanyeSymbol } from '@/components/Logo'
import { Avatar } from '@/components/atoms/Avatar'
import type { ViewId, User } from '@/lib/types'

// ── Nav config ────────────────────────────────────────────────────────────────

interface NavItem { id: ViewId; label: string; icon: React.ElementType }

const WORKSPACE_NAV: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'programs',    label: 'Programs',    icon: FolderOpen      },
  { id: 'donors',      label: 'Donors',      icon: HandCoins       },
  { id: 'data-hub',    label: 'Data Hub',    icon: Database        },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart2       },
  { id: 'reports',     label: 'Reports',     icon: FileBarChart    },
  { id: 'documents',   label: 'Documents',   icon: FileText        },
  { id: 'fieldstatus', label: 'Field Status',icon: RadioTower      },
  { id: 'audit',       label: 'Audit Trail', icon: ShieldCheck     },
  { id: 'team',        label: 'Team',        icon: Users           },
  { id: 'map',         label: 'Field Map',   icon: Map             },
]

const SYSTEM_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
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
            letterSpacing: '0.1em', color: 'rgba(125,212,160,0.40)',
            padding: '0 16px 8px',
          }}>
            Workspace
          </p>
        )}
        {WORKSPACE_NAV.map(item => (
          <NavLink
            key={item.id}
            item={item}
            active={view === item.id || (view === 'program-detail' && item.id === 'programs')}
            collapsed={collapsed}
            onNav={onNav}
          />
        ))}

        <div style={{ margin: '12px 0', borderTop: `1px solid rgba(255,255,255,0.06)` }} />

        {!collapsed && (
          <p style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'rgba(125,212,160,0.40)',
            padding: '0 16px 8px',
          }}>
            System
          </p>
        )}
        {SYSTEM_NAV.map(item => (
          <NavLink key={item.id} item={item} active={view === item.id} collapsed={collapsed} onNav={onNav} />
        ))}
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
            color: 'rgba(125,212,160,0.50)',
            fontSize: 11,
            cursor: 'pointer',
            borderTop: `1px solid rgba(255,255,255,0.04)`,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = COLORS.mint)}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(125,212,160,0.50)')}
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
        background: active ? 'rgba(26,92,58,0.22)' : 'transparent',
        color: active ? COLORS.mint : 'rgba(125,212,160,0.60)',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(19,56,40,0.80)'
          e.currentTarget.style.color = '#ffffff'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(125,212,160,0.60)'
        }
      }}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  )
}
