'use client'

import React, { useState } from 'react'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewId } from '@/lib/types'

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  dashboard:      { title: 'Dashboard',       subtitle: 'Overview of your NGO operations' },
  programs:       { title: 'Programs',         subtitle: 'Manage field programs and activities' },
  'program-detail':{ title: 'Program Detail',  subtitle: 'Indicators, budget, team, and activity' },
  'data-hub':     { title: 'Data Hub',         subtitle: 'Collect and validate field submissions' },
  analytics:      { title: 'Analytics',        subtitle: 'Visualize impact trends and financials' },
  documents:      { title: 'Documents',        subtitle: 'Reports, proposals, and agreements' },
  team:           { title: 'Team',             subtitle: 'Manage members and permissions' },
  'field-map':    { title: 'Field Map',        subtitle: 'Geographic view of program activities' },
  settings:       { title: 'Settings',         subtitle: 'Configure your workspace' },
}

interface TopbarProps {
  currentView:    ViewId
  sidebarW:       number      // px, for left offset
  onNewAction?:   () => void
  onMobileMenu?:  () => void
}

export function Topbar({ currentView, sidebarW, onNewAction, onMobileMenu }: TopbarProps) {
  const [query, setQuery] = useState('')
  const meta = VIEW_META[currentView]

  return (
    <header
      className="fixed top-0 right-0 bg-white/92 backdrop-blur-sm border-b border-mist z-40 flex items-center justify-between px-5 transition-[left] duration-300"
      style={{ left: sidebarW, height: 60 }}
    >
      {/* Mobile menu button */}
      <button
        className="lg:hidden mr-3 w-8 h-8 rounded-lg flex items-center justify-center text-fern/60 hover:bg-foam transition-colors"
        onClick={onMobileMenu}
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-fraunces text-[17px] font-semibold text-forest leading-tight truncate">
          {meta.title}
        </h1>
        <p className="text-[11px] text-fern/55 mt-0.5 hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={13} className="absolute left-3 text-fern/35 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={cn(
              'pl-8 pr-3 py-1.5 text-sm rounded-lg border border-mist bg-snow text-forest',
              'placeholder:text-forest/35 focus:outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss',
              'transition-all w-44 focus:w-56'
            )}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-fern/50 hover:bg-foam hover:text-fern transition-colors"
          aria-label="Notifications"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sage border border-white" />
        </button>

        {/* Quick action */}
        {onNewAction && (
          <button
            onClick={onNewAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-moss text-white text-xs font-semibold hover:bg-fern transition-colors"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New</span>
          </button>
        )}
      </div>
    </header>
  )
}
