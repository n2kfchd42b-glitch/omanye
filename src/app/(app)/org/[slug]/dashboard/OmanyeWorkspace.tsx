'use client'

import OmanyeApp from '@/components/OmanyeApp'
import type { User } from '@/lib/types'
import type { DashboardStats, ActivityItem } from './page'

interface Props {
  initialUser:    User
  orgSlug:        string
  orgId:          string
  initialStats:   DashboardStats
  recentActivity: ActivityItem[]
}

// Thin client wrapper so the server component can pass the real auth user
// and live dashboard stats into OmanyeApp without making the page itself a client component.
export default function OmanyeWorkspace({
  initialUser, orgSlug, orgId, initialStats, recentActivity,
}: Props) {
  return (
    <OmanyeApp
      initialUser={initialUser}
      orgSlug={orgSlug}
      orgId={orgId}
      initialStats={initialStats}
      recentActivity={recentActivity}
    />
  )
}
