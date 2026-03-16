'use client'

import React, { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import type { DashboardStats, ActivityItem } from '@/app/(app)/org/[slug]/dashboard/page'

// Views
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

interface OmanyeAppProps {
  initialUser?:    User
  orgSlug?:        string
  orgId?:          string
  initialStats?:   DashboardStats
  recentActivity?: ActivityItem[]
}

export default function OmanyeApp({
  initialUser, orgSlug, orgId, initialStats, recentActivity,
}: OmanyeAppProps = {}) {
  const router = useRouter()
  // Auth state — seeded from real Supabase session when available
  const [user, setUser]   = useState<User | null>(initialUser ?? null)
  const [, startTransition] = useTransition()

  const handleSignOut = useCallback(() => {
    if (initialUser) {
      // Real auth — invoke server action to clear session
      startTransition(async () => {
        const { signOut } = await import('@/app/actions/auth')
        await signOut()
      })
    } else {
      setUser(null)
    }
  }, [initialUser])

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
    // programs and program-detail have dedicated App Router pages
    if (v === 'programs' && orgSlug) {
      router.push(`/org/${orgSlug}/programs`)
      return
    }
    if (v === 'program-detail' && orgSlug && pid !== undefined) {
      router.push(`/org/${orgSlug}/programs/${pid}`)
      return
    }
    // donors has a dedicated App Router page
    if (v === 'donors' && orgSlug) {
      router.push(`/org/${orgSlug}/donors`)
      return
    }
    // reports has a dedicated App Router page
    if (v === 'reports' && orgSlug) {
      router.push(`/org/${orgSlug}/reports`)
      return
    }
    // team has a dedicated App Router page
    if (v === 'team' && orgSlug) {
      router.push(`/org/${orgSlug}/team`)
      return
    }
    // settings has a dedicated App Router page
    if (v === 'settings' && orgSlug) {
      router.push(`/org/${orgSlug}/settings`)
      return
    }
    setView(v)
    if (pid !== undefined) setProgramId(pid)
  }, [orgSlug, router])

  const sidebarW = collapsed ? SPACING.sidebarWCollapsed : SPACING.sidebarW

  // ── No user — middleware handles redirect to /login; this is a safety net ───

  if (!user) {
    router.replace('/login')
    return null
  }

  // ── App shell ───────────────────────────────────────────────────────────────

  return (
    <ToastProvider>
      <ModalProvider>
        <AuditProvider>
          <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: COLORS.snow }}>
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
            }}>
              <Topbar
                view={view}
                sidebarW={sidebarW}
                user={user}
                orgSlug={orgSlug}
                onSettings={() => navigate('settings')}
                onSignOut={handleSignOut}
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
                  initialStats={initialStats}
                  recentActivity={recentActivity}
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
  initialStats?:   DashboardStats
  recentActivity?: ActivityItem[]
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
          stats={p.initialStats}
          recentActivity={p.recentActivity}
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
    case 'donors':
      return null  // Handled by App Router page at /org/[slug]/donors
    default:
      return (
        <Dashboard
          user={p.user}
          programs={p.programs}
          datasets={p.datasets}
          team={p.team}
          onNavigate={p.navigate}
          stats={p.initialStats}
          recentActivity={p.recentActivity}
        />
      )
  }
}
