'use client'

import React, { useState, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastProvider } from './Toast'
import { ModalProvider } from './Modal'
import { COLORS, SPACING } from '@/lib/tokens'
import type { ViewId, User } from '@/lib/types'

// ── Path → ViewId mapping ────────────────────────────────────────────────────

function deriveViewId(pathname: string, searchView?: string | null): ViewId {
  // Check for OmanyeApp internal views via query param
  if (searchView) {
    const valid: ViewId[] = ['data-hub', 'analytics', 'fieldstatus', 'documents', 'map']
    if (valid.includes(searchView as ViewId)) return searchView as ViewId
  }

  if (pathname.includes('/programs/') && pathname.includes('/field')) return 'fieldstatus'
  if (pathname.includes('/programs/') && pathname.includes('/mae'))   return 'analytics'
  if (pathname.includes('/programs'))  return 'programs'
  if (pathname.includes('/donors'))    return 'donors'
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
  const [collapsed, setCollapsed] = useState(false)
  const [, startTransition] = useTransition()

  const activeView = deriveViewId(pathname, searchParams.get('view'))
  const sidebarW   = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  const navigate = useCallback((v: ViewId) => {
    // Views with dedicated App Router pages
    const routes: Partial<Record<ViewId, string>> = {
      dashboard:   `/org/${orgSlug}/dashboard`,
      programs:    `/org/${orgSlug}/programs`,
      donors:      `/org/${orgSlug}/donors`,
      reports:     `/org/${orgSlug}/reports`,
      team:        `/org/${orgSlug}/team`,
      settings:    `/org/${orgSlug}/settings`,
      audit:       `/org/${orgSlug}/audit`,
    }

    if (routes[v]) {
      router.push(routes[v]!)
      return
    }

    // Internal OmanyeApp views — navigate to dashboard with query param
    router.push(`/org/${orgSlug}/dashboard?view=${v}`)
  }, [orgSlug, router])

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      const { signOut } = await import('@/app/actions/auth')
      await signOut()
    })
  }, [])

  return (
    <ToastProvider>
      <ModalProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: COLORS.snow }}>
          <Sidebar
            view={activeView}
            onNav={navigate}
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            user={user}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Topbar
              view={activeView}
              sidebarW={sidebarW}
              user={user}
              orgSlug={orgSlug}
              onSettings={() => navigate('settings')}
              onSignOut={handleSignOut}
            />

            <main style={{
              flex: 1,
              marginTop: SPACING.topbarH,
              padding: SPACING.pagePad,
              overflowY: 'auto',
            }}>
              {children}
            </main>
          </div>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}
