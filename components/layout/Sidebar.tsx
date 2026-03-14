'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderOpen, Users, ClipboardList,
  BarChart3, HandHeart, Landmark, UserCog, Settings,
  ChevronRight, Bell, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OmanyeSymbol } from '@/components/logo/OmanyeLogo'
import { NAV_ITEMS, NAV_SECTIONS } from '@/lib/nav'

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, FolderOpen, Users, ClipboardList,
  BarChart3, HandHeart, Landmark, UserCog, Settings,
}

function NavIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? ChevronRight
  return <Icon className="nav-icon" />
}

function BadgePill({ value }: { value: string | number }) {
  const isNew = value === 'New'
  return (
    <span
      className={cn(
        'ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none',
        isNew
          ? 'bg-gold/20 text-gold'
          : 'bg-forest/30 text-mint/70'
      )}
    >
      {value}
    </span>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 bg-forest flex flex-col z-50 border-r border-canopy"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Logo header */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-canopy flex-shrink-0">
        <OmanyeSymbol size={36} />
        <div className="flex flex-col leading-none">
          <span
            className="font-semibold tracking-wider text-gold text-base"
            style={{ fontFamily: 'Palatino, "Palatino Linotype", Georgia, serif' }}
          >
            OMANYE
          </span>
          <span className="text-[8px] tracking-widest uppercase text-mint/60 mt-0.5">
            NGO Workspace
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hidden py-4 px-3 space-y-6">
        {NAV_SECTIONS.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section.key)
          return (
            <div key={section.key}>
              <p className="px-3 mb-1 text-[10px] font-bold tracking-widest uppercase text-mint/30 select-none">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {items.map(item => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn('nav-item', isActive && 'active')}
                      >
                        <NavIcon name={item.icon} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && <BadgePill value={item.badge} />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-canopy px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AO
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-mint font-medium truncate">Amara Osei</p>
            <p className="text-[10px] text-mint/50 truncate">Field Coordinator</p>
          </div>
          <button className="text-mint/40 hover:text-mint transition-colors" aria-label="Notifications">
            <Bell size={14} />
          </button>
          <button className="text-mint/40 hover:text-red-400 transition-colors" aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
