'use client'

import React, { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar }  from './Topbar'
import { ToastProvider } from './Toast'
import { ModalProvider }  from './Modal'
import { SPACING } from '@/lib/tokens'
import type { ViewId } from '@/lib/types'

// Views
import { Onboarding }     from './views/Onboarding'
import { Dashboard }      from './views/Dashboard'
import { Programs }       from './views/Programs'
import { ProgramDetail }  from './views/ProgramDetail'
import { DataHub }        from './views/DataHub'
import { Analytics }      from './views/Analytics'
import { Documents }      from './views/Documents'
import { Team }           from './views/Team'
import { FieldMap }       from './views/FieldMap'
import { Settings }       from './views/Settings'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavState {
  view:       ViewId
  programId?: string       // set when navigating to program-detail
}

// ── Root shell ────────────────────────────────────────────────────────────────

export function OmanyeApp() {
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [collapsed,      setCollapsed]      = useState(false)
  const [nav, setNav]  = useState<NavState>({ view: 'dashboard' })

  const sidebarW = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  const navigate = useCallback((view: ViewId, programId?: string) => {
    setNav({ view, programId })
  }, [])

  const handleNavItem = useCallback((view: ViewId) => navigate(view), [navigate])

  if (!onboardingDone) {
    return (
      <ToastProvider>
        <Onboarding onComplete={() => setOnboardingDone(true)} />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <ModalProvider>
        <div className="min-h-screen bg-snow">
          {/* Sidebar */}
          <Sidebar
            currentView={nav.view}
            onNavigate={handleNavItem}
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
          />

          {/* Topbar */}
          <Topbar
            currentView={nav.view}
            sidebarW={sidebarW}
            onNewAction={getNewAction(nav.view, navigate)}
          />

          {/* Main content */}
          <main
            className="min-h-screen pt-[60px] transition-[padding-left] duration-300"
            style={{ paddingLeft: sidebarW }}
          >
            <div
              className="p-6 animate-fade-in"
              style={{ maxWidth: SPACING.pageMaxW + 48 }}
              key={nav.view + (nav.programId ?? '')}
            >
              <ViewRouter nav={nav} navigate={navigate} />
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}

// ── View router ───────────────────────────────────────────────────────────────

interface ViewRouterProps {
  nav:      NavState
  navigate: (view: ViewId, programId?: string) => void
}

function ViewRouter({ nav, navigate }: ViewRouterProps) {
  switch (nav.view) {
    case 'dashboard':
      return <Dashboard onNavigate={navigate} />
    case 'programs':
      return <Programs onSelectProgram={id => navigate('program-detail', id)} />
    case 'program-detail':
      return (
        <ProgramDetail
          programId={nav.programId ?? ''}
          onBack={() => navigate('programs')}
        />
      )
    case 'data-hub':
      return <DataHub />
    case 'analytics':
      return <Analytics />
    case 'documents':
      return <Documents />
    case 'team':
      return <Team />
    case 'field-map':
      return <FieldMap />
    case 'settings':
      return <Settings />
    default:
      return <Dashboard onNavigate={navigate} />
  }
}

// ── New action per view ───────────────────────────────────────────────────────

function getNewAction(
  view: ViewId,
  navigate: (v: ViewId, id?: string) => void
): (() => void) | undefined {
  const actions: Partial<Record<ViewId, () => void>> = {
    programs:   () => navigate('programs'),
    'data-hub': () => navigate('data-hub'),
    documents:  () => navigate('documents'),
    team:       () => navigate('team'),
  }
  return actions[view]
}
