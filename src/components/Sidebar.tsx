'use client'

import React from 'react'
import {
  LayoutDashboard, FolderOpen, Database, BarChart3,
  FileText, Users, Map, Settings, ChevronRight,
  Bell, LogOut, ChevronLeft, ChevronRightIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OmanyeLogo, OmanyeSymbol } from './Logo'
import type { ViewId } from '@/lib/types'

// ── Nav definition ────────────────────────────────────────────────────────────

interface NavItem {
  id:       ViewId
  label:    string
  Icon:     React.ElementType
  section:  string
  badge?:   string | number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',      Icon: LayoutDashboard, section: 'ops' },
  { id: 'programs',     label: 'Programs',        Icon: FolderOpen,      section: 'ops', badge: 6 },
  { id: 'data-hub',     label: 'Data Hub',        Icon: Database,        section: 'ops' },
  { id: 'field-map',    label: 'Field Map',       Icon: Map,             section: 'ops' },
  { id: 'analytics',    label: 'Analytics',       Icon: BarChart3,       section: 'reporting' },
  { id: 'documents',    label: 'Documents',       Icon: FileText,        section: 'reporting', badge: 'New' },
  { id: 'team',         label: 'Team',            Icon: Users,           section: 'admin' },
  { id: 'settings',     label: 'Settings',        Icon: Settings,        section: 'admin' },
]

const SECTIONS = [
  { key: 'ops',       label: 'Operations' },
  { key: 'reporting', label: 'Reporting'  },
  { key: 'admin',     label: 'Admin'      },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  currentView: ViewId
  onNavigate:  (view: ViewId) => void
  collapsed:   boolean
  onToggle:    () => void
}

export function Sidebar({ currentView, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-forest flex flex-col z-50 border-r border-canopy transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        'flex items-center border-b border-canopy flex-shrink-0 h-[60px]',
        collapsed ? 'justify-center px-0' : 'px-4 gap-3'
      )}>
        {collapsed
          ? <OmanyeSymbol size={34} />
          : <OmanyeLogo size="sm" variant="dark" showTagline />
        }
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-4 space-y-5">
        {SECTIONS.map(sec => {
          const items = NAV_ITEMS.filter(i => i.section === sec.key)
          return (
            <div key={sec.key} className={cn(collapsed ? 'px-2' : 'px-3')}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-bold tracking-widest uppercase text-mint/25 select-none">
                  {sec.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map(item => {
                  const active = currentView === item.id
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onNavigate(item.id)}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 select-none',
                          collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                          active
                            ? 'bg-moss text-white'
                            : 'text-mint/75 hover:bg-canopy hover:text-mint'
                        )}
                      >
                        <item.Icon className={cn('flex-shrink-0', active ? 'opacity-100' : 'opacity-70', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className={cn(
                                'px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
                                item.badge === 'New'
                                  ? 'bg-gold/20 text-gold'
                                  : 'bg-white/10 text-mint/70'
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn('px-3 pb-1 flex-shrink-0', collapsed && 'flex justify-center px-0 pb-1')}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-mint/40 hover:text-mint hover:bg-canopy transition-colors text-xs"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* User footer */}
      <div className={cn('border-t border-canopy flex-shrink-0', collapsed ? 'py-3 flex justify-center' : 'px-3 py-3')}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white text-xs font-bold">
            AO
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-mint font-semibold truncate">Amara Osei</p>
              <p className="text-[10px] text-mint/45 truncate">Coordinator</p>
            </div>
            <button className="text-mint/40 hover:text-mint transition-colors" aria-label="Notifications">
              <Bell size={13} />
            </button>
            <button className="text-mint/40 hover:text-red-400 transition-colors" aria-label="Log out">
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
