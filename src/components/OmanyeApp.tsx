'use client'

import React, { useState, useCallback } from 'react'
import { Sidebar }        from './Sidebar'
import { Topbar }         from './Topbar'
import { ToastProvider }  from './Toast'
import { ModalProvider }  from './Modal'
import { AuditProvider }  from '@/lib/useAuditLog'
import { COLORS, SPACING } from '@/lib/tokens'
import type {
  ViewId, User, Program, Dataset,
  Analysis, Document, TeamMember,
  DonorReport, AlertRule, CollectionPeriod,
} from '@/lib/types'

// Views
import { Onboarding }      from './views/Onboarding'
import { Dashboard }       from './views/Dashboard'
import { Programs }        from './views/Programs'
import { ProgramDetail }   from './views/ProgramDetail'
import { DataHub }         from './views/DataHub'
import { Analytics }       from './views/Analytics'
import { DonorReportView } from './views/DonorReport'
import { Documents }       from './views/Documents'
import { FieldStatus }     from './views/FieldStatus'
import { AuditTrail }      from './views/AuditTrail'
import { Team }            from './views/Team'
import { FieldMap }        from './views/FieldMap'
import { Settings }        from './views/Settings'

// ── App ───────────────────────────────────────────────────────────────────────

export function OmanyeApp() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)

  // App data — all start empty
  const [programs,   setPrograms]   = useState<Program[]>([])
  const [datasets,   setDatasets]   = useState<Dataset[]>([])
  const [analyses,   setAnalyses]   = useState<Analysis[]>([])
  const [documents,  setDocuments]  = useState<Document[]>([])
  const [team,       setTeam]       = useState<TeamMember[]>([])
  const [reports,    setReports]    = useState<DonorReport[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [periods,    setPeriods]    = useState<CollectionPeriod[]>([])

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
        <AuditProvider>
          <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.snow }}>
            <Sidebar
              view={view}
              onNav={(v) => navigate(v)}
              collapsed={collapsed}
              onToggle={() => setCollapsed(c => !c)}
              user={user}
            />

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              marginLeft: sidebarW,
              transition: 'margin-left 0.2s ease',
            }}>
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
                  reports={reports}        setReports={setReports}
                  alertRules={alertRules}  setAlertRules={setAlertRules}
                  periods={periods}        setPeriods={setPeriods}
                />
              </main>
            </div>
          </div>
        </AuditProvider>
      </ModalProvider>
    </ToastProvider>
  )
}

// ── ViewRouter ────────────────────────────────────────────────────────────────

interface RouterProps {
  view:        ViewId
  programId:   number | null
  navigate:    (v: ViewId, pid?: number) => void
  user:        User
  setUser:     (u: User) => void
  programs:    Program[];          setPrograms:   React.Dispatch<React.SetStateAction<Program[]>>
  datasets:    Dataset[];          setDatasets:   React.Dispatch<React.SetStateAction<Dataset[]>>
  analyses:    Analysis[];         setAnalyses:   React.Dispatch<React.SetStateAction<Analysis[]>>
  documents:   Document[];         setDocuments:  React.Dispatch<React.SetStateAction<Document[]>>
  team:        TeamMember[];       setTeam:       React.Dispatch<React.SetStateAction<TeamMember[]>>
  reports:     DonorReport[];      setReports:    React.Dispatch<React.SetStateAction<DonorReport[]>>
  alertRules:  AlertRule[];        setAlertRules: React.Dispatch<React.SetStateAction<AlertRule[]>>
  periods:     CollectionPeriod[]; setPeriods:    React.Dispatch<React.SetStateAction<CollectionPeriod[]>>
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
    case 'reports':
      return (
        <DonorReportView
          reports={p.reports}
          setReports={p.setReports}
          programs={p.programs}
          user={p.user}
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
    case 'fieldstatus':
      return (
        <FieldStatus
          periods={p.periods}
          setPeriods={p.setPeriods}
          team={p.team}
          user={p.user}
        />
      )
    case 'audit':
      return <AuditTrail />
    case 'team':
      return (
        <Team
          team={p.team}
          setTeam={p.setTeam}
        />
      )
    case 'map':
      return <FieldMap />
    case 'settings':
      return (
        <Settings
          user={p.user}
          setUser={p.setUser}
          alertRules={p.alertRules}
          setAlertRules={p.setAlertRules}
          programs={p.programs}
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
