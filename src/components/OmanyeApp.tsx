'use client'

import React, { useState, useCallback } from 'react'
import { Sidebar }      from './Sidebar'
import { Topbar }       from './Topbar'
import { ToastProvider } from './Toast'
import { ModalProvider } from './Modal'
import { COLORS, SPACING } from '@/lib/tokens'
import type {
  ViewId, User, Program, Dataset,
  Analysis, Document, TeamMember,
} from '@/lib/types'

// Views
import { Onboarding }    from './views/Onboarding'
import { Dashboard }     from './views/Dashboard'
import { Programs }      from './views/Programs'
import { ProgramDetail } from './views/ProgramDetail'
import { DataHub }       from './views/DataHub'
import { Analytics }     from './views/Analytics'
import { Documents }     from './views/Documents'
import { Team }          from './views/Team'
import { FieldMap }      from './views/FieldMap'
import { Settings }      from './views/Settings'

// ── App ───────────────────────────────────────────────────────────────────────

export function OmanyeApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)

  // App data — all start empty
  const [programs,  setPrograms]  = useState<Program[]>([])
  const [datasets,  setDatasets]  = useState<Dataset[]>([])
  const [analyses,  setAnalyses]  = useState<Analysis[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [team,      setTeam]      = useState<TeamMember[]>([])

  // Navigation
  const [view,      setView]      = useState<ViewId>('dashboard')
  const [programId, setProgramId] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const navigate = useCallback((v: ViewId, pid?: number) => {
    setView(v)
    if (pid !== undefined) setProgramId(pid)
  }, [])

  const sidebarW = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  // ── Onboarding ──────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <ToastProvider>
        <ModalProvider>
          <Onboarding onComplete={(u) => setUser(u)} />
        </ModalProvider>
      </ToastProvider>
    )
  }

  // ── App shell ───────────────────────────────────────────────────────────────

  return (
    <ToastProvider>
      <ModalProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.snow }}>
          <Sidebar
            view={view}
            onNav={(v) => navigate(v)}
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            user={user}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Topbar
              view={view}
              sidebarW={sidebarW}
              user={user}
              onSettings={() => navigate('settings')}
              onSignOut={() => setUser(null)}
            />

            <main
              style={{
                flex: 1,
                marginTop: SPACING.topbarH,
                padding: SPACING.pagePad,
                overflowY: 'auto',
              }}
              key={view + (programId ?? '')}
            >
              <ViewRouter
                view={view}
                programId={programId}
                navigate={navigate}
                user={user}
                setUser={setUser}
                programs={programs}      setPrograms={setPrograms}
                datasets={datasets}      setDatasets={setDatasets}
                analyses={analyses}      setAnalyses={setAnalyses}
                documents={documents}    setDocuments={setDocuments}
                team={team}              setTeam={setTeam}
              />
            </main>
          </div>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}

// ── ViewRouter ────────────────────────────────────────────────────────────────

interface RouterProps {
  view:       ViewId
  programId:  number | null
  navigate:   (v: ViewId, pid?: number) => void
  user:       User
  setUser:    (u: User) => void
  programs:   Program[];   setPrograms:  React.Dispatch<React.SetStateAction<Program[]>>
  datasets:   Dataset[];   setDatasets:  React.Dispatch<React.SetStateAction<Dataset[]>>
  analyses:   Analysis[];  setAnalyses:  React.Dispatch<React.SetStateAction<Analysis[]>>
  documents:  Document[];  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  team:       TeamMember[]; setTeam:     React.Dispatch<React.SetStateAction<TeamMember[]>>
}

function ViewRouter(p: RouterProps) {
  switch (p.view) {
    case 'dashboard':
      return (
        <Dashboard
          user={p.user}
          programs={p.programs}
          datasets={p.datasets}
          team={p.team}
          onNavigate={p.navigate}
        />
      )
    case 'programs':
      return (
        <Programs
          programs={p.programs}
          setPrograms={p.setPrograms}
          onSelect={(id) => p.navigate('program-detail', id)}
        />
      )
    case 'program-detail': {
      const prog = p.programs.find(x => x.id === p.programId) ?? null
      return (
        <ProgramDetail
          program={prog}
          onBack={() => p.navigate('programs')}
          onUpdate={(updated) =>
            p.setPrograms(ps => ps.map(x => x.id === updated.id ? updated : x))
          }
        />
      )
    }
    case 'data-hub':
      return (
        <DataHub
          datasets={p.datasets}
          setDatasets={p.setDatasets}
          programs={p.programs}
        />
      )
    case 'analytics':
      return (
        <Analytics
          analyses={p.analyses}
          setAnalyses={p.setAnalyses}
          datasets={p.datasets}
        />
      )
    case 'documents':
      return (
        <Documents
          documents={p.documents}
          setDocuments={p.setDocuments}
          programs={p.programs}
          user={p.user}
        />
      )
    case 'team':
      return (
        <Team
          team={p.team}
          setTeam={p.setTeam}
        />
      )
    case 'field-map':
      return <FieldMap />
    case 'settings':
      return (
        <Settings
          user={p.user}
          setUser={p.setUser}
        />
      )
    default:
      return (
        <Dashboard
          user={p.user}
          programs={p.programs}
          datasets={p.datasets}
          team={p.team}
          onNavigate={p.navigate}
        />
      )
  }
}
