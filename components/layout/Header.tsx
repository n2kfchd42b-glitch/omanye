'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Search, Bell, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':               { title: 'Dashboard',       subtitle: 'Overview of your NGO operations' },
  '/projects':       { title: 'Projects',         subtitle: 'Manage field projects and activities' },
  '/beneficiaries':  { title: 'Beneficiaries',    subtitle: 'Track program participants and outcomes' },
  '/field-data':     { title: 'Field Data',        subtitle: 'Collect and review field submissions' },
  '/reports':        { title: 'Impact Reports',    subtitle: 'Generate and share impact reports' },
  '/donors':         { title: 'Donors',            subtitle: 'Manage donor relationships and giving' },
  '/grants':         { title: 'Grants',            subtitle: 'Track grant applications and timelines' },
  '/team':           { title: 'Team',              subtitle: 'Manage team members and permissions' },
  '/settings':       { title: 'Settings',          subtitle: 'Configure workspace preferences' },
}

export function Header() {
  const pathname = usePathname()
  const meta = PAGE_TITLES[pathname] ?? { title: 'OMANYE', subtitle: '' }

  return (
    <header
      className="fixed top-0 right-0 bg-white/90 backdrop-blur-sm border-b border-mist z-40 flex items-center justify-between px-6"
      style={{
        left: 'var(--sidebar-w)',
        height: 'var(--header-h)',
      }}
    >
      {/* Page title */}
      <div>
        <h1 className="font-fraunces text-lg font-semibold text-forest leading-tight">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="text-xs text-fern/60 mt-0.5">{meta.subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3 text-fern/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-mist bg-snow text-forest
                       placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-moss/30
                       focus:border-moss w-52 transition-all"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-fern/60
                     hover:bg-foam hover:text-fern transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sage border-2 border-white" />
        </button>

        {/* Quick add */}
        <button
          className="btn-primary py-1.5 px-3 text-xs"
          aria-label="New entry"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </header>
  )
}
