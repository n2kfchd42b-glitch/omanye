import { requireOrgAuth } from '@/lib/auth/server'
import OmanyeWorkspace from './OmanyeWorkspace'
import type { UserRole } from '@/lib/types'

interface Props {
  params: { slug: string }
}

export interface DashboardStats {
  activePrograms:   number
  totalIndicators:  number
  activeDonors:     number
  pendingRequests:  number
  healthSummary:    { green: number; amber: number; red: number; unscored: number } | null
}

export interface ActivityItem {
  id:        string
  type:      'indicator_update' | 'program_update' | 'expenditure' | 'access_request'
  title:     string
  subtitle:  string
  timestamp: string
}

export default async function OrgDashboardPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  const orgId   = org.id
  const orgName = org.name
  const orgSlug = org.slug

  // ── Fetch dashboard stats in parallel ───────────────────────────────────────
  const [
    activeProgramsResult,
    indicatorsResult,
    activeDonorsResult,
    pendingRequestsResult,
    healthScoreRows,
  ] = await Promise.all([
    supabase
      .from('programs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'ACTIVE')
      .is('deleted_at', null),

    supabase
      .from('indicators')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    supabase
      .from('donor_program_access')
      .select('donor_id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('active', true),

    supabase
      .from('donor_access_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'PENDING'),

    supabase
      .from('program_health_scores')
      .select('program_id, rag_status')
      .eq('organization_id', orgId)
      .order('calculated_at', { ascending: false })
      .limit(500),
  ])

  // Deduplicate to latest score per program, then count by RAG status
  const seenPrograms = new Set<string>()
  const latestScores: Array<{ program_id: string; rag_status: string }> = []
  for (const row of (healthScoreRows.data ?? []) as Array<{ program_id: string; rag_status: string }>) {
    if (!seenPrograms.has(row.program_id)) {
      seenPrograms.add(row.program_id)
      latestScores.push(row)
    }
  }

  const activeCount = activeProgramsResult.count ?? 0
  const healthSummary = latestScores.length === 0 ? null : {
    green:    latestScores.filter(r => r.rag_status === 'green').length,
    amber:    latestScores.filter(r => r.rag_status === 'amber').length,
    red:      latestScores.filter(r => r.rag_status === 'red').length,
    unscored: Math.max(0, activeCount - latestScores.length),
  }

  const stats: DashboardStats = {
    activePrograms:  activeCount,
    totalIndicators: indicatorsResult.count       ?? 0,
    activeDonors:    activeDonorsResult.count     ?? 0,
    pendingRequests: pendingRequestsResult.count  ?? 0,
    healthSummary,
  }

  // ── Fetch recent activity (last 10 events merged) ────────────────────────────
  const [indUpdates, progUpdates, expenditures, accessRequests] = await Promise.all([
    supabase
      .from('indicator_updates')
      .select('id, indicator_id, new_value, submitted_at, indicators(name)')
      .eq('organization_id', orgId)
      .order('submitted_at', { ascending: false })
      .limit(5),

    supabase
      .from('program_updates')
      .select('id, title, update_type, published_at, program_id, programs(name)')
      .eq('organization_id', orgId)
      .order('published_at', { ascending: false })
      .limit(5),

    supabase
      .from('expenditures')
      .select('id, description, amount, currency, created_at, programs(name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('donor_access_requests')
      .select('id, status, created_at, programs(name), profiles(full_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Merge and sort by timestamp
  const activityItems: ActivityItem[] = []

  for (const row of (indUpdates.data ?? []) as Record<string, unknown>[]) {
    const ind = row.indicators as Record<string, unknown> | null
    activityItems.push({
      id:        row.id as string,
      type:      'indicator_update',
      title:     `Indicator updated: ${ind?.name ?? 'Unknown'}`,
      subtitle:  `New value: ${row.new_value}`,
      timestamp: row.submitted_at as string,
    })
  }

  for (const row of (progUpdates.data ?? []) as Record<string, unknown>[]) {
    const prog = row.programs as Record<string, unknown> | null
    activityItems.push({
      id:        row.id as string,
      type:      'program_update',
      title:     row.title as string,
      subtitle:  prog?.name ? `${prog.name}` : 'Program update',
      timestamp: (row.published_at ?? row.created_at) as string,
    })
  }

  for (const row of (expenditures.data ?? []) as Record<string, unknown>[]) {
    const prog = row.programs as Record<string, unknown> | null
    activityItems.push({
      id:        row.id as string,
      type:      'expenditure',
      title:     `Expenditure: ${row.description ?? 'No description'}`,
      subtitle:  `${row.currency} ${(row.amount as number).toLocaleString()}${prog?.name ? ` · ${prog.name}` : ''}`,
      timestamp: row.created_at as string,
    })
  }

  for (const row of (accessRequests.data ?? []) as Record<string, unknown>[]) {
    const prof = row.profiles as Record<string, unknown> | null
    const prog = row.programs as Record<string, unknown> | null
    activityItems.push({
      id:        row.id as string,
      type:      'access_request',
      title:     `Access request from ${prof?.full_name ?? 'Donor'}`,
      subtitle:  `${prog?.name ?? 'Program'} · ${row.status}`,
      timestamp: row.created_at as string,
    })
  }

  activityItems.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <OmanyeWorkspace
      initialUser={{
        name:  user.profile.full_name ?? orgName,
        email: user.email,
        org:   orgName,
        role:  mapRole(user.profile.role) as UserRole,
      }}
      orgSlug={orgSlug}
      orgId={orgId}
      initialStats={stats}
      recentActivity={activityItems.slice(0, 10)}
    />
  )
}

function mapRole(role: string): UserRole {
  switch (role) {
    case 'NGO_ADMIN':  return 'Admin'
    case 'NGO_STAFF':  return 'Field Staff'
    case 'NGO_VIEWER': return 'Viewer'
    default:           return 'Viewer'
  }
}
