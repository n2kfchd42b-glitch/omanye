'use client'

import React, { useState, useCallback, useTransition, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastProvider } from './Toast'
import { ModalProvider } from './Modal'
import { COLORS, SPACING } from '@/lib/tokens'
import type { ViewId, User } from '@/lib/types'

// ── Pending nav context ───────────────────────────────────────────────────────

const PendingNavContext = React.createContext<ViewId | null>(null)
export function usePendingNav() { return React.useContext(PendingNavContext) }

// ── Path → ViewId mapping ────────────────────────────────────────────────────

function deriveViewId(pathname: string, searchView?: string | null): ViewId {
  if (searchView) {
    const valid: ViewId[] = ['data-hub', 'analytics', 'fieldstatus', 'documents', 'map']
    if (valid.includes(searchView as ViewId)) return searchView as ViewId
  }

  if (pathname.includes('/programs/') && pathname.includes('/field')) return 'fieldstatus'
  if (pathname.includes('/programs/') && pathname.includes('/mae'))   return 'analytics'
  if (pathname.includes('/programs'))  return 'programs'
  if (pathname.includes('/donors'))    return 'donors'
  if (pathname.includes('/matches'))   return 'matches'
  if (pathname.includes('/funders'))   return 'funders'
  if (pathname.includes('/grants'))    return 'grants'
  if (pathname.includes('/impact'))    return 'impact'
  if (pathname.includes('/reports'))   return 'reports'
  if (pathname.includes('/team'))      return 'team'
  if (pathname.includes('/settings'))  return 'settings'
  if (pathname.includes('/audit'))     return 'audit'
  if (pathname.includes('/field'))     return 'fieldstatus'
  return 'dashboard'
}

// ── AppShell ─────────────────────────────────────────────────────────────────

interface AppShellProps {
  user:     User
  orgSlug:  string
  children: React.ReactNode
}

export default function AppShell({ user, orgSlug, children }: AppShellProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Desktop: collapsed icon-only sidebar
  const [collapsed,      setCollapsed]      = useState(false)
  // Mobile: slide-out drawer open/closed
  const [mobileOpen,     setMobileOpen]     = useState(false)
  // Whether viewport is mobile-sized
  const [isMobile,       setIsMobile]       = useState(false)
  // Track which view was clicked for optimistic active state
  const [pendingNav,     setPendingNav]     = useState<ViewId | null>(null)

  const [isPending, startTransition] = useTransition()

  // Detect and track mobile breakpoint (768px)
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close mobile drawer when navigating
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const routerView = deriveViewId(pathname, searchParams.get('view'))
  // Show pending nav item as active immediately on click (optimistic)
  const activeView = pendingNav ?? routerView
  // On mobile, the sidebar is an overlay — main content always takes full width
  const sidebarW   = isMobile ? 0 : (collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW)

  // Clear pending state when navigation completes
  useEffect(() => { if (!isPending) setPendingNav(null) }, [isPending])

  const navigate = useCallback((v: ViewId) => {
    const routes: Partial<Record<ViewId, string>> = {
      dashboard:   `/org/${orgSlug}/dashboard`,
      programs:    `/org/${orgSlug}/programs`,
      donors:      `/org/${orgSlug}/donors`,
      matches:     `/org/${orgSlug}/matches`,
      funders:     `/org/${orgSlug}/funders`,
      grants:      `/org/${orgSlug}/grants`,
      impact:      `/org/${orgSlug}/impact`,
      reports:     `/org/${orgSlug}/reports`,
      team:        `/org/${orgSlug}/team`,
      settings:    `/org/${orgSlug}/settings`,
      audit:       `/org/${orgSlug}/audit`,
      fieldstatus: `/org/${orgSlug}/field`,
    }

    setPendingNav(v)
    startTransition(() => {
      if (routes[v]) {
        router.push(routes[v]!)
        return
      }
      router.push(`/org/${orgSlug}/dashboard?view=${v}`)
    })
  }, [orgSlug, router])

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      const { signOut } = await import('@/app/actions/auth')
      await signOut()
    })
  }, [])

  return (
    <PendingNavContext.Provider value={pendingNav}>
    <ToastProvider>
      <ModalProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: COLORS.snow }}>
          {/* Mobile backdrop — closes sidebar when tapping outside */}
          {isMobile && mobileOpen && (
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 150,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(2px)',
              }}
              aria-hidden="true"
            />
          )}

          <Sidebar
            view={activeView}
            onNav={navigate}
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            user={user}
            isMobile={isMobile}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            pendingNav={pendingNav}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Topbar
              view={activeView}
              sidebarW={sidebarW}
              user={user}
              orgSlug={orgSlug}
              isMobile={isMobile}
              onHamburger={() => setMobileOpen(o => !o)}
              onSettings={() => navigate('settings')}
              onSignOut={handleSignOut}
            />

            <main style={{
              flex: 1,
              marginTop: SPACING.topbarH,
              padding: isMobile ? '16px 12px' : SPACING.pagePad,
              overflowY: 'auto',
              background: COLORS.forest,
              color: COLORS.charcoal,
            }}>
              {children}
            </main>
          </div>
        </div>
      </ModalProvider>
    </ToastProvider>
    </PendingNavContext.Provider>
  )
}
