import React from 'react'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { BeneficiaryChart } from '@/components/dashboard/BeneficiaryChart'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { ProjectsSnapshot } from '@/components/dashboard/ProjectsSnapshot'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { STATS } from '@/lib/mock-data'

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="page-title">Good morning, Amara</h2>
        <p className="page-subtitle">Here's what's happening across your programs today.</p>
      </div>

      {/* Stats row */}
      <StatsGrid />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <BeneficiaryChart />
        </div>
        <div>
          <SpendingChart />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Projects snapshot */}
        <div className="lg:col-span-2">
          <ProjectsSnapshot />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Budget utilization */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Budget Overview</CardTitle>
                <CardSubtitle>FY 2024 consolidated</CardSubtitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              <ProgressBar label="WASH" value={62} showPct color="green" />
              <ProgressBar label="Education" value={73} showPct color="green" />
              <ProgressBar label="Health" value={89} showPct color="gold" />
              <ProgressBar label="Livelihoods" value={5}  showPct color="blue" />
              <ProgressBar label="Protection" value={76} showPct color="green" />
            </div>
            <div className="mt-4 pt-3 border-t border-mist flex items-center justify-between text-xs text-fern/60">
              <span>Overall utilization</span>
              <span className="font-mono font-semibold text-forest">{STATS.budgetUtilized}%</span>
            </div>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
